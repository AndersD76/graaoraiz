import {
  banco,
  conferirCodigo,
  emitirToken,
  erro,
  esquemaRedefinir,
  gerarHashSenha,
  json,
  lerCorpo,
  limparFalhas,
  MAX_TENTATIVAS_CODIGO,
  preflight,
} from '@/lib/contas';
import { primeiraMensagem } from '@/lib/validacao';

export const OPTIONS = preflight;

const VENCIDO = 'Código vencido ou já usado. Peça um novo.';

/** POST /api/conta/redefinir { email, codigo, senha } → troca a senha e já entra: { token, conta } */
export async function POST(request: Request) {
  const lido = await lerCorpo(request, 2_000);
  if ('falha' in lido) return lido.falha;
  const validacao = esquemaRedefinir.safeParse(lido.corpo);
  if (!validacao.success) return erro(400, primeiraMensagem(validacao.error));
  const { email, codigo, senha } = validacao.data;

  try {
    const r = await banco().query<{ id: string; nome: string; email: string; demo: boolean; codigo_hash: string; tentativas: number }>(
      `select c.id, c.nome, c.email, c.demo, r.codigo_hash, r.tentativas
         from app.conta c join app.recuperacao_senha r on r.conta_id = c.id
        where c.email = $1 and r.expira_em > now()`,
      [email],
    );
    const linha = r.rows[0];
    if (!linha || linha.demo) return erro(400, VENCIDO);
    if (linha.tentativas >= MAX_TENTATIVAS_CODIGO) return erro(429, 'Muitas tentativas com este código. Peça um novo.');
    if (!conferirCodigo(linha.id, codigo, linha.codigo_hash)) {
      await banco().query('update app.recuperacao_senha set tentativas = tentativas + 1 where conta_id = $1', [linha.id]);
      return erro(400, 'Código não confere. Confira o e-mail e digite de novo.');
    }
    await banco().query('update app.conta set senha_hash = $2 where id = $1', [linha.id, await gerarHashSenha(senha)]);
    await banco().query('delete from app.recuperacao_senha where conta_id = $1', [linha.id]);
    limparFalhas(email);
    const conta = { id: linha.id, nome: linha.nome, email: linha.email, demo: linha.demo };
    return json({ token: emitirToken(conta.id), conta });
  } catch (e) {
    console.error('[conta] falha ao redefinir senha:', e instanceof Error ? e.message : e);
    return erro(503, 'Não foi possível trocar a senha agora. Tente de novo em instantes.');
  }
}
