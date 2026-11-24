import 'server-only';
import { banco } from '@/lib/contas';

/** Períodos do filtro do painel, em dias. */
export const PERIODOS = [7, 30, 90] as const;
export type Periodo = (typeof PERIODOS)[number];

export function lerPeriodo(valor: unknown): Periodo {
  const n = Number(Array.isArray(valor) ? valor[0] : valor);
  return (PERIODOS as readonly number[]).includes(n) ? (n as Periodo) : 30;
}

export function lerTexto(valor: unknown, max = 100): string {
  const v = Array.isArray(valor) ? valor[0] : valor;
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export function lerPagina(valor: unknown): number {
  const n = Math.floor(Number(Array.isArray(valor) ? valor[0] : valor));
  return Number.isFinite(n) && n >= 1 && n <= 10_000 ? n : 1;
}

export const POR_PAGINA = 50;

// Talhões guardados no JSON do app (app.dados_conta.estado->'talhoes'); tolera estado antigo sem a lista.
const TALHOES = "case jsonb_typeof(d.estado->'talhoes') when 'array' then d.estado->'talhoes' else '[]'::jsonb end";

// ---------- dashboard ----------

export interface Resumo {
  contas_total: number;
  contas_novas: number;
  contas_novas_antes: number;
  contas_ativas: number;
  talhoes: number;
  area_ha: number;
  anuncios_ativos: number;
  anuncios_novos: number;
  contatos: number;
  contatos_antes: number;
  vendas: number;
  vendas_antes: number;
  vendas_valor: number;
  comissao_aberta: number;
  comissao_aberta_n: number;
  comissao_recebida: number;
  nota_media: number | null;
  avaliacoes: number;
}

export async function resumo(dias: Periodo): Promise<Resumo> {
  const r = await banco().query<Resumo>(
    `with p as (select now() - make_interval(days => $1) as ini, now() - make_interval(days => $1 * 2) as ini_antes)
     select
       (select count(*)::int from app.conta where not demo) as contas_total,
       (select count(*)::int from app.conta, p where not demo and criado_em > p.ini) as contas_novas,
       (select count(*)::int from app.conta, p where not demo and criado_em > p.ini_antes and criado_em <= p.ini) as contas_novas_antes,
       (select count(*)::int from app.dados_conta d join app.conta c on c.id = d.conta_id, p where not c.demo and d.atualizado_em > p.ini) as contas_ativas,
       (select coalesce(sum(jsonb_array_length(${TALHOES})), 0)::int from app.dados_conta d join app.conta c on c.id = d.conta_id where not c.demo) as talhoes,
       (select coalesce(sum((t->>'areaHa')::numeric), 0)::float
          from app.dados_conta d join app.conta c on c.id = d.conta_id, jsonb_array_elements(${TALHOES}) t
         where not c.demo and jsonb_typeof(t->'areaHa') = 'number') as area_ha,
       (select count(*)::int from app.anuncio where situacao = 'ativo') as anuncios_ativos,
       (select count(*)::int from app.anuncio, p where criado_em > p.ini) as anuncios_novos,
       (select count(*)::int from app.contato_anuncio, p where criado_em > p.ini) as contatos,
       (select count(*)::int from app.contato_anuncio, p where criado_em > p.ini_antes and criado_em <= p.ini) as contatos_antes,
       (select count(*)::int from app.venda, p where vendido_em > p.ini) as vendas,
       (select count(*)::int from app.venda, p where vendido_em > p.ini_antes and vendido_em <= p.ini) as vendas_antes,
       (select coalesce(sum(valor_venda), 0)::float from app.venda, p where vendido_em > p.ini) as vendas_valor,
       (select coalesce(sum(comissao_valor), 0)::float from app.venda where comissao_paga_em is null) as comissao_aberta,
       (select count(*)::int from app.venda where comissao_paga_em is null and comissao_valor > 0) as comissao_aberta_n,
       (select coalesce(sum(comissao_valor), 0)::float from app.venda where comissao_paga_em is not null) as comissao_recebida,
       (select avg(nota)::float from app.avaliacao) as nota_media,
       (select count(*)::int from app.avaliacao) as avaliacoes`,
    [dias],
  );
  return r.rows[0];
}

export async function cadastrosPorDia(dias: Periodo): Promise<{ dia: string; n: number }[]> {
  const r = await banco().query<{ dia: string; n: number }>(
    `select to_char(d, 'YYYY-MM-DD') as dia, count(c.id)::int as n
       from generate_series((now() at time zone 'America/Sao_Paulo')::date - ($1::int - 1), (now() at time zone 'America/Sao_Paulo')::date, interval '1 day') d
       left join app.conta c on not c.demo and (c.criado_em at time zone 'America/Sao_Paulo')::date = d::date
      group by d order by d`,
    [dias],
  );
  return r.rows;
}

/** Ordem do funil: do visitante à venda de máquina. */
export const ETAPAS_FUNIL: { nome: string; rotulo: string }[] = [
  { nome: 'app_opened', rotulo: 'Abriu o app' },
  { nome: 'signup_completed', rotulo: 'Criou conta' },
  { nome: 'field_created', rotulo: 'Cadastrou talhão' },
  { nome: 'aha_reached', rotulo: 'Viu a previsão do talhão' },
  { nome: 'alerts_enabled', rotulo: 'Ligou os avisos' },
  { nome: 'listing_viewed', rotulo: 'Viu um anúncio' },
  { nome: 'listing_created', rotulo: 'Anunciou máquina' },
  { nome: 'seller_contacted', rotulo: 'Pediu contato do vendedor' },
  { nome: 'listing_sold', rotulo: 'Vendeu máquina' },
];

/** Pessoas (conta ou, sem conta, sessão do navegador) que passaram por cada etapa no período. */
export async function funil(dias: Periodo): Promise<{ nome: string; rotulo: string; n: number }[]> {
  const r = await banco().query<{ nome: string; n: number }>(
    `select nome, count(distinct coalesce(conta_id::text, sessao, id::text))::int as n
       from app.evento where criado_em > now() - make_interval(days => $1) and nome = any($2) group by nome`,
    [dias, ETAPAS_FUNIL.map((e) => e.nome)],
  );
  return ETAPAS_FUNIL.map((e) => ({ ...e, n: r.rows.find((l) => l.nome === e.nome)?.n ?? 0 }));
}

export async function anunciosPorCategoria(): Promise<{ categoria: string; n: number }[]> {
  const r = await banco().query<{ categoria: string; n: number }>(
    "select categoria, count(*)::int as n from app.anuncio where situacao = 'ativo' group by 1 order by 2 desc, 1",
  );
  return r.rows;
}

export interface Pendencias {
  comissoes: number;
  avaliacoes: number;
  anuncios: number;
  contatos: number;
  leads: number;
}

/** O sino do topo: o que pede atenção agora. */
export async function pendencias(): Promise<Pendencias> {
  const r = await banco().query<Pendencias>(
    `select (select count(*)::int from app.venda where comissao_paga_em is null and comissao_valor > 0) as comissoes,
            (select count(*)::int from app.avaliacao where criado_em > now() - interval '7 days') as avaliacoes,
            (select count(*)::int from app.anuncio where criado_em > now() - interval '1 day') as anuncios,
            (select count(*)::int from app.contato_anuncio where criado_em > now() - interval '1 day') as contatos,
            (select count(*)::int from app.lead where criado_em > now() - interval '1 day') as leads`,
  );
  return r.rows[0];
}

// ---------- usuários ----------

export type FiltroContas = 'reais' | 'admin' | 'demo' | 'todas';

export function lerFiltroContas(valor: unknown): FiltroContas {
  const v = lerTexto(valor, 10);
  return v === 'admin' || v === 'demo' || v === 'todas' ? v : 'reais';
}

export interface LinhaConta {
  id: string;
  nome: string;
  email: string;
  demo: boolean;
  admin: boolean;
  criado_em: Date;
  fonte: string | null;
  sincronizado_em: Date | null;
  talhoes: number;
  anuncios: number;
}

export async function contas(busca: string, filtro: FiltroContas, pagina: number): Promise<{ linhas: LinhaConta[]; total: number }> {
  const filtroSql = { reais: 'not c.demo', admin: 'c.admin', demo: 'c.demo', todas: 'true' }[filtro];
  const r = await banco().query<LinhaConta & { total: number }>(
    `select c.id, c.nome, c.email, c.demo, c.admin, c.criado_em,
            coalesce(c.origem->'primeiro'->>'utm_source', nullif(split_part(split_part(c.origem->'primeiro'->>'referrer', '://', 2), '/', 1), '')) as fonte,
            d.atualizado_em as sincronizado_em,
            coalesce(jsonb_array_length(${TALHOES}), 0)::int as talhoes,
            (select count(*)::int from app.anuncio a where a.conta_id = c.id and a.situacao <> 'removido') as anuncios,
            count(*) over ()::int as total
       from app.conta c left join app.dados_conta d on d.conta_id = c.id
      where ${filtroSql} and ($1 = '' or strpos(lower(c.nome || ' ' || c.email), lower($1)) > 0)
      order by c.criado_em desc limit $2 offset $3`,
    [busca, POR_PAGINA, (pagina - 1) * POR_PAGINA],
  );
  return { linhas: r.rows, total: r.rows[0]?.total ?? 0 };
}

export interface FichaConta {
  id: string;
  nome: string;
  email: string;
  demo: boolean;
  admin: boolean;
  criado_em: Date;
  origem: { primeiro?: Record<string, string> | null; ultimo?: Record<string, string> | null } | null;
  estado: Record<string, unknown> | null;
  sincronizado_em: Date | null;
}

export async function fichaConta(id: string): Promise<FichaConta | null> {
  const r = await banco().query<FichaConta>(
    `select c.id, c.nome, c.email, c.demo, c.admin, c.criado_em, c.origem, d.estado, d.atualizado_em as sincronizado_em
       from app.conta c left join app.dados_conta d on d.conta_id = c.id where c.id = $1`,
    [id],
  );
  return r.rows[0] ?? null;
}

export async function eventosDaConta(id: string): Promise<{ nome: string; criado_em: Date; pagina: string | null }[]> {
  const r = await banco().query<{ nome: string; criado_em: Date; pagina: string | null }>(
    'select nome, criado_em, pagina from app.evento where conta_id = $1 order by criado_em desc limit 30',
    [id],
  );
  return r.rows;
}

// ---------- anúncios ----------

export const SITUACOES_ANUNCIO = ['ativo', 'pausado', 'vendido', 'removido'] as const;

export interface LinhaAnuncioAdmin {
  id: string;
  titulo: string;
  categoria: string;
  preco: string;
  municipio: string;
  uf: string;
  situacao: string;
  foto: string | null;
  criado_em: Date;
  conta_id: string;
  vendedor: string;
  contatos: number;
}

export async function anunciosAdmin(
  busca: string,
  situacao: string,
  categoria: string,
  pagina: number,
  contaId: string | null = null,
): Promise<{ linhas: LinhaAnuncioAdmin[]; total: number }> {
  const r = await banco().query<LinhaAnuncioAdmin & { total: number }>(
    `select a.id, a.titulo, a.categoria, a.preco, a.municipio, a.uf, a.situacao, a.fotos[1] as foto, a.criado_em, a.conta_id, c.nome as vendedor,
            (select count(*)::int from app.contato_anuncio x where x.anuncio_id = a.id) as contatos,
            count(*) over ()::int as total
       from app.anuncio a join app.conta c on c.id = a.conta_id
      where ($1 = '' or strpos(lower(a.titulo || ' ' || a.municipio || ' ' || c.nome), lower($1)) > 0)
        and ($2 = '' or a.situacao = $2) and ($3 = '' or a.categoria = $3) and ($6::uuid is null or a.conta_id = $6)
      order by a.criado_em desc limit $4 offset $5`,
    [busca, situacao, categoria, POR_PAGINA, (pagina - 1) * POR_PAGINA, contaId],
  );
  return { linhas: r.rows, total: r.rows[0]?.total ?? 0 };
}

// ---------- vendas e comissões ----------

export type FiltroVendas = 'aberto' | 'pago' | 'todas';

/** Sem comissão (venda grátis), a lista abre em "todas"; com comissão, em "a receber". */
export function lerFiltroVendas(valor: unknown, padrao: FiltroVendas = 'aberto'): FiltroVendas {
  const v = lerTexto(valor, 10);
  return v === 'pago' || v === 'todas' || v === 'aberto' ? v : padrao;
}

export interface LinhaVenda {
  anuncio_id: string;
  conta_id: string | null;
  titulo: string;
  categoria: string;
  valor_venda: string;
  comissao_percentual: string;
  comissao_valor: string;
  vendedor_nome: string;
  vendedor_email: string;
  whatsapp: string | null;
  vendido_em: Date;
  comissao_paga_em: Date | null;
}

export async function vendas(filtro: FiltroVendas, limite = 500): Promise<LinhaVenda[]> {
  const onde = { aberto: 'comissao_paga_em is null and comissao_valor > 0', pago: 'comissao_paga_em is not null', todas: 'true' }[filtro];
  const r = await banco().query<LinhaVenda>(`select * from app.venda where ${onde} order by vendido_em desc limit $1`, [limite]);
  return r.rows;
}

export async function totaisVendas(): Promise<{ n: number; valor: number; devida: number; recebida: number; aberta: number }> {
  const r = await banco().query<{ n: number; valor: number; devida: number; recebida: number; aberta: number }>(
    `select count(*)::int as n, coalesce(sum(valor_venda), 0)::float as valor, coalesce(sum(comissao_valor), 0)::float as devida,
            coalesce(sum(comissao_valor) filter (where comissao_paga_em is not null), 0)::float as recebida,
            coalesce(sum(comissao_valor) filter (where comissao_paga_em is null), 0)::float as aberta
       from app.venda`,
  );
  return r.rows[0];
}

// ---------- pedidos de contato ----------

export interface LinhaContato {
  criado_em: Date;
  anuncio_id: string;
  titulo: string;
  situacao: string;
  preco: string;
  comprador_id: string;
  comprador: string;
  comprador_email: string;
  vendedor_id: string;
  vendedor: string;
}

export async function contatos(pagina: number): Promise<{ linhas: LinhaContato[]; total: number }> {
  const r = await banco().query<LinhaContato & { total: number }>(
    `select x.criado_em, a.id as anuncio_id, a.titulo, a.situacao, a.preco, b.id as comprador_id, b.nome as comprador, b.email as comprador_email,
            v.id as vendedor_id, v.nome as vendedor, count(*) over ()::int as total
       from app.contato_anuncio x
       join app.anuncio a on a.id = x.anuncio_id
       join app.conta b on b.id = x.conta_id
       join app.conta v on v.id = a.conta_id
      order by x.criado_em desc limit $1 offset $2`,
    [POR_PAGINA, (pagina - 1) * POR_PAGINA],
  );
  return { linhas: r.rows, total: r.rows[0]?.total ?? 0 };
}

// ---------- funil detalhado ----------

export async function funilPorSemana(): Promise<{ semana: string; nome: string; n: number }[]> {
  const r = await banco().query<{ semana: string; nome: string; n: number }>(
    `select to_char(date_trunc('week', criado_em at time zone 'America/Sao_Paulo'), 'DD/MM') as semana, nome,
            count(distinct coalesce(conta_id::text, sessao, id::text))::int as n
       from app.evento where criado_em > now() - interval '8 weeks'
      group by 1, 2, date_trunc('week', criado_em at time zone 'America/Sao_Paulo')
      order by date_trunc('week', criado_em at time zone 'America/Sao_Paulo') desc`,
  );
  return r.rows;
}

export async function origensDasContas(dias: Periodo): Promise<{ fonte: string; n: number }[]> {
  const r = await banco().query<{ fonte: string; n: number }>(
    `select coalesce(origem->'primeiro'->>'utm_source', nullif(split_part(split_part(origem->'primeiro'->>'referrer', '://', 2), '/', 1), ''), 'direto/desconhecido') as fonte,
            count(*)::int as n
       from app.conta where not demo and criado_em > now() - make_interval(days => $1) group by 1 order by 2 desc limit 15`,
    [dias],
  );
  return r.rows;
}

export async function robosDeIa(dias: Periodo): Promise<{ bot: string; n: number; paginas: number }[]> {
  const r = await banco().query<{ bot: string; n: number; paginas: number }>(
    `select propriedades->>'bot' as bot, count(*)::int as n, count(distinct pagina)::int as paginas
       from app.evento where nome = 'crawler_ai_hit' and criado_em > now() - make_interval(days => $1) group by 1 order by 2 desc`,
    [dias],
  );
  return r.rows;
}

export async function indexNow(dias: Periodo): Promise<{ status: string; n: number }[]> {
  const r = await banco().query<{ status: string; n: number }>(
    `select coalesce(propriedades->>'status', propriedades->>'erro') as status, count(*)::int as n
       from app.evento where nome = 'indexnow_sent' and criado_em > now() - make_interval(days => $1) group by 1 order by 2 desc`,
    [dias],
  );
  return r.rows;
}

// ---------- avaliações ----------

export interface LinhaAvaliacao {
  nota: number;
  indicaria: string | null;
  ajudou: string[];
  melhorar: string | null;
  perfil: string | null;
  cidade: string | null;
  contato: string | null;
  origem: string | null;
  criado_em: Date;
}

export async function avaliacoes(): Promise<LinhaAvaliacao[]> {
  const r = await banco().query<LinhaAvaliacao>(
    'select nota, indicaria, ajudou, melhorar, perfil, cidade, contato, origem, criado_em from app.avaliacao order by criado_em desc limit 500',
  );
  return r.rows;
}

// ---------- configurações ----------

export async function administradores(): Promise<{ id: string; nome: string; email: string; criado_em: Date }[]> {
  const r = await banco().query<{ id: string; nome: string; email: string; criado_em: Date }>(
    'select id, nome, email, criado_em from app.conta where admin order by criado_em',
  );
  return r.rows;
}

export interface LinhaAcao {
  admin_nome: string;
  acao: string;
  alvo: string | null;
  detalhes: Record<string, unknown>;
  criado_em: Date;
}

export async function acoesRecentes(limite = 50): Promise<LinhaAcao[]> {
  const r = await banco().query<LinhaAcao>('select admin_nome, acao, alvo, detalhes, criado_em from app.acao_admin order by criado_em desc limit $1', [limite]);
  return r.rows;
}

/** Tempo de resposta do banco, para a tela de configurações. */
export async function pingBanco(): Promise<number> {
  const inicio = performance.now();
  await banco().query('select 1');
  return Math.round(performance.now() - inicio);
}

// ---------- busca geral (topo) ----------

export async function buscaGeral(q: string): Promise<{ contas: LinhaConta[]; anuncios: LinhaAnuncioAdmin[] }> {
  const [c, a] = await Promise.all([contas(q, 'todas', 1), anunciosAdmin(q, '', '', 1)]);
  return { contas: c.linhas.slice(0, 20), anuncios: a.linhas.slice(0, 20) };
}
