import {
  banco,
  bloqueadoPorTentativas,
  conferirSenha,
  emitirToken,
  erro,
  esquemaEntrar,
  json,
  lerCorpo,
  limparFalhas,
  preflight,
  registrarFalha,
} from '@/lib/contas';
import { primeiraMensagem } from '@/lib/validacao';

export const OPTIONS = preflight;

const MSG_INVALIDO = 'E-mail ou senha não conferem.';

/** POST /api/conta/entrar { email, senha } → { token, conta } */
export async function POST(request: Request) {
  const lido = await lerCorpo(request, 2_000);
  if ('falha' in lido) return lido.falha;
  const validacao = esquemaEntrar.safeParse(lido.corpo);
  if (!validacao.success) return erro(400, primeiraMensagem(validacao.error));
  const { email, senha } = validacao.data;

  if (bloqueadoPorTentativas(email)) return erro(429, 'Muitas tentativas. Espere 15 minutos e tente de novo.');

  try {
    const r = await banco().query<{ id: string; nome: string; email: string; demo: boolean; senha_hash: string }>(
      'select id, nome, email, demo, senha_hash from app.conta where email = $1',
      [email],
    );
    const linha = r.rows[0];
    if (!linha || !(await conferirSenha(senha, linha.senha_hash))) {
      registrarFalha(email);
      return erro(401, MSG_INVALIDO);
    }
    limparFalhas(email);
    const conta = { id: linha.id, nome: linha.nome, email: linha.email, demo: linha.demo };
    return json({ token: emitirToken(conta.id), conta });
  } catch (e) {
    console.error('[conta] falha ao entrar:', e instanceof Error ? e.message : e);
    return erro(503, 'Não foi possível entrar agora. Tente de novo em instantes.');
  }
}
