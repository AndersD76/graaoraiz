/** Resposta JSON de erro, nunca guardada em cache. */
export function respostaErro(status: number, erro: string, extra: Record<string, unknown> = {}): Response {
  return Response.json({ erro, ...extra }, { status, headers: { 'Cache-Control': 'no-store' } });
}

const MSG_INDISPONIVEL = 'O serviço de dados meteorológicos não respondeu. Tente de novo em instantes.';

/**
 * Busca no Open-Meteo e devolve o JSON recebido sem alterações.
 * Falhas do serviço viram 502 { erro } (com o motivo informado pelo Open-Meteo, quando houver).
 * A URL não é registrada em log porque pode conter a chave comercial.
 */
export async function repassarOpenMeteo(url: string, cacheControl: string): Promise<Response> {
  let resposta: Response | undefined;
  // Uma nova tentativa só para falha de rede (conexão recusada, DNS etc.), nunca para erro HTTP.
  for (let tentativa = 1; tentativa <= 2 && !resposta; tentativa++) {
    try {
      resposta = await fetch(url, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      });
    } catch (e) {
      const causa = e instanceof Error && e.cause instanceof Error ? ` (${e.cause.message})` : '';
      console.error(`[open-meteo] falha de rede na tentativa ${tentativa}:`, e instanceof Error ? e.message + causa : e);
      if (e instanceof Error && e.name === 'TimeoutError') break; // já esperou 15 s: não insiste
    }
  }
  if (!resposta) return respostaErro(502, MSG_INDISPONIVEL);

  const texto = await resposta.text().catch(() => '');
  let corpo: unknown = null;
  try {
    corpo = JSON.parse(texto);
  } catch {
    corpo = null;
  }

  const motivo =
    corpo && typeof corpo === 'object' && 'reason' in corpo && typeof corpo.reason === 'string' ? corpo.reason : undefined;
  const sinalizouErro = Boolean(corpo && typeof corpo === 'object' && 'error' in corpo && corpo.error);

  if (!resposta.ok || corpo === null || sinalizouErro) {
    console.error('[open-meteo] resposta inválida:', resposta.status, motivo ?? '');
    return respostaErro(502, MSG_INDISPONIVEL, motivo ? { detalhe: motivo } : {});
  }

  return new Response(texto, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
    },
  });
}
