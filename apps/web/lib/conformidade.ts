import { type Anel, areaHa, type Desmatamento, type ImovelCar, type ResultadoConformidade } from '@graoraiz/clima';
// O pacote publica só o export padrão em ESM (os tipos declaram as funções soltas).
import geometria, { type MultiPolygon, type Polygon } from 'polygon-clipping';

/**
 * Checagem de conformidade do talhão com dados públicos oficiais, sem chave:
 * - PRODES (INPE), pelo WFS do TerraBrasilis: polígonos de supressão de vegetação por ano, em todos
 *   os biomas;
 * - CAR (SICAR, Serviço Florestal Brasileiro), pelo WFS público: imóveis rurais com situação,
 *   condição da análise e módulos fiscais (sem dado pessoal).
 * O recorte (quanto de cada polígono cai no talhão ou no imóvel) é feito aqui, com o contorno.
 */

const PRODES = 'https://terrabrasilis.dpi.inpe.br/geoserver/ows';
const SICAR = 'https://geoserver.car.gov.br/geoserver/sicar/wfs';
const LIMITE_MS = 30_000;
/** Desde o ano do PRODES 2019: é o que as duas regras olham (marcos de 31/07/2019 e 31/12/2020). */
const ANO_INICIAL = 2019;
/** Pedaços menores que isso são diferença de traçado na borda, não desmatamento no talhão. */
const MINIMO_HA = 0.01;

/** Camadas do PRODES por bioma e a extensão dos dados [oeste, sul, leste, norte] (GetCapabilities). */
const CAMADAS_PRODES: { bioma: string; camada: string; extensao: [number, number, number, number] }[] = [
  { bioma: 'Amazônia', camada: 'prodes-amazon-nb:yearly_deforestation_biome', extensao: [-73.99, -16.67, -43.39, 5.27] },
  { bioma: 'Cerrado', camada: 'prodes-cerrado-nb:yearly_deforestation', extensao: [-60.46, -24.68, -41.28, -2.37] },
  { bioma: 'Mata Atlântica', camada: 'prodes-mata-atlantica-nb:yearly_deforestation', extensao: [-55.33, -29.94, -29.31, -3.83] },
  { bioma: 'Pampa', camada: 'prodes-pampa-nb:yearly_deforestation', extensao: [-57.57, -33.75, -50.06, -27.46] },
  { bioma: 'Caatinga', camada: 'prodes-caatinga-nb:yearly_deforestation', extensao: [-45.13, -16.7, -35.03, -2.72] },
  { bioma: 'Pantanal', camada: 'prodes-pantanal-nb:yearly_deforestation', extensao: [-59.15, -22.17, -54.79, -15.67] },
];

/** Extensão de cada estado [oeste, sul, leste, norte] (malhas do IBGE), para saber em que camada do CAR procurar. */
const ESTADOS: Record<string, [number, number, number, number]> = {
  ac: [-73.98, -11.15, -66.63, -7.11], al: [-38.24, -10.5, -35.15, -8.82], am: [-73.8, -9.82, -56.1, 2.24], ap: [-54.87, -1.22, -49.88, 4.51],
  ba: [-46.56, -18.34, -37.34, -8.55], ce: [-41.41, -7.86, -37.25, -2.8], df: [-48.28, -16.05, -47.31, -15.5], es: [-41.87, -21.3, -39.67, -17.89],
  go: [-53.24, -19.47, -45.91, -12.4], ma: [-48.76, -10.26, -41.8, -1.05], mg: [-51.04, -22.91, -39.86, -14.25], ms: [-58.17, -24.07, -50.93, -17.17],
  mt: [-61.63, -18.04, -50.22, -7.36], pa: [-58.9, -9.84, -46.06, 2.58], pb: [-38.77, -8.3, -34.8, -6.03], pe: [-41.36, -9.48, -34.83, -7.27],
  pi: [-46.01, -10.92, -40.37, -2.76], pr: [-54.62, -26.72, -48.1, -22.53], rj: [-44.88, -23.37, -40.96, -20.77], rn: [-38.57, -6.93, -34.97, -4.83],
  ro: [-66.81, -13.69, -59.78, -7.98], rr: [-64.81, -1.58, -58.9, 5.27], rs: [-57.59, -33.74, -49.7, -27.09], sc: [-53.84, -29.36, -48.37, -25.98],
  se: [-38.24, -11.57, -36.4, -9.51], sp: [-53.11, -25.31, -44.17, -19.79], to: [-50.74, -13.47, -45.7, -5.17],
};

type Caixa = [number, number, number, number];

interface Feicao {
  geometry: { type: string; coordinates: unknown } | null;
  properties: Record<string, unknown>;
}

function caixaDe(aneis: Anel[]): Caixa {
  const pontos = aneis.flat();
  const lats = pontos.map((p) => p[0]);
  const lons = pontos.map((p) => p[1]);
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
}

function tocam(a: Caixa, b: Caixa, folga = 0.05): boolean {
  return a[0] <= b[2] + folga && a[2] >= b[0] - folga && a[1] <= b[3] + folga && a[3] >= b[1] - folga;
}

/** Contorno [lat, lon] → polígono [lon, lat] fechado. */
function poligono(anel: Anel): Polygon {
  const r = anel.map(([lat, lon]): [number, number] => [lon, lat]);
  return [[...r, r[0]!]];
}

/** Geometria GeoJSON (Polygon ou MultiPolygon, [lon, lat]) → MultiPolygon. */
function multi(g: Feicao['geometry']): MultiPolygon | null {
  if (!g) return null;
  if (g.type === 'Polygon') return [g.coordinates as Polygon];
  if (g.type === 'MultiPolygon') return g.coordinates as MultiPolygon;
  return null;
}

const seis = (n: number) => Math.round(n * 1e6) / 1e6;

function paraAnel(anel: [number, number][]): Anel {
  return anel.slice(0, -1).map(([lon, lat]): [number, number] => [seis(lat), seis(lon)]);
}

/** Área (ha) e contornos externos [lat, lon] do recorte. */
function medir(mp: MultiPolygon): { areaHa: number; partes: Anel[] } {
  let total = 0;
  const partes: Anel[] = [];
  for (const [externo, ...buracos] of mp) {
    if (!externo) continue;
    const anel = paraAnel(externo);
    total += areaHa(anel) - buracos.reduce((s, b) => s + areaHa(paraAnel(b)), 0);
    partes.push(anel);
  }
  return { areaHa: total, partes };
}

function recortar(geom: MultiPolygon, area: Polygon): MultiPolygon {
  try {
    return geometria.intersection(geom, area);
  } catch {
    return []; // geometria degenerada da fonte: ignora a feição
  }
}

async function wfs(base: string, parametros: Record<string, string>): Promise<Feicao[]> {
  const url = `${base}?${new URLSearchParams(parametros)}`;
  const resposta = await fetch(url, { signal: AbortSignal.timeout(LIMITE_MS), headers: { Accept: 'application/json' } });
  if (!resposta.ok) throw new Error(`${resposta.status}`);
  const json = (await resposta.json()) as { features?: Feicao[] };
  if (!Array.isArray(json.features)) throw new Error('resposta sem feições');
  return json.features;
}

function envelope([oeste, sul, leste, norte]: Caixa): string {
  return `POLYGON((${oeste} ${sul},${leste} ${sul},${leste} ${norte},${oeste} ${norte},${oeste} ${sul}))`;
}

async function imoveisDoCar(talhao: Anel, caixa: Caixa, falhas: string[]): Promise<(Omit<ImovelCar, 'desmatamento'> & { geom: MultiPolygon })[]> {
  const ufs = Object.entries(ESTADOS)
    .filter(([, ext]) => tocam(caixa, ext, 0))
    .map(([uf]) => uf);
  const area = poligono(talhao);
  const listas = await Promise.all(
    ufs.map((uf) =>
      wfs(SICAR, {
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName: `sicar:sicar_imoveis_${uf}`,
        outputFormat: 'application/json',
        maxFeatures: '200',
        bbox: caixa.join(','),
      }).catch((e: unknown) => {
        console.error(`[conformidade] CAR ${uf}:`, e instanceof Error ? e.message : e);
        falhas.push(`CAR ${uf.toUpperCase()}`);
        return [] as Feicao[];
      }),
    ),
  );
  const imoveis = [];
  for (const f of listas.flat()) {
    const geom = multi(f.geometry);
    if (!geom) continue;
    const sobreposicao = medir(recortar(geom, area)).areaHa;
    if (sobreposicao < MINIMO_HA * 10) continue;
    const p = f.properties;
    const externo = geom[0]?.[0];
    imoveis.push({
      codigo: String(p.cod_imovel ?? ''),
      situacao: String(p.status_imovel ?? ''),
      condicao: typeof p.condicao === 'string' ? p.condicao : null,
      areaHa: Number(p.area) || medir(geom).areaHa,
      modulosFiscais: typeof p.m_fiscal === 'number' ? p.m_fiscal : null,
      municipio: String(p.municipio ?? ''),
      uf: String(p.uf ?? '').toUpperCase(),
      sobreposicaoHa: sobreposicao,
      contorno: externo ? paraAnel(externo) : [],
      geom,
    });
  }
  // Até 3 imóveis (o CAR tem sobreposições declaradas), do que mais cobre o talhão ao que menos cobre.
  return imoveis.sort((a, b) => b.sobreposicaoHa - a.sobreposicaoHa).slice(0, 3);
}

interface PoligonoProdes {
  bioma: string;
  ano: number;
  dataImagem: string | null;
  geom: MultiPolygon;
}

async function poligonosDoProdes(caixa: Caixa, falhas: string[]): Promise<PoligonoProdes[]> {
  const camadas = CAMADAS_PRODES.filter((c) => tocam(caixa, c.extensao));
  const listas = await Promise.all(
    camadas.map((c) =>
      wfs(PRODES, {
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeNames: c.camada,
        outputFormat: 'application/json',
        srsName: 'EPSG:4326',
        count: '5000',
        CQL_FILTER: `INTERSECTS(geom,SRID=4326;${envelope(caixa)}) AND year >= ${ANO_INICIAL}`,
      }).then(
        (feicoes) =>
          feicoes.flatMap((f): PoligonoProdes[] => {
            const geom = multi(f.geometry);
            const ano = Number(f.properties.year);
            if (!geom || !Number.isFinite(ano)) return [];
            const data = typeof f.properties.image_date === 'string' ? f.properties.image_date.slice(0, 10) : null;
            return [{ bioma: c.bioma, ano, dataImagem: data, geom }];
          }),
        (e: unknown) => {
          console.error(`[conformidade] PRODES ${c.bioma}:`, e instanceof Error ? e.message : e);
          falhas.push(`PRODES ${c.bioma}`);
          return [];
        },
      ),
    ),
  );
  return listas.flat();
}

/** Recorta os polígonos do PRODES pela área e junta os pedaços do mesmo bioma, ano e imagem. */
function desmatamentoNa(area: Polygon | MultiPolygon, poligonos: PoligonoProdes[]): Desmatamento[] {
  const grupos = new Map<string, Desmatamento>();
  for (const p of poligonos) {
    let pedacos: MultiPolygon;
    try {
      pedacos = geometria.intersection(p.geom, area);
    } catch {
      continue;
    }
    const { areaHa: ha, partes } = medir(pedacos);
    if (ha < MINIMO_HA) continue;
    const chave = `${p.bioma}|${p.ano}|${p.dataImagem}`;
    const g = grupos.get(chave);
    if (g) {
      g.areaHa += ha;
      g.partes.push(...partes);
    } else grupos.set(chave, { bioma: p.bioma, ano: p.ano, dataImagem: p.dataImagem, areaHa: ha, partes });
  }
  return [...grupos.values()].sort((a, b) => b.ano - a.ano || b.areaHa - a.areaHa);
}

const cache = new Map<string, { em: number; valor: ResultadoConformidade }>();
const VALIDADE_MS = 12 * 60 * 60 * 1000;

function agoraLocal(): string {
  // Horário de Brasília, como o produtor lê na ficha.
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

export async function consultarConformidade(talhao: Anel): Promise<ResultadoConformidade> {
  const chave = JSON.stringify(talhao.map(([lat, lon]) => [seis(lat), seis(lon)]));
  const guardado = cache.get(chave);
  if (guardado && Date.now() - guardado.em < VALIDADE_MS) return guardado.valor;

  const falhas: string[] = [];
  const caixaTalhao = caixaDe([talhao]);
  const imoveis = await imoveisDoCar(talhao, caixaTalhao, falhas);
  // Uma consulta ao PRODES cobre o talhão e os imóveis (o banco olha o imóvel inteiro).
  const caixa = caixaDe([talhao, ...imoveis.map((i) => i.contorno).filter((c) => c.length >= 3)]);
  const poligonos = await poligonosDoProdes(caixa, falhas);

  const valor: ResultadoConformidade = {
    consultadoEm: agoraLocal(),
    areaTalhaoHa: areaHa(talhao),
    desmatamentoTalhao: desmatamentoNa(poligono(talhao), poligonos),
    imoveis: imoveis.map(({ geom, ...imovel }) => ({ ...imovel, desmatamento: desmatamentoNa(geom, poligonos) })),
    falhas,
  };
  // Resultado com fonte fora do ar não fica guardado: a próxima consulta tenta de novo.
  if (!falhas.length) {
    if (cache.size > 300) cache.clear();
    cache.set(chave, { em: Date.now(), valor });
  }
  return valor;
}
