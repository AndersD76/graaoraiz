'use server';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { abrirSessao, exigirAdmin, existeAdmin, fecharSessao, ipAtual, registrarAcao } from '@/lib/admin/auth';
import { banco, bloqueadoPorTentativas, conferirSenha, gerarHashSenha, limparFalhas, registrarFalha } from '@/lib/contas';
import { criarLimite } from '@/lib/limite';
import { idValido } from '@/lib/maquinas';
import { chavePainelConfere } from '@/lib/painel';
import { primeiraMensagem } from '@/lib/validacao';
import { vitrineMudou } from '@/lib/vitrine';

/** Resposta dos formulários com mensagem (entrada, primeiro acesso, novo administrador). */
export interface EstadoForm {
  erro?: string;
  ok?: string;
  /** Campos não secretos devolvidos para o formulário não perder o que a pessoa digitou. */
  valores?: { nome?: string; email?: string };
}

function devolver(dados: FormData): EstadoForm['valores'] {
  const nome = dados.get('nome');
  const email = dados.get('email');
  return { nome: typeof nome === 'string' ? nome.slice(0, 80) : undefined, email: typeof email === 'string' ? email.slice(0, 120) : undefined };
}

// Até 20 tentativas de entrada por IP a cada 15 minutos (além das 10 por e-mail, em lib/contas).
const limiteEntradaPorIp = criarLimite({ max: 20, janelaMs: 15 * 60_000 });

const email = z.string({ error: 'Informe o e-mail.' }).trim().toLowerCase().max(120, 'E-mail longo demais.').pipe(z.email({ error: 'E-mail inválido.' }));
const esquemaEntrada = z.object({ email, senha: z.string({ error: 'Informe a senha.' }).min(1, 'Informe a senha.').max(100) });
const esquemaPrimeiroAcesso = z.object({
  chave: z.string({ error: 'Informe a chave do painel.' }).min(1, 'Informe a chave do painel.').max(200),
  nome: z.string({ error: 'Informe seu nome.' }).trim().min(1, 'Informe seu nome.').max(80, 'Nome longo demais.'),
  email,
  // Conta que já existe no app entra com a senha dela (o app aceita 6 caracteres); conta nova precisa de 10.
  senha: z.string({ error: 'Informe a senha.' }).min(1, 'Informe a senha.').max(100, 'Senha longa demais.'),
});

const ERRO_ENTRADA = 'E-mail ou senha incorretos, ou a conta não tem acesso ao painel.';

/** Entrada com e-mail e senha de uma conta marcada como administradora. */
export async function entrar(_anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  if (!limiteEntradaPorIp(await ipAtual())) return { valores: devolver(dados), erro: 'Muitas tentativas. Espere 15 minutos e tente de novo.' };
  const v = esquemaEntrada.safeParse({ email: dados.get('email'), senha: dados.get('senha') });
  if (!v.success) return { valores: devolver(dados), erro: primeiraMensagem(v.error) };
  const chave = `admin:${v.data.email}`;
  if (bloqueadoPorTentativas(chave)) return { valores: devolver(dados), erro: 'Muitas tentativas. Espere 15 minutos e tente de novo.' };

  const r = await banco().query<{ id: string; nome: string; email: string; senha_hash: string; admin: boolean; demo: boolean }>(
    'select id, nome, email, senha_hash, admin, demo from app.conta where email = $1',
    [v.data.email],
  );
  const c = r.rows[0];
  // Confere a senha mesmo sem conta, para o tempo de resposta não revelar quem existe.
  const senhaCerta = await conferirSenha(v.data.senha, c?.senha_hash ?? 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA');
  if (!c || !senhaCerta || !c.admin || c.demo) {
    registrarFalha(chave);
    return { valores: devolver(dados), erro: ERRO_ENTRADA };
  }
  limparFalhas(chave);
  await abrirSessao(c.id, c.senha_hash);
  await registrarAcao({ id: c.id, nome: c.nome, email: c.email }, 'entrou', null);
  redirect('/admin');
}

/**
 * Primeiro acesso: só enquanto não existe nenhum administrador. Pede a chave do painel do servidor
 * (PAINEL_CHAVE ou AVALIACOES_CHAVE) e cria a conta de administrador, ou promove uma conta existente
 * se a senha informada for a dela.
 */
export async function primeiroAcesso(_anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const ip = await ipAtual();
  if (!limiteEntradaPorIp(ip)) return { valores: devolver(dados), erro: 'Muitas tentativas. Espere 15 minutos e tente de novo.' };
  if (await existeAdmin()) return { valores: devolver(dados), erro: 'O painel já tem administrador. Entre com e-mail e senha.' };
  const v = esquemaPrimeiroAcesso.safeParse({ chave: dados.get('chave'), nome: dados.get('nome'), email: dados.get('email'), senha: dados.get('senha') });
  if (!v.success) return { valores: devolver(dados), erro: primeiraMensagem(v.error) };
  if (!chavePainelConfere(v.data.chave)) return { valores: devolver(dados), erro: 'Chave do painel incorreta.' };

  const existente = await banco().query<{ id: string; nome: string; senha_hash: string; demo: boolean }>(
    'select id, nome, senha_hash, demo from app.conta where email = $1',
    [v.data.email],
  );
  let conta: { id: string; nome: string; senha_hash: string } | undefined;
  if (existente.rows[0]) {
    const e = existente.rows[0];
    if (e.demo || !(await conferirSenha(v.data.senha, e.senha_hash))) return { valores: devolver(dados), erro: 'Esse e-mail já tem conta no app. Use a senha dessa conta.' };
    // "where not exists": se duas pessoas tentarem ao mesmo tempo, só a primeira vira administradora.
    const r = await banco().query<{ id: string; nome: string; senha_hash: string }>(
      'update app.conta set admin = true where id = $1 and not exists (select 1 from app.conta where admin) returning id, nome, senha_hash',
      [e.id],
    );
    conta = r.rows[0];
  } else {
    if (v.data.senha.length < 10) return { valores: devolver(dados), erro: 'A senha do painel precisa de pelo menos 10 caracteres.' };
    const r = await banco().query<{ id: string; nome: string; senha_hash: string }>(
      `insert into app.conta (email, nome, senha_hash, admin)
       select $1, $2, $3, true where not exists (select 1 from app.conta where admin)
       returning id, nome, senha_hash`,
      [v.data.email, v.data.nome, await gerarHashSenha(v.data.senha)],
    );
    conta = r.rows[0];
  }
  if (!conta) return { valores: devolver(dados), erro: 'O painel já tem administrador. Entre com e-mail e senha.' };
  await abrirSessao(conta.id, conta.senha_hash);
  await registrarAcao({ id: conta.id, nome: conta.nome, email: v.data.email }, 'primeiro_acesso', conta.id);
  redirect('/admin');
}

export async function sair(): Promise<void> {
  await fecharSessao();
  redirect('/admin/entrar');
}

function texto(dados: FormData, campo: string): string {
  const v = dados.get(campo);
  return typeof v === 'string' ? v : '';
}

// ---------- anúncios ----------

export async function mudarSituacaoAnuncio(dados: FormData): Promise<void> {
  const admin = await exigirAdmin();
  const id = texto(dados, 'id');
  const situacao = texto(dados, 'situacao');
  if (!idValido(id) || (situacao !== 'ativo' && situacao !== 'pausado')) return;
  const r = await banco().query<{ categoria: string }>(
    "update app.anuncio set situacao = $2, atualizado_em = now() where id = $1 and situacao in ('ativo', 'pausado') returning categoria",
    [id, situacao],
  );
  if (r.rows[0]) {
    vitrineMudou(id, r.rows[0].categoria);
    await registrarAcao(admin, situacao === 'ativo' ? 'anuncio_reativado' : 'anuncio_pausado', id);
  }
  refresh();
}

export async function removerAnuncio(dados: FormData): Promise<void> {
  const admin = await exigirAdmin();
  const id = texto(dados, 'id');
  if (!idValido(id)) return;
  const r = await banco().query<{ categoria: string; titulo: string }>(
    "update app.anuncio set situacao = 'removido', atualizado_em = now() where id = $1 and situacao in ('ativo', 'pausado') returning categoria, titulo",
    [id],
  );
  if (r.rows[0]) {
    vitrineMudou(id, r.rows[0].categoria);
    await registrarAcao(admin, 'anuncio_removido', id, { titulo: r.rows[0].titulo });
  }
  refresh();
}

// ---------- comissões ----------

export async function marcarComissao(dados: FormData): Promise<void> {
  const admin = await exigirAdmin();
  const id = texto(dados, 'id');
  const paga = texto(dados, 'paga') === 'sim';
  if (!idValido(id)) return;
  const r = paga
    ? await banco().query('update app.venda set comissao_paga_em = now() where anuncio_id = $1 and comissao_paga_em is null', [id])
    : await banco().query('update app.venda set comissao_paga_em = null where anuncio_id = $1 and comissao_paga_em is not null', [id]);
  // O anúncio guarda uma cópia (some se o vendedor excluir a conta; a venda fica).
  await banco().query(`update app.anuncio set comissao_paga_em = ${paga ? 'now()' : 'null'} where id = $1 and situacao = 'vendido'`, [id]);
  if (r.rowCount) await registrarAcao(admin, paga ? 'comissao_paga' : 'comissao_reaberta', id);
  refresh();
}

// ---------- contas ----------

export async function excluirConta(dados: FormData): Promise<void> {
  const admin = await exigirAdmin();
  const id = texto(dados, 'id');
  if (!idValido(id) || id === admin.id) return;
  const anuncios = await banco().query<{ id: string; categoria: string }>(
    "select id, categoria from app.anuncio where conta_id = $1 and situacao <> 'removido'",
    [id],
  );
  const r = await banco().query<{ nome: string }>('delete from app.conta where id = $1 and not demo returning nome', [id]);
  if (r.rows[0]) {
    for (const a of anuncios.rows) vitrineMudou(a.id, a.categoria);
    await registrarAcao(admin, 'conta_excluida', id, { nome: r.rows[0].nome, anuncios: anuncios.rows.length });
  }
  redirect('/admin/usuarios');
}

export async function mudarAdmin(dados: FormData): Promise<void> {
  const admin = await exigirAdmin();
  const id = texto(dados, 'id');
  const valor = texto(dados, 'admin') === 'sim';
  // Ninguém tira o próprio acesso (evita ficar sem administrador por engano).
  if (!idValido(id) || id === admin.id) return;
  const r = await banco().query('update app.conta set admin = $2 where id = $1 and not demo and admin <> $2', [id, valor]);
  if (r.rowCount) await registrarAcao(admin, valor ? 'admin_concedido' : 'admin_retirado', id);
  refresh();
}

/** Configurações: dá acesso ao painel a uma conta que já existe no app. */
export async function adicionarAdmin(_anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const admin = await exigirAdmin();
  const v = email.safeParse(dados.get('email'));
  if (!v.success) return { erro: primeiraMensagem(v.error) };
  const r = await banco().query<{ id: string; nome: string }>(
    'update app.conta set admin = true where email = $1 and not demo and not admin returning id, nome',
    [v.data],
  );
  if (!r.rows[0]) return { erro: 'Nenhuma conta comum com esse e-mail. A pessoa precisa criar a conta no app antes.' };
  await registrarAcao(admin, 'admin_concedido', r.rows[0].id);
  refresh();
  return { ok: `${r.rows[0].nome} agora tem acesso ao painel.` };
}
