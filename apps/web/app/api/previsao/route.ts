import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { urlPrevisao } from '@graoraiz/clima';
import { repassarOpenMeteo, respostaErro } from '@/lib/respostas';
import { inteiroOpcional, lerQuery, numeroObrigatorio, primeiraMensagem } from '@/lib/validacao';

// Roda no runtime Node.js (o padrão). Com Cache Components ligado, o Next não aceita a
// exportação `runtime` nem mesmo como 'nodejs', por isso ela não aparece aqui.

const parametros = z.object({
  lat: numeroObrigatorio('lat', -90, 90),
  lon: numeroObrigatorio('lon', -180, 180),
  dias: inteiroOpcional('dias', 1, 16, 7),
  passados: inteiroOpcional('passados', 0, 92, 0),
});

/** GET /api/previsao?lat=&lon=&dias=&passados= — previsão horária e diária do Open-Meteo. */
export async function GET(request: NextRequest) {
  const validacao = parametros.safeParse(lerQuery(request.nextUrl));
  if (!validacao.success) return respostaErro(400, primeiraMensagem(validacao.error));

  const { lat, lon, dias, passados } = validacao.data;
  const url = urlPrevisao(lat, lon, {
    diasPrevisao: dias,
    diasPassados: passados,
    apiKey: process.env.OPEN_METEO_API_KEY || undefined,
  });

  return repassarOpenMeteo(url, 'public, s-maxage=1800, stale-while-revalidate=3600');
}
