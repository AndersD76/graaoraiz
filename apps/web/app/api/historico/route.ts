import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { urlHistoricoChuva } from '@graoraiz/clima';
import { repassarOpenMeteo, respostaErro } from '@/lib/respostas';
import { dataObrigatoria, lerQuery, numeroObrigatorio, primeiraMensagem, somarAnos } from '@/lib/validacao';

// Roda no runtime Node.js (o padrão). Com Cache Components ligado, o Next não aceita a
// exportação `runtime` nem mesmo como 'nodejs', por isso ela não aparece aqui.

const ANOS_MAXIMOS = 31;

const parametros = z
  .object({
    lat: numeroObrigatorio('lat', -90, 90),
    lon: numeroObrigatorio('lon', -180, 180),
    inicio: dataObrigatoria('inicio'),
    fim: dataObrigatoria('fim'),
    fuso: z.string().max(64).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.inicio > v.fim) {
      ctx.addIssue({ code: 'custom', path: ['inicio'], message: 'inicio deve ser igual ou anterior a fim.' });
    } else if (v.fim > somarAnos(v.inicio, ANOS_MAXIMOS)) {
      ctx.addIssue({ code: 'custom', path: ['fim'], message: `O período máximo é de ${ANOS_MAXIMOS} anos.` });
    }
  });

/** GET /api/historico?lat=&lon=&inicio=AAAA-MM-DD&fim=AAAA-MM-DD — chuva diária (reanálise ERA5). */
export async function GET(request: NextRequest) {
  const validacao = parametros.safeParse(lerQuery(request.nextUrl));
  if (!validacao.success) return respostaErro(400, primeiraMensagem(validacao.error));

  const { lat, lon, inicio, fim, fuso } = validacao.data;
  const url = urlHistoricoChuva(lat, lon, inicio, fim, {
    fuso,
    apiKey: process.env.OPEN_METEO_API_KEY || undefined,
  });

  return repassarOpenMeteo(url, 'public, s-maxage=86400, stale-while-revalidate=604800');
}
