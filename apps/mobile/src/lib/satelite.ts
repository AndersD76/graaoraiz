import { dataDe, isoLocal, quadradoEmVolta, somarDias } from '@graoraiz/clima';

import { gravar, ler } from '@/lib/armazenamento';
import type { Talhao } from '@/lib/estado';

/**
 * Olho do satélite: imagens Sentinel-2 (ESA/Copernicus, livres) pelo catálogo e pelo serviço de
 * mosaico do Microsoft Planetary Computer — sem chave, com CORS liberado, direto do aparelho.
 * Vigor = NDVI, (infravermelho próximo − vermelho) / (infravermelho próximo + vermelho).
 */

const STAC = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';
const DADOS = 'https://planetarycomputer.microsoft.com/api/data/v1';
const COLECAO = 'sentinel-2-l2a';
const NDVI = '(B08-B04)/(B08+B04)';
/** Classes da camada de cena (SCL) que são nuvem, cirro ou sombra de nuvem. */
const NUVEM = 'where((SCL==3)|(SCL==8)|(SCL==9)|(SCL==10),1,0)';
const LIMITE_REDE_MS = 25_000;
const HORA = 60 * 60 * 1000;

export const ATRIBUICAO_SATELITE = 'Imagens: Copernicus Sentinel-2 (ESA), via Microsoft Planetary Computer';

export interface Cena {
  id: string;
  /** Data da passagem, "2026-10-21". */
  data: string;
  /** Nuvens na cena inteira (100 × 100 km), %. */
  nuvensCena: number;
}

export interface Vigor {
  cenaId: string;
  data: string;
  /** NDVI médio do talhão (−1 a 1; lavoura fechada costuma passar de 0,7). */
  media: number;
  mediana: number;
  /** Fração do talhão coberta por nuvem ou sombra (0–1). */
  nuvem: number;
  /** Fração do talhão com vigor bem abaixo do resto (NDVI < mediana − 0,15). */
  baixo: number;
}

async function pedir<T>(url: string, corpo?: unknown): Promise<T> {
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), LIMITE_REDE_MS);
  try {
    const r = await fetch(url, {
      method: corpo ? 'POST' : 'GET',
      headers: corpo ? { 'Content-Type': 'application/json' } : undefined,
      body: corpo ? JSON.stringify(corpo) : undefined,
      signal: controle.signal,
    });
    if (!r.ok) throw new Error(`Serviço de satélite respondeu ${r.status}`);
    return (await r.json()) as T;
  } catch (e) {
    if (controle.signal.aborted) throw new Error('O satélite demorou para responder. Tente de novo com sinal melhor.');
    throw e;
  } finally {
    clearTimeout(limite);
  }
}

/** Anel do polígono do talhão em [lon, lat] (GeoJSON): o contorno desenhado ou um quadrado pela área. */
export function anelDoTalhao(t: Pick<Talhao, 'lat' | 'lon' | 'contorno' | 'areaHa'>): [number, number][] {
  const contorno = t.contorno && t.contorno.length >= 3 ? t.contorno : quadradoEmVolta(t.lat, t.lon, t.areaHa ?? 16);
  const anel = contorno.map(([lat, lon]) => [lon, lat] as [number, number]);
  return [...anel, anel[0]!];
}

function chaveTalhao(t: Pick<Talhao, 'lat' | 'lon' | 'contorno' | 'areaHa'>): string {
  return anelDoTalhao(t)
    .map(([lon, lat]) => `${lon.toFixed(4)},${lat.toFixed(4)}`)
    .join(';');
}

interface RespostaStac {
  features?: { id: string; properties: { datetime: string; 'eo:cloud_cover'?: number } }[];
}

/** Passagens dos últimos `dias` sobre o talhão (uma por data, a menos nublada), da mais recente para a mais antiga. */
export async function cenasRecentes(t: Talhao, dias = 120): Promise<Cena[]> {
  const chave = `graoraiz:sat-cenas:${chaveTalhao(t)}`;
  const cache = ler<{ em: number; cenas: Cena[] }>(chave);
  if (cache && Date.now() - cache.em < 6 * HORA) return cache.cenas;
  const hoje = dataDe(isoLocal(new Date()));
  const resposta = await pedir<RespostaStac>(STAC, {
    collections: [COLECAO],
    intersects: { type: 'Polygon', coordinates: [anelDoTalhao(t)] },
    datetime: `${somarDias(hoje, -dias)}T00:00:00Z/${hoje}T23:59:59Z`,
    query: { 'eo:cloud_cover': { lt: 70 } },
    sortby: [{ field: 'datetime', direction: 'desc' }],
    limit: 60,
  });
  const porData = new Map<string, Cena>();
  for (const f of resposta.features ?? []) {
    const data = f.properties.datetime.slice(0, 10);
    const nuvensCena = f.properties['eo:cloud_cover'] ?? 100;
    const atual = porData.get(data);
    if (!atual || nuvensCena < atual.nuvensCena) porData.set(data, { id: f.id, data, nuvensCena });
  }
  const cenas = [...porData.values()].sort((a, b) => b.data.localeCompare(a.data));
  gravar(chave, { em: Date.now(), cenas });
  return cenas;
}

interface Estatistica {
  mean: number;
  median: number;
  count: number;
  histogram: [number[], number[]];
}

/** Fração dos pixels abaixo de `limite` pelo histograma (interpola dentro da faixa). */
function fracaoAbaixo([contagens, bordas]: [number[], number[]], limite: number): number {
  const total = contagens.reduce((s, c) => s + c, 0);
  if (!total) return 0;
  let abaixo = 0;
  contagens.forEach((c, i) => {
    const de = bordas[i] ?? 0;
    const ate = bordas[i + 1] ?? de;
    if (ate <= limite) abaixo += c;
    else if (de < limite && ate > de) abaixo += (c * (limite - de)) / (ate - de);
  });
  return abaixo / total;
}

/** Vigor e nuvem do talhão numa passagem (guardado para sempre: a imagem não muda). */
export async function vigorDaCena(t: Talhao, cena: Cena): Promise<Vigor> {
  const chave = `graoraiz:sat-vigor:${cena.id}:${chaveTalhao(t)}`;
  const cache = ler<Vigor>(chave);
  if (cache) return cache;
  const q = new URLSearchParams({ collection: COLECAO, item: cena.id, expression: `${NDVI};${NUVEM}`, asset_as_band: 'True', histogram_bins: '40' });
  const resposta = await pedir<{ properties: { statistics: Record<string, Estatistica> } }>(`${DADOS}/item/statistics?${q.toString()}`, {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [anelDoTalhao(t)] },
  });
  const st = resposta.properties.statistics;
  const ndvi = st[NDVI];
  const nuvem = st[NUVEM];
  if (!ndvi) throw new Error('Sem dados de vigor para esta imagem.');
  const vigor: Vigor = {
    cenaId: cena.id,
    data: cena.data,
    media: ndvi.mean,
    mediana: ndvi.median,
    nuvem: nuvem?.mean ?? 0,
    baixo: fracaoAbaixo(ndvi.histogram, ndvi.median - 0.15),
  };
  gravar(chave, vigor);
  return vigor;
}

/** Série de vigor das passagens limpas (até `maximo`), da mais antiga para a mais recente. */
export async function serieVigor(t: Talhao, maximo = 10): Promise<Vigor[]> {
  const cenas = (await cenasRecentes(t)).filter((c) => c.nuvensCena < 60).slice(0, maximo + 6);
  const resultados: Vigor[] = [];
  // Poucas por vez: o serviço é gratuito e compartilhado.
  for (let i = 0; i < cenas.length && resultados.length < maximo; i += 3) {
    const lote = await Promise.all(cenas.slice(i, i + 3).map((c) => vigorDaCena(t, c).catch(() => null)));
    for (const v of lote) if (v && v.nuvem < 0.2 && Number.isFinite(v.media)) resultados.push(v);
  }
  return resultados.slice(0, maximo).sort((a, b) => a.data.localeCompare(b.data));
}

export type ModoSatelite = 'real' | 'vigor';

/** Modelo de URL de blocos {z}/{x}/{y} da passagem, em cor real ou no mapa de vigor. */
export function urlBlocos(cenaId: string, modo: ModoSatelite): string {
  const q =
    modo === 'real'
      ? `collection=${COLECAO}&item=${cenaId}&assets=visual&asset_bidx=visual%7C1%2C2%2C3&nodata=0`
      : `collection=${COLECAO}&item=${cenaId}&expression=${encodeURIComponent(NDVI)}&asset_as_band=True&rescale=0%2C0.9&colormap_name=rdylgn`;
  return `${DADOS}/item/tiles/WebMercatorQuad/{z}/{x}/{y}@2x?${q}`;
}
