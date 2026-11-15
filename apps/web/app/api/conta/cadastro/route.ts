import { banco, emitirToken, erro, esquemaCadastro, gerarHashSenha, json, lerCorpo, preflight } from '@/lib/contas';
import { criarLimite, ipDaRequisicao } from '@/lib/limite';
import { registrarEvento } from '@/lib/telemetria';
import { lerAtribuicao } from '@/lib/atribuicao';
import { primeiraMensagem } from '@/lib/validacao';

// Freio contra criação de contas em massa: 10 por hora por IP.
const permitido = criarLimite({ max: 10, janelaMs: 60 * 60 * 1000 });

export const OPTIONS = preflight;

/** POST /api/conta/cadastro { nome, email, senha, atribuicao? } → { token, conta } */
export async function POST(request: Request) {
  if (!permitido(ipDaRequisicao(request))) return erro(429, 'Muitas contas criadas seguidas. Espere um pouco e tente de novo.');
  const lido = await lerCorpo(request, 4_000);
  if ('falha' in lido) return lido.falha;
  const validacao = esquemaCadastro.safeParse(lido.corpo);
  if (!validacao.success) return erro(400, primeiraMensagem(validacao.error));
  const { nome, email, senha } = validacao.data;
  const atribuicao = lerAtribuicao((lido.corpo as { atribuicao?: unknown } | null)?.atribuicao);

  try {
    const hash = await gerarHashSenha(senha);
    const r = await banco().query<{ id: string; demo: boolean }>(
      'insert into app.conta (email, nome, senha_hash, origem) values ($1, $2, $3, $4) on conflict (email) do nothing returning id, demo',
      [email, nome, hash, atribuicao ? JSON.stringify(atribuicao) : null],
    );
    if (!r.rows[0]) return erro(409, 'Já existe uma conta com este e-mail. Use "Entrar".');
    const conta = { id: r.rows[0].id, nome, email, demo: r.rows[0].demo };
    registrarEvento({ nome: 'signup_completed', origem: 'servidor', contaId: conta.id, propriedades: { primeiro: atribuicao?.primeiro ?? null, ultimo: atribuicao?.ultimo ?? null } });
    return json({ token: emitirToken(conta.id), conta }, 201);
  } catch (e) {
    console.error('[conta] falha no cadastro:', e instanceof Error ? e.message : e);
    return erro(503, 'Não foi possível criar a conta agora. Tente de novo em instantes.');
  }
}
