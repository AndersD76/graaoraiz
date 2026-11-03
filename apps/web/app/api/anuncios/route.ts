import { ORDENS_ANUNCIO, UFS_BRASIL } from '@graoraiz/clima';
import { banco, contaDaRequisicao, CORS, erro, json, lerCorpo, preflight } from '@/lib/contas';
import { comissaoPercentual, esquemaAnuncio, fotosDaConta, type LinhaAnuncio, resumo } from '@/lib/maquinas';
import { primeiraMensagem } from '@/lib/validacao';

export const OPTIONS = preflight;

const POR_PAGINA = 24;
const MAX_ATIVOS_POR_CONTA = 30;
const ORDEM_SQL: Record<string, string> = {
  recentes: 'criado_em desc',
  'menor-preco': 'preco asc, criado_em desc',
  'maior-preco': 'preco desc, criado_em desc',
};

/**
 * GET /api/anuncios?categoria=&uf=&q=&ordem=&pagina= → anúncios ativos (aberto a todos).
 * Resposta: { anuncios, temMais, comissaoPercentual }.
 */
export async function GET(request: Request) {
  const p = new URL(request.url).searchParams;
  const categoria = p.get('categoria') || null;
  const uf = UFS_BRASIL.includes(p.get('uf') as (typeof UFS_BRASIL)[number]) ? p.get('uf') : null;
  const busca = p.get('q')?.trim().slice(0, 60) || null;
  const ordem = ORDENS_ANUNCIO.some((o) => o.valor === p.get('ordem')) ? (p.get('ordem') as string) : 'recentes';
  const pagina = Math.max(0, Math.min(200, Number(p.get('pagina')) || 0));
  try {
    const r = await banco().query<LinhaAnuncio>(
      `select * from app.anuncio
        where situacao = 'ativo'
          and ($1::text is null or categoria = $1)
          and ($2::text is null or uf = $2)
          and ($3::text is null or concat_ws(' ', titulo, marca, modelo, municipio) ilike '%' || $3 || '%')
        order by ${ORDEM_SQL[ordem]}
        limit $4 offset $5`,
      [categoria, uf, busca?.replace(/[\\%_]/g, '\\$&') ?? null, POR_PAGINA + 1, pagina * POR_PAGINA],
    );
    return Response.json(
      { anuncios: r.rows.slice(0, POR_PAGINA).map(resumo), temMais: r.rows.length > POR_PAGINA, comissaoPercentual: comissaoPercentual() },
      { headers: { 'Cache-Control': 'no-store', ...CORS } },
    );
  } catch (e) {
    console.error('[anuncios] falha ao listar:', e instanceof Error ? e.message : e);
    return erro(503, 'Não deu para buscar os anúncios agora. Tente de novo.');
  }
}

/** POST /api/anuncios { ...anúncio, aceiteComissao: true } → { id }. Só com conta (não a de demonstração). */
export async function POST(request: Request) {
  const lido = await lerCorpo(request, 10_000);
  if ('falha' in lido) return lido.falha;
  try {
    const auth = await contaDaRequisicao(request);
    if ('falha' in auth) return auth.falha;
    if (auth.conta.demo) return erro(403, 'A conta de demonstração não anuncia. Crie sua conta para anunciar.');
    const corpo = lido.corpo as { aceiteComissao?: unknown } | null;
    if (corpo?.aceiteComissao !== true) return erro(400, 'Para anunciar, aceite a comissão e os termos de uso.');
    const validacao = esquemaAnuncio.safeParse(corpo);
    if (!validacao.success) return erro(400, primeiraMensagem(validacao.error));
    const a = validacao.data;
    if (!(await fotosDaConta(auth.conta.id, a.fotos))) return erro(400, 'Envie as fotos de novo.');

    const ativos = await banco().query("select count(*)::int as n from app.anuncio where conta_id = $1 and situacao in ('ativo', 'pausado')", [auth.conta.id]);
    if ((ativos.rows[0] as { n: number }).n >= MAX_ATIVOS_POR_CONTA) return erro(429, `Você já tem ${MAX_ATIVOS_POR_CONTA} anúncios. Tire algum antes de criar outro.`);

    const r = await banco().query<{ id: string }>(
      `insert into app.anuncio (conta_id, categoria, titulo, marca, modelo, ano, horas, preco, municipio, uf, descricao, whatsapp, fotos, comissao_percentual, aceite_termos_em)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now()) returning id`,
      [auth.conta.id, a.categoria, a.titulo, a.marca, a.modelo, a.ano, a.horas, a.preco, a.municipio, a.uf, a.descricao, a.whatsapp, a.fotos, comissaoPercentual()],
    );
    return json({ id: r.rows[0].id }, 201);
  } catch (e) {
    console.error('[anuncios] falha ao criar:', e instanceof Error ? e.message : e);
    return erro(503, 'Não deu para publicar agora. Tente de novo.');
  }
}
