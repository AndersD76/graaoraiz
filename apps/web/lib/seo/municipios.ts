// Municípios com dado agrícola real (IBGE, Produção Agrícola Municipal) para as páginas "hora de pulverizar".
import { cacheLife, cacheTag } from 'next/cache';
import { banco } from '@/lib/contas';

/** Só ganha página o município com pelo menos esta área de grãos (soja, milho, trigo, feijão, algodão, arroz, sorgo, aveia). */
export const LIMIAR_AREA_GRAOS_HA = 1000;
export const TAG_MUNICIPIOS = 'municipios';

export const CULTURAS_PAM: Record<string, string> = {
  soja: 'Soja',
  milho: 'Milho',
  trigo: 'Trigo',
  feijao: 'Feijão',
  algodao: 'Algodão herbáceo',
  arroz: 'Arroz',
  sorgo: 'Sorgo',
  aveia: 'Aveia',
};

export interface MunicipioAgro {
  codigo: string;
  nome: string;
  uf: string;
  slug: string;
  lat: number;
  lon: number;
  regiaoCodigo: string | null;
  regiaoNome: string | null;
  culturas: Record<string, { area_ha?: number; producao_t?: number }>;
  areaGraosHa: number;
  anoPam: number;
}

interface Linha {
  codigo: string;
  nome: string;
  uf: string;
  slug: string;
  lat: number;
  lon: number;
  regiao_codigo: string | null;
  regiao_nome: string | null;
  culturas: MunicipioAgro['culturas'];
  area_graos_ha: string;
  ano_pam: number;
}

function deLinha(l: Linha): MunicipioAgro {
  return {
    codigo: l.codigo,
    nome: l.nome,
    uf: l.uf,
    slug: l.slug,
    lat: l.lat,
    lon: l.lon,
    regiaoCodigo: l.regiao_codigo,
    regiaoNome: l.regiao_nome,
    culturas: l.culturas,
    areaGraosHa: Number(l.area_graos_ha),
    anoPam: l.ano_pam,
  };
}

export function caminhoMunicipio(m: Pick<MunicipioAgro, 'uf' | 'slug'>): string {
  return `/hora-de-pulverizar/${m.uf.toLowerCase()}/${m.slug}`;
}

/** Município com página publicada (o que está na fila de publicação responde 404). */
export async function municipioPublicado(uf: string, slug: string): Promise<MunicipioAgro | null> {
  'use cache';
  cacheLife('hours');
  cacheTag(TAG_MUNICIPIOS, 'seo-paginas');
  if (!/^[a-z]{2}$/.test(uf) || !/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const r = await banco().query<Linha>(
    `select m.* from app.municipio_agro m
       join app.seo_pagina p on p.caminho = '/hora-de-pulverizar/' || lower(m.uf) || '/' || m.slug
      where lower(m.uf) = $1 and m.slug = $2 and p.status = 'publicada'`,
    [uf, slug],
  );
  return r.rows[0] ? deLinha(r.rows[0]) : null;
}

/** Municípios publicados de uma UF (ou de todas), do maior produtor de grãos para o menor. */
export async function municipiosPublicados(uf: string | null): Promise<MunicipioAgro[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(TAG_MUNICIPIOS, 'seo-paginas');
  const r = await banco().query<Linha>(
    `select m.* from app.municipio_agro m
       join app.seo_pagina p on p.caminho = '/hora-de-pulverizar/' || lower(m.uf) || '/' || m.slug
      where p.status = 'publicada' and ($1::text is null or lower(m.uf) = $1)
      order by m.area_graos_ha desc`,
    [uf],
  );
  return r.rows.map(deLinha);
}

/** Vizinhos com página: mesma região geográfica imediata do IBGE, maiores produtores primeiro. */
export async function vizinhosPublicados(m: MunicipioAgro, limite = 8): Promise<MunicipioAgro[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(TAG_MUNICIPIOS, 'seo-paginas');
  const r = await banco().query<Linha>(
    `select v.* from app.municipio_agro v
       join app.seo_pagina p on p.caminho = '/hora-de-pulverizar/' || lower(v.uf) || '/' || v.slug
      where p.status = 'publicada' and v.codigo <> $1
        and (v.regiao_codigo = $2 or ($2::text is null and v.uf = $3))
      order by v.area_graos_ha desc limit $4`,
    [m.codigo, m.regiaoCodigo, m.uf, limite],
  );
  return r.rows.map(deLinha);
}

/** UFs com pelo menos um município publicado, com a contagem. */
export async function ufsPublicadas(): Promise<{ uf: string; n: number }[]> {
  'use cache';
  cacheLife('hours');
  cacheTag(TAG_MUNICIPIOS, 'seo-paginas');
  const r = await banco().query<{ uf: string; n: number }>(
    `select m.uf, count(*)::int as n from app.municipio_agro m
       join app.seo_pagina p on p.caminho = '/hora-de-pulverizar/' || lower(m.uf) || '/' || m.slug
      where p.status = 'publicada' group by m.uf order by count(*) desc`,
  );
  return r.rows;
}

/** Culturas do município em ordem de área, com rendimento calculado (produção ÷ área). */
export function culturasOrdenadas(m: MunicipioAgro): { chave: string; nome: string; areaHa: number; producaoT: number | null; rendimentoKgHa: number | null }[] {
  return Object.entries(m.culturas)
    .filter(([, v]) => (v.area_ha ?? 0) > 0)
    .map(([chave, v]) => ({
      chave,
      nome: CULTURAS_PAM[chave] ?? chave,
      areaHa: v.area_ha ?? 0,
      producaoT: v.producao_t ?? null,
      rendimentoKgHa: v.producao_t && v.area_ha ? Math.round((v.producao_t * 1000) / v.area_ha) : null,
    }))
    .sort((a, b) => b.areaHa - a.areaHa);
}
