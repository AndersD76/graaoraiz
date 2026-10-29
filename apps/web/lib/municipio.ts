// Município de um ponto pela malha municipal do IBGE (geoserviços, WFS), sem chave.

const WFS = 'https://geoservicos.ibge.gov.br/geoserver/ows';
const CAMADA = 'CGMAT:qg_2025_030_munic';

export interface Municipio {
  nome: string;
  uf: string;
  /** Código IBGE com 7 dígitos. */
  codigo: string;
}

// A divisa do município não muda: guarda por ponto arredondado (~100 m) enquanto o servidor estiver de pé.
const cache = new Map<string, Municipio | null>();
const LIMITE_CACHE = 5000;

export async function buscarMunicipio(lat: number, lon: number): Promise<Municipio | null> {
  const la = lat.toFixed(3);
  const lo = lon.toFixed(3);
  const k = `${la},${lo}`;
  if (cache.has(k)) return cache.get(k) ?? null;

  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeNames: CAMADA,
    outputFormat: 'application/json',
    count: '1',
    propertyName: 'nm_mun,sigla_uf,cd_mun',
    CQL_FILTER: `INTERSECTS(geom,SRID=4326;POINT(${lo} ${la}))`,
  });
  const pedir = () => fetch(`${WFS}?${params}`, { signal: AbortSignal.timeout(15_000) });
  // O servidor do IBGE às vezes derruba a primeira conexão: uma segunda tentativa resolve.
  const resposta = await pedir().catch(pedir);
  if (!resposta.ok) throw new Error(`IBGE respondeu ${resposta.status}`);
  const json = (await resposta.json()) as { features?: { properties?: { nm_mun?: string; sigla_uf?: string; cd_mun?: string } }[] };
  const p = json.features?.[0]?.properties;
  const municipio = p?.nm_mun && p.sigla_uf ? { nome: p.nm_mun, uf: p.sigla_uf, codigo: p.cd_mun ?? '' } : null;

  if (cache.size >= LIMITE_CACHE) cache.clear();
  cache.set(k, municipio);
  return municipio;
}
