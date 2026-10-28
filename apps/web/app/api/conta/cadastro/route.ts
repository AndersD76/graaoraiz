import { banco, emitirToken, erro, esquemaCadastro, gerarHashSenha, json, lerCorpo, preflight } from '@/lib/contas';
import { primeiraMensagem } from '@/lib/validacao';

export const OPTIONS = preflight;

/** POST /api/conta/cadastro { nome, email, senha } → { token, conta } */
export async function POST(request: Request) {
  const lido = await lerCorpo(request, 2_000);
  if ('falha' in lido) return lido.falha;
  const validacao = esquemaCadastro.safeParse(lido.corpo);
  if (!validacao.success) return erro(400, primeiraMensagem(validacao.error));
  const { nome, email, senha } = validacao.data;

  try {
    const hash = await gerarHashSenha(senha);
    const r = await banco().query<{ id: string; demo: boolean }>(
      'insert into app.conta (email, nome, senha_hash) values ($1, $2, $3) on conflict (email) do nothing returning id, demo',
      [email, nome, hash],
    );
    if (!r.rows[0]) return erro(409, 'Já existe uma conta com este e-mail. Use "Entrar".');
    const conta = { id: r.rows[0].id, nome, email, demo: r.rows[0].demo };
    return json({ token: emitirToken(conta.id), conta }, 201);
  } catch (e) {
    console.error('[conta] falha no cadastro:', e instanceof Error ? e.message : e);
    return erro(503, 'Não foi possível criar a conta agora. Tente de novo em instantes.');
  }
}
