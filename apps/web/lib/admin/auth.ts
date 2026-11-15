import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { cache } from 'react';
import { banco } from '@/lib/contas';
import { COOKIE_ADMIN, emitirSessao, impressaoSenha, lerSessao, VALIDADE_ADMIN_S } from './sessao';

/** Administrador da requisição: só o necessário para a tela (nunca o hash da senha). */
export interface Admin {
  id: string;
  nome: string;
  email: string;
}

/**
 * Lê o cookie e confere no banco, a cada requisição: a conta ainda existe, ainda é administradora,
 * não é a de demonstração e a senha é a mesma da hora do login. Tirar o acesso vale na hora.
 */
export const adminAtual = cache(async (): Promise<Admin | null> => {
  const valor = (await cookies()).get(COOKIE_ADMIN)?.value;
  // A validade da sessão depende da hora (Date.now): só no pedido de verdade, nunca num pré-render.
  await connection();
  const sessao = lerSessao(valor);
  if (!sessao) return null;
  const r = await banco().query<Admin & { senha_hash: string }>(
    'select id, nome, email, senha_hash from app.conta where id = $1 and admin and not demo',
    [sessao.sub],
  );
  const c = r.rows[0];
  if (!c || impressaoSenha(c.senha_hash) !== sessao.s) return null;
  return { id: c.id, nome: c.nome, email: c.email };
});

/** Para páginas e ações do painel: sem sessão válida, vai para a tela de entrada. */
export async function exigirAdmin(): Promise<Admin> {
  const admin = await adminAtual();
  if (!admin) redirect('/admin/entrar');
  return admin;
}

export async function abrirSessao(contaId: string, senhaHash: string): Promise<void> {
  (await cookies()).set(COOKIE_ADMIN, emitirSessao(contaId, senhaHash), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/admin',
    maxAge: VALIDADE_ADMIN_S,
  });
}

export async function fecharSessao(): Promise<void> {
  (await cookies()).set(COOKIE_ADMIN, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/admin', maxAge: 0 });
}

/** Já existe algum administrador? Enquanto não existir, a tela de entrada oferece o primeiro acesso. */
export async function existeAdmin(): Promise<boolean> {
  const r = await banco().query('select 1 from app.conta where admin limit 1');
  return (r.rowCount ?? 0) > 0;
}

/** IP de quem chamou (atrás do proxy do Railway vem no X-Forwarded-For). */
export async function ipAtual(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'desconhecido';
}

/** Registro de auditoria: quem fez o quê, em quê. Sem senha, e-mail de terceiros ou WhatsApp nos detalhes. */
export async function registrarAcao(admin: Admin, acao: string, alvo: string | null, detalhes: Record<string, unknown> = {}): Promise<void> {
  await banco().query('insert into app.acao_admin (admin_id, admin_nome, acao, alvo, detalhes) values ($1, $2, $3, $4, $5)', [
    admin.id,
    admin.nome,
    acao,
    alvo,
    JSON.stringify(detalhes),
  ]);
}
