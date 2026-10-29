import { CORS, erro, preflight } from '@/lib/contas';
import { buscarMunicipio } from '@/lib/municipio';

export const OPTIONS = preflight;

/** GET /api/municipio?lat=&lon= → município do ponto pela malha do IBGE: { nome, uf, codigo }. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get('lat'));
  const lon = Number(url.searchParams.get('lon'));
  if (!url.searchParams.has('lat') || !url.searchParams.has('lon') || !(lat >= -34 && lat <= 5.5 && lon >= -74.5 && lon <= -28.5)) {
    return erro(400, 'Informe lat e lon de um ponto no Brasil.');
  }
  try {
    const municipio = await buscarMunicipio(lat, lon);
    if (!municipio) return erro(404, 'Nenhum município do IBGE nesse ponto.');
    return Response.json(municipio, { headers: { 'Cache-Control': 'public, max-age=2592000', ...CORS } });
  } catch (e) {
    console.error('[municipio] falha:', e instanceof Error ? e.message : e);
    return erro(502, 'O IBGE não respondeu agora. Tente de novo em instantes.');
  }
}
