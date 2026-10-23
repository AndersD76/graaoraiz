import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { urlDiarioRecente } from '@graoraiz/clima';
import { repassarOpenMeteo, respostaErro } from '@/lib/respostas';
import { inteiroOpcional, lerQuery, numeroObrigatorio, primeiraMensagem } from '@/lib/validacao';

// Roda no runtime Node.js (o padrão). Com Cache Components ligado, o Next não aceita a
// exportação `runtime` nem mesmo como 'nodejs', por isso ela não aparece aqui.

const parametros = z.object({
  lat: numeroObrigatorio('lat', -90, 90),
  lon: numeroObrigatorio('lon', -180, 180),
  passados: inteiroOpcional('passados', 0, 92, 92),
  fuso: z.string().max(64).optional(),
});

/** GET /api/diario?lat=&lon=&passados=&fuso= — chuva, mínima, máxima e rajada dos últimos dias. */
export async function GET(request: NextRequest) {
  const validacao = parametros.safeParse(lerQuery(request.nextUrl));
  if (!validacao.success) return respostaErro(400, primeiraMensagem(validacao.error));

  const { lat, lon, passados, fuso } = validacao.data;
  const url = urlDiarioRecente(lat, lon, passados, { fuso, apiKey: process.env.OPEN_METEO_API_KEY || undefined });
  return repassarOpenMeteo(url, 'public, s-maxage=3600, stale-while-revalidate=21600');
}
