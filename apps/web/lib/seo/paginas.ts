// Registro das páginas de conteúdo (app.seo_pagina): o que está publicado, o que espera a onda e o
// resultado do portão de qualidade. Também publica as ondas e grava as métricas do dia.
import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { banco } from '@/lib/contas';
import { SITE_URL } from '@/lib/config';
import { avisarIndexNow, chaveIndexNow } from '@/lib/indexnow';
import { avaliarPagina, type ModeloPagina, type ResultadoPortao } from './portao';
import { calcularPrevisao } from './previsao';
import { caminhoMunicipio, LIMIAR_AREA_GRAOS_HA, type MunicipioAgro } from './municipios';
import { consultaMunicipio, descricaoMunicipio, pontosDeDado, respostaMunicipio, resumoCulturas, tituloMunicipio } from './textos-municipio';

export const TAG_PAGINAS = 'seo-paginas';

export interface PaginaRegistrada {
  caminho: string;
  tipo: string;
  cluster: string;
  titulo: string;
  publicadaEm: string | null;
  atualizadaEm: string;
}

/** Páginas publicadas (sitemap, llms.txt, hubs). */
export async function paginasPublicadas(tipo: string | null = null): Promise<PaginaRegistrada[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(TAG_PAGINAS);
  const r = await banco().query<{ caminho: string; tipo: string; cluster: string; titulo: string; publicada_em: Date | null; atualizada_em: Date }>(
    `select caminho, tipo, cluster, titulo, publicada_em, atualizada_em from app.seo_pagina
      where status = 'publicada' and ($1::text is null or tipo = $1) order by prioridade desc, caminho`,
    [tipo],
  );
  return r.rows.map((l) => ({
    caminho: l.caminho,
    tipo: l.tipo,
    cluster: l.cluster,
    titulo: l.titulo,
    publicadaEm: l.publicada_em?.toISOString() ?? null,
    atualizadaEm: l.atualizada_em.toISOString(),
  }));
}

export async function paginaPublicada(caminho: string): Promise<boolean> {
  'use cache';
  cacheLife('hours');
  cacheTag(TAG_PAGINAS);
  const r = await banco().query("select 1 from app.seo_pagina where caminho = $1 and status = 'publicada'", [caminho]);
  return (r.rowCount ?? 0) > 0;
}

// ---------- glossário ----------

export interface TermoGlossario {
  slug: string;
  termo: string;
  cluster: string;
  consulta: string;
  respostaDireta: string;
  explicacao: string;
  exemplo: string;
  perguntas: { pergunta: string; resposta: string }[];
  fontes: { nome: string; url: string; acessado_em?: string }[];
  relacionados: string[];
  revisadoEm: string;
}

interface LinhaTermo {
  slug: string;
  termo: string;
  cluster: string;
  consulta: string;
  resposta_direta: string;
  explicacao: string;
  exemplo: string;
  perguntas: TermoGlossario['perguntas'];
  fontes: TermoGlossario['fontes'];
  relacionados: string[];
  revisado_em: Date;
}

function termo(l: LinhaTermo): TermoGlossario {
  return {
    slug: l.slug,
    termo: l.termo,
    cluster: l.cluster,
    consulta: l.consulta,
    respostaDireta: l.resposta_direta,
    explicacao: l.explicacao,
    exemplo: l.exemplo,
    perguntas: l.perguntas,
    fontes: l.fontes,
    relacionados: l.relacionados,
    revisadoEm: l.revisado_em.toISOString().slice(0, 10),
  };
}

export async function termosPublicados(): Promise<TermoGlossario[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(TAG_PAGINAS);
  const r = await banco().query<LinhaTermo>(
    `select g.* from app.seo_glossario g join app.seo_pagina p on p.caminho = '/glossario/' || g.slug
      where p.status = 'publicada' order by g.termo`,
  );
  return r.rows.map(termo);
}

export async function termoPublicado(slug: string): Promise<TermoGlossario | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(TAG_PAGINAS);
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const r = await banco().query<LinhaTermo>(
    `select g.* from app.seo_glossario g join app.seo_pagina p on p.caminho = '/glossario/' || g.slug
      where g.slug = $1 and p.status = 'publicada'`,
    [slug],
  );
  return r.rows[0] ? termo(r.rows[0]) : null;
}

/** Corpo do termo para medir tamanho e semelhança no portão. */
export function corpoTermo(t: Pick<TermoGlossario, 'respostaDireta' | 'explicacao' | 'exemplo' | 'perguntas'>): string {
  return [t.respostaDireta, t.explicacao, t.exemplo, ...t.perguntas.map((p) => `${p.pergunta} ${p.resposta}`)].join('\n');
}

export function modeloTermo(t: TermoGlossario, linksEntrada: number): ModeloPagina {
  const caminho = `/glossario/${t.slug}`;
  return {
    caminho,
    tipo: 'glossario',
    consulta: t.consulta,
    titulo: tituloTermo(t),
    descricao: descricaoTermo(t),
    resposta: t.respostaDireta,
    corpo: corpoTermo(t),
    valorProprio: 'Exemplo prático de lavoura e ligação direta com a calculadora e a previsão por município do Grão Raiz.',
    fontes: t.fontes,
    linksSaida: ['/glossario', ...t.relacionados.map((s) => `/glossario/${s}`), '/hora-de-pulverizar', '/ferramentas/delta-t'],
    linksEntrada,
    isca: t.cluster === 'maquinas-usadas' ? 'anunciar-maquina' : t.cluster === 'pulverizacao' ? 'calculadora-delta-t' : 'app-talhao',
    jsonLd: ['DefinedTerm', 'BreadcrumbList', ...(t.perguntas.length ? ['FAQPage'] : [])],
  };
}

export function tituloTermo(t: Pick<TermoGlossario, 'termo'>): string {
  const base = `${t.termo}: o que é e como usar na lavoura`;
  return base.length <= 60 ? base : `${t.termo}: o que é`.slice(0, 60);
}

export function descricaoTermo(t: Pick<TermoGlossario, 'respostaDireta'>): string {
  const r = t.respostaDireta.replace(/\s+/g, ' ').trim();
  if (r.length <= 155) return r.length >= 70 ? r : `${r} Veja exemplo prático e fontes.`.slice(0, 155);
  return `${r.slice(0, 152).replace(/\s+\S*$/, '')}...`;
}

// ---------- publicação em ondas ----------

/** Páginas fixas que apontam para termos do glossário (guia, calculadora, metodologia e páginas de município). */
const LINKS_FIXOS_GLOSSARIO: Record<string, number> = {
  'delta-t': 3,
  geada: 1,
  deriva: 1,
  'umidade-relativa-do-ar': 1,
  'chuva-acumulada': 1,
};

/** Quantas páginas de município do mesmo agrupamento apontam para esta (hub da UF + vizinhos que a listam). */
async function entradasMunicipio(m: MunicipioAgro, incluindoFila: Set<string>): Promise<number> {
  const r = await banco().query<{ codigo: string; uf: string; slug: string; pos: number }>(
    `select codigo, uf, slug, row_number() over (order by area_graos_ha desc)::int as pos from app.municipio_agro where regiao_codigo = $1`,
    [m.regiaoCodigo],
  );
  const minhaPos = r.rows.find((x) => x.codigo === m.codigo)?.pos ?? 99;
  // Cada página de vizinho lista os 12 maiores da região (sem ela mesma).
  const vizinhosQueListam = minhaPos <= 13 ? r.rows.filter((x) => x.codigo !== m.codigo && incluindoFila.has(caminhoMunicipio(x))).length : 0;
  return 1 + vizinhosQueListam; // 1 = página da UF, que lista todos
}

export async function modeloMunicipio(m: MunicipioAgro, publicadas: Set<string>): Promise<ModeloPagina> {
  const p = await calcularPrevisao(m.lat, m.lon);
  const caminho = caminhoMunicipio(m);
  const vizinhos = await banco().query<{ uf: string; slug: string }>(
    `select uf, slug from app.municipio_agro where regiao_codigo = $1 and codigo <> $2 order by area_graos_ha desc limit 12`,
    [m.regiaoCodigo, m.codigo],
  );
  const linksVizinhos = vizinhos.rows.map(caminhoMunicipio).filter((c) => publicadas.has(c));
  return {
    caminho,
    tipo: 'programatica',
    consulta: consultaMunicipio(m),
    titulo: tituloMunicipio(m),
    descricao: descricaoMunicipio(m),
    resposta: respostaMunicipio(m, p),
    corpo: `${respostaMunicipio(m, p)}\n${resumoCulturas(m)}`,
    valorProprio: 'Janelas de pulverização calculadas hora a hora (delta T, vento na barra, umidade e chuva) e o perfil de grãos do município pela PAM/IBGE.',
    fontes: [
      { nome: 'Open-Meteo (previsão)', url: 'https://open-meteo.com/' },
      { nome: `IBGE, Produção Agrícola Municipal ${m.anoPam}`, url: 'https://sidra.ibge.gov.br/tabela/5457' },
    ],
    linksSaida: [`/hora-de-pulverizar/${m.uf.toLowerCase()}`, '/hora-de-pulverizar', '/ferramentas/delta-t', '/metodologia', ...linksVizinhos],
    linksEntrada: await entradasMunicipio(m, publicadas),
    isca: 'boletim-pulverizacao-municipio',
    jsonLd: ['WebPage', 'BreadcrumbList', 'FAQPage'],
    pontosDeDado: p ? pontosDeDado(m, p) : 0,
  };
}

async function gravarResultado(caminho: string, r: ResultadoPortao, publicar: boolean, onda: number | null): Promise<void> {
  await banco().query(
    `update app.seo_pagina set qualidade = $2, aprovada = $3, atualizada_em = now(),
        status = case when $4 then 'publicada' else status end,
        onda = case when $4 then $5 else onda end,
        publicada_em = case when $4 then now() else publicada_em end
      where caminho = $1`,
    [caminho, JSON.stringify(r), r.aprovada, publicar, onda],
  );
}

export interface ResultadoOnda {
  onda: number;
  avaliadas: number;
  publicadas: string[];
  reprovadas: { caminho: string; motivos: string[] }[];
}

/**
 * Publica a próxima onda: pega as páginas da fila (maior prioridade primeiro), passa cada uma no portão
 * e publica as aprovadas. Reprovadas ficam na fila (tentam de novo na próxima onda) com o motivo gravado.
 */
export async function publicarOnda(limite: number): Promise<ResultadoOnda> {
  const onda = ((await banco().query<{ n: number | null }>('select max(onda) as n from app.seo_pagina')).rows[0]?.n ?? 0) + 1;
  const publicadasAntes = new Set(
    (await banco().query<{ caminho: string }>("select caminho from app.seo_pagina where status = 'publicada'")).rows.map((l) => l.caminho),
  );
  const fila = await banco().query<{ caminho: string; tipo: string }>(
    "select caminho, tipo from app.seo_pagina where status = 'fila' order by prioridade desc limit $1",
    [Math.ceil(limite * 1.3)],
  );
  // A onda inteira conta como publicada para os links entre vizinhos (todas saem juntas).
  const conjunto = new Set([...publicadasAntes, ...fila.rows.map((l) => l.caminho)]);
  const resultado: ResultadoOnda = { onda, avaliadas: 0, publicadas: [], reprovadas: [] };

  // Glossário: corpo de todos os termos (para medir semelhança) e quem aponta para quem.
  const termos = (
    await banco().query<LinhaTermo>('select * from app.seo_glossario')
  ).rows.map(termo);
  const porCluster = new Map<string, number>();
  for (const t of termos) porCluster.set(t.cluster, (porCluster.get(t.cluster) ?? 0) + 1);
  const outrosCorpos = termos.map((t) => ({ caminho: `/glossario/${t.slug}`, corpo: corpoTermo(t) }));

  for (const linha of fila.rows) {
    if (resultado.publicadas.length >= limite) break;
    let modelo: ModeloPagina | null = null;
    let outras: { caminho: string; corpo: string }[] = [];
    if (linha.tipo === 'glossario') {
      const t = termos.find((x) => `/glossario/${x.slug}` === linha.caminho);
      if (t) {
        const apontam = termos.filter((x) => x.slug !== t.slug && x.relacionados.includes(t.slug)).length;
        const doCluster = (porCluster.get(t.cluster) ?? 1) - 1;
        // Hub /glossario + termos que o citam + termos do mesmo assunto (cada um lista até 6) + páginas fixas que linkam o termo.
        const fixas = LINKS_FIXOS_GLOSSARIO[t.slug] ?? 0;
        modelo = modeloTermo(t, 1 + apontam + Math.min(doCluster, 6) + fixas);
        outras = outrosCorpos;
      }
    }
    if (linha.tipo === 'programatica' && linha.caminho.startsWith('/hora-de-pulverizar/')) {
      const [, , uf, slug] = linha.caminho.split('/');
      const m = await banco().query(
        `select codigo, nome, uf, slug, lat, lon, regiao_codigo as "regiaoCodigo", regiao_nome as "regiaoNome", culturas,
                area_graos_ha::float as "areaGraosHa", ano_pam as "anoPam"
           from app.municipio_agro where lower(uf) = $1 and slug = $2 and area_graos_ha >= $3`,
        [uf, slug, LIMIAR_AREA_GRAOS_HA],
      );
      if (m.rows[0]) modelo = await modeloMunicipio(m.rows[0] as MunicipioAgro, conjunto);
    }
    if (!modelo) continue;
    resultado.avaliadas++;
    const r = avaliarPagina(modelo, outras);
    await gravarResultado(linha.caminho, r, r.aprovada, onda);
    if (r.aprovada) resultado.publicadas.push(linha.caminho);
    else resultado.reprovadas.push({ caminho: linha.caminho, motivos: Object.entries(r.regras).filter(([, v]) => !v.ok).map(([k, v]) => `${k}: ${v.detalhe}`) });
  }

  if (resultado.publicadas.length) {
    try {
      revalidateTag(TAG_PAGINAS, { expire: 0 });
      revalidateTag('municipios', { expire: 0 });
    } catch {
      // Fora de uma requisição (script local) não há cache para limpar.
    }
    const municipais = resultado.publicadas.filter((c) => c.startsWith('/hora-de-pulverizar/'));
    const ufs = new Set(municipais.map((c) => c.split('/').slice(0, 3).join('/')));
    avisarIndexNow([...resultado.publicadas, ...ufs, ...(municipais.length ? ['/hora-de-pulverizar'] : []), ...(resultado.publicadas.some((c) => c.startsWith('/glossario/')) ? ['/glossario'] : [])]);
    // Só marca como avisada quando o aviso sai de verdade (servidor oficial, com a chave); senão a rotina avisa depois.
    if (chaveIndexNow() && SITE_URL.startsWith('https://')) {
      await banco().query("update app.seo_pagina set indexnow_em = now() where caminho = any($1)", [resultado.publicadas]);
    }
    await banco().query("insert into app.seo_anotacao (tipo, texto) values ('onda', $1)", [
      `Onda ${onda}: ${resultado.publicadas.length} página(s) publicada(s), ${resultado.reprovadas.length} reprovada(s) no portão`,
    ]);
  }
  return resultado;
}

/** Linha de base e métricas locais do dia (o Search Console e o Bing entram quando houver credencial). */
export async function gravarMetricasDoDia(): Promise<void> {
  const porTipo = await banco().query<{ tipo: string; n: number }>(
    "select tipo, count(*)::int as n from app.seo_pagina where status = 'publicada' group by tipo",
  );
  const detalhe = Object.fromEntries(porTipo.rows.map((l) => [l.tipo, l.n]));
  const total = porTipo.rows.reduce((s, l) => s + l.n, 0);
  await banco().query(
    `insert into app.seo_metrica (dia, fonte, chave, valor, detalhe)
     select current_date, 'local', k, v, d from (
       select 'paginas_publicadas' as k, $1::numeric as v, $2::jsonb as d
       union all select 'paginas_na_fila', (select count(*) from app.seo_pagina where status = 'fila'), '{}'::jsonb
       union all select 'consultas_mapeadas', (select count(*) from app.seo_consulta), '{}'::jsonb
       union all select 'leads_ativos', (select count(*) from app.lead where descadastrado_em is null), '{}'::jsonb
       union all select 'crawler_ia_24h', (select count(*) from app.evento where nome = 'crawler_ai_hit' and criado_em > now() - interval '1 day'), '{}'::jsonb
       union all select 'visitas_organicas_24h', (select count(*) from app.evento where nome = 'pagina_vista' and propriedades->>'canal' in ('organico','ia') and criado_em > now() - interval '1 day'), '{}'::jsonb
       union all select 'iscas_concluidas_24h', (select count(*) from app.evento where nome = 'isca_concluida' and criado_em > now() - interval '1 day'), '{}'::jsonb
     ) t
     on conflict (dia, fonte, chave) do update set valor = excluded.valor, detalhe = excluded.detalhe`,
    [total, JSON.stringify(detalhe)],
  );
}

/** Termos do glossário no ar: os links para o glossário só aparecem para termos publicados (nada de link quebrado). */
export async function slugsDoGlossario(): Promise<string[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(TAG_PAGINAS);
  const r = await banco().query<{ slug: string }>(
    "select g.slug from app.seo_glossario g join app.seo_pagina p on p.caminho = '/glossario/' || g.slug where p.status = 'publicada'",
  );
  return r.rows.map((l) => l.slug);
}

/** Data de hoje (AAAA-MM-DD) em cache por hora: Cache Components não deixa ler o relógio direto na pré-montagem. */
export async function dataDeHoje(): Promise<string> {
  'use cache';
  cacheLife('hours');
  return new Date().toISOString().slice(0, 10);
}
