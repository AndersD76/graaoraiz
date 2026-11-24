// Vitrine pública de máquinas (páginas que o Google lê): consultas com cache e invalidação quando um anúncio muda.
import { type AnuncioDetalhe, CATEGORIAS_MAQUINA, type CategoriaMaquina } from '@graoraiz/clima';
import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { banco } from '@/lib/contas';
import { avisarIndexNow } from '@/lib/indexnow';
import { idValido, type LinhaAnuncio, resumo } from '@/lib/maquinas';

export const TAG_VITRINE = 'anuncios';

export interface AnuncioPublico extends Omit<AnuncioDetalhe, 'meu'> {
  atualizadoEm: string;
}

/** Plural para títulos de página ("Tratores usados à venda"). */
export const PLURAL_CATEGORIA: Record<CategoriaMaquina, string> = {
  trator: 'Tratores',
  colheitadeira: 'Colheitadeiras',
  plantadeira: 'Plantadeiras',
  pulverizador: 'Pulverizadores',
  implemento: 'Implementos agrícolas',
  caminhao: 'Caminhões',
  silo: 'Silos',
  secador: 'Secadores de grãos',
  limpeza: 'Máquinas de pré-limpeza',
  classificador: 'Classificadores de grãos',
  transportador: 'Elevadores e transportadores',
  tombador: 'Tombadores',
  coletor: 'Coletores de amostras',
  balanca: 'Balanças rodoviárias',
  outro: 'Outras máquinas',
};

/** Categorias cujo plural é feminino ("Colheitadeiras usadas", não "usados"). */
const FEMININO = new Set<CategoriaMaquina>(['colheitadeira', 'plantadeira', 'limpeza', 'balanca', 'outro']);

/** Concorda com o plural da categoria: concordar('trator', 'usados', 'usadas') → "usados". */
export function concordar(categoria: CategoriaMaquina, masculino: string, feminino: string): string {
  return FEMININO.has(categoria) ? feminino : masculino;
}

export function categoriaValida(valor: string): valor is CategoriaMaquina {
  return CATEGORIAS_MAQUINA.some((c) => c.valor === valor);
}

function publico(l: LinhaAnuncio & { vendedor: string; atualizado_em: Date }): AnuncioPublico {
  return {
    ...resumo(l),
    descricao: l.descricao,
    fotos: l.fotos,
    situacao: l.situacao,
    vendedor: l.vendedor,
    atualizadoEm: l.atualizado_em.toISOString(),
  };
}

/** Anúncios no ar, mais recentes primeiro. */
export async function anunciosPublicos(categoria: CategoriaMaquina | null = null): Promise<AnuncioPublico[]> {
  'use cache';
  cacheLife('minutes');
  cacheTag(TAG_VITRINE);
  const r = await banco().query<LinhaAnuncio & { vendedor: string; atualizado_em: Date }>(
    `select a.*, split_part(c.nome, ' ', 1) as vendedor from app.anuncio a join app.conta c on c.id = a.conta_id
      where a.situacao = 'ativo' and ($1::text is null or a.categoria = $1)
      order by a.criado_em desc limit 300`,
    [categoria],
  );
  return r.rows.map(publico);
}

/** Um anúncio para a página pública: no ar ou vendido (pausado e removido não aparecem). */
export async function anuncioPublico(id: string): Promise<AnuncioPublico | null> {
  'use cache';
  cacheLife('minutes');
  cacheTag(TAG_VITRINE, `anuncio-${id}`);
  if (!idValido(id)) return null;
  const r = await banco().query<LinhaAnuncio & { vendedor: string; atualizado_em: Date }>(
    `select a.*, split_part(c.nome, ' ', 1) as vendedor from app.anuncio a join app.conta c on c.id = a.conta_id
      where a.id = $1 and a.situacao in ('ativo', 'vendido')`,
    [id],
  );
  return r.rows[0] ? publico(r.rows[0]) : null;
}

/** Depois de criar, editar, pausar, vender ou tirar um anúncio: limpa o cache e avisa os buscadores. */
export function vitrineMudou(id: string, categoria?: string | null): void {
  revalidateTag(TAG_VITRINE, { expire: 0 });
  avisarIndexNow([`/maquinas-usadas/${id}`, '/maquinas-usadas', ...(categoria ? [`/maquinas-usadas/categoria/${categoria}`] : [])]);
}
