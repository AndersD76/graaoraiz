import { armadilhaPreenchida, esquemaListaEspera, gravarNoSupabase } from '@/lib/lista-espera';
import { respostaErro } from '@/lib/respostas';
import { primeiraMensagem } from '@/lib/validacao';

// Roda no runtime Node.js (o padrão). Com Cache Components ligado, o Next não aceita a
// exportação `runtime` nem mesmo como 'nodejs', por isso ela não aparece aqui.

const TAMANHO_MAXIMO = 4_000;

function ok(corpo: Record<string, unknown>): Response {
  return Response.json(corpo, { status: 200, headers: { 'Cache-Control': 'no-store' } });
}

/** POST /api/lista-espera — cadastro na lista de espera do lançamento. */
export async function POST(request: Request) {
  const bruto = await request.text().catch(() => '');
  if (bruto.length > TAMANHO_MAXIMO) return respostaErro(413, 'Dados grandes demais.');

  let corpo: unknown;
  try {
    corpo = JSON.parse(bruto);
  } catch {
    return respostaErro(400, 'Envie os dados em JSON.');
  }
  if (typeof corpo !== 'object' || corpo === null || Array.isArray(corpo)) {
    return respostaErro(400, 'Envie os dados em JSON.');
  }

  // Robô caiu na armadilha: responde como se tivesse dado certo e não guarda nada.
  if (armadilhaPreenchida(corpo)) return ok({ ok: true });

  const validacao = esquemaListaEspera.safeParse(corpo);
  if (!validacao.success) return respostaErro(400, primeiraMensagem(validacao.error));
  const entrada = validacao.data;

  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chave) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[lista-espera] Supabase não configurado; entrada recebida (não armazenada):', entrada);
      return ok({ ok: true, armazenado: false });
    }
    return respostaErro(503, 'Lista de espera ainda não configurada.');
  }

  let resultado;
  try {
    resultado = await gravarNoSupabase(entrada, { url, chave });
  } catch (e) {
    console.error('[lista-espera] falha ao gravar:', e instanceof Error ? e.message : e);
    resultado = 'falha' as const;
  }

  if (resultado === 'falha') {
    return respostaErro(502, 'Não foi possível salvar agora. Tente de novo em alguns minutos.');
  }
  return ok({ ok: true, armazenado: true });
}
