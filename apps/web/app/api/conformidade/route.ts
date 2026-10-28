import { contornoCruzado } from '@graoraiz/clima';
import { z } from 'zod';

import { consultarConformidade } from '@/lib/conformidade';
import { erro, json, lerCorpo, preflight } from '@/lib/contas';

export const OPTIONS = preflight;

// Território brasileiro, com folga: PRODES e CAR só cobrem o Brasil.
const ponto = z.tuple([z.number().min(-34).max(5.5), z.number().min(-74.5).max(-28.5)]);
const esquema = z.object({ contorno: z.array(ponto).min(3).max(1000) });

/**
 * POST /api/conformidade { contorno: [[lat, lon], …] } → desmatamento do PRODES no talhão e nos
 * imóveis do CAR que o contêm, para as regras da EUDR e do crédito rural.
 */
export async function POST(request: Request) {
  const lido = await lerCorpo(request, 100_000);
  if ('falha' in lido) return lido.falha;
  const dados = esquema.safeParse(lido.corpo);
  if (!dados.success) return erro(400, 'Contorno do talhão inválido. Desenhe o talhão no mapa e tente de novo.');
  if (contornoCruzado(dados.data.contorno)) return erro(400, 'O contorno do talhão se cruza (forma de "oito"). Redesenhe os cantos em ordem, dando a volta na lavoura.');
  try {
    return json(await consultarConformidade(dados.data.contorno));
  } catch (e) {
    console.error('[conformidade] falha:', e instanceof Error ? e.message : e);
    return erro(502, 'Os serviços do INPE e do CAR não responderam agora. Tente de novo em instantes.');
  }
}
