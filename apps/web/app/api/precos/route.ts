import { CORS, erro, preflight } from '@/lib/contas';
import { obterPrecos } from '@/lib/precos';

export const OPTIONS = preflight;

/** GET /api/precos → indicadores Cepea/Esalq do dia e dólar PTAX (cache de 30 min). */
export async function GET() {
  try {
    const precos = await obterPrecos();
    return Response.json(precos, { headers: { 'Cache-Control': 'public, max-age=900', ...CORS } });
  } catch (e) {
    console.error('[precos] falha:', e instanceof Error ? e.message : e);
    return erro(502, 'Os preços não puderam ser buscados agora. Tente de novo em instantes.');
  }
}
