import {
  banco,
  bloqueadoPorTentativas,
  erro,
  esquemaRecuperar,
  gerarCodigo,
  hashCodigo,
  json,
  lerCorpo,
  preflight,
  registrarFalha,
  VALIDADE_CODIGO_MIN,
} from '@/lib/contas';
import { EmailIndisponivel, enviarEmail } from '@/lib/email';
import { primeiraMensagem } from '@/lib/validacao';

export const OPTIONS = preflight;

const RESPOSTA = { ok: true, mensagem: `Se houver conta com esse e-mail, o código chega em instantes. Ele vale ${VALIDADE_CODIGO_MIN} minutos.` };

/** POST /api/conta/recuperar { email } → manda um código de 6 números por e-mail (a resposta é a mesma com ou sem conta). */
export async function POST(request: Request) {
  const lido = await lerCorpo(request, 1_000);
  if ('falha' in lido) return lido.falha;
  const validacao = esquemaRecuperar.safeParse(lido.corpo);
  if (!validacao.success) return erro(400, primeiraMensagem(validacao.error));
  const { email } = validacao.data;

  const chave = `recuperar:${email}`;
  if (bloqueadoPorTentativas(chave)) return erro(429, 'Muitos pedidos de código. Espere 15 minutos e tente de novo.');
  registrarFalha(chave); // cada pedido conta: freia quem tenta encher a caixa de alguém

  try {
    const r = await banco().query<{ id: string; nome: string }>('select id, nome from app.conta where email = $1 and not demo', [email]);
    const conta = r.rows[0];
    if (!conta) return json(RESPOSTA);
    const codigo = gerarCodigo();
    await banco().query(
      `insert into app.recuperacao_senha (conta_id, codigo_hash, expira_em, tentativas, criado_em)
       values ($1, $2, now() + make_interval(mins => $3), 0, now())
       on conflict (conta_id) do update set codigo_hash = excluded.codigo_hash, expira_em = excluded.expira_em, tentativas = 0, criado_em = now()`,
      [conta.id, hashCodigo(conta.id, codigo), VALIDADE_CODIGO_MIN],
    );
    await enviarEmail({
      para: email,
      assunto: `Seu código do Grão Raiz: ${codigo}`,
      texto: `Olá, ${conta.nome}.\n\nSeu código para criar uma senha nova no Grão Raiz é ${codigo}.\nEle vale ${VALIDADE_CODIGO_MIN} minutos.\n\nSe não foi você que pediu, ignore este e-mail: sua senha continua a mesma.`,
    });
    return json(RESPOSTA);
  } catch (e) {
    console.error('[conta] falha ao mandar código:', e instanceof Error ? e.message : e);
    if (e instanceof EmailIndisponivel) return erro(503, 'A recuperação de senha por e-mail ainda não está disponível. Fale com o suporte do Grão Raiz.');
    return erro(503, 'Não foi possível mandar o código agora. Tente de novo em instantes.');
  }
}
