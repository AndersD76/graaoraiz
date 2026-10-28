import { useSyncExternalStore } from 'react';

import { apagar, gravar, ler } from '@/lib/armazenamento';
import { reagendarAvisos } from '@/lib/avisos';
import { SERVIDOR_URL, DEMO_EMAIL, DEMO_SENHA } from '@/lib/config';
import { apagarTudo, assinar, dadosParaNuvem, type EstadoNuvem, obterEstado, salvarProdutor, substituirEstado } from '@/lib/estado';

/**
 * Conta do produtor (e-mail e senha no servidor apps/web) e cópia dos dados na nuvem.
 * O app continua local-first: tudo é lido e gravado no aparelho, e cada alteração sobe para a
 * conta alguns segundos depois. Sem internet, a alteração fica pendente e sobe na próxima chance.
 */

export interface Conta {
  id: string;
  nome: string;
  email: string;
  /** Conta de demonstração: abre a lavoura de exemplo; alterações ficam só no aparelho. */
  demo: boolean;
}

interface Sessao {
  token: string;
  conta: Conta;
  /** Já trouxe os dados da conta para o aparelho. Antes disso nada é enviado (não apaga a nuvem). */
  baixado: boolean;
}

const CHAVE_SESSAO = 'graoraiz:sessao';
const CHAVE_PENDENTE = 'graoraiz:sincronizacao-pendente';
const LIMITE_REDE_MS = 20_000;
const ESPERA_ENVIO_MS = 2_000;

/** Com servidor de contas configurado, o app pede login antes de tudo. */
export const EXIGE_CONTA = SERVIDOR_URL !== null;

let sessao: Sessao | null = ler<Sessao>(CHAVE_SESSAO);
const ouvintes = new Set<() => void>();

function definirSessao(nova: Sessao | null): void {
  sessao = nova;
  if (nova) gravar(CHAVE_SESSAO, nova);
  else apagar(CHAVE_SESSAO);
  ouvintes.forEach((o) => o());
}

function assinarConta(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

const obterSessao = () => sessao;

export function useConta(): Conta | null {
  return useSyncExternalStore(assinarConta, obterSessao, obterSessao)?.conta ?? null;
}

export class ErroConta extends Error {
  constructor(
    mensagem: string,
    readonly status = 0,
  ) {
    super(mensagem);
  }
}

async function chamar<T>(caminho: string, opcoes: { metodo?: string; corpo?: unknown; token?: string } = {}): Promise<T> {
  if (!SERVIDOR_URL) throw new ErroConta('Servidor de contas não configurado.');
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), LIMITE_REDE_MS);
  try {
    const resposta = await fetch(`${SERVIDOR_URL}${caminho}`, {
      method: opcoes.metodo ?? 'GET',
      headers: {
        ...(opcoes.corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(opcoes.token ? { Authorization: `Bearer ${opcoes.token}` } : {}),
      },
      body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
      signal: controle.signal,
    });
    const json = (await resposta.json().catch(() => null)) as ({ erro?: string } & T) | null;
    if (!resposta.ok) throw new ErroConta(json?.erro ?? `O servidor não respondeu (${resposta.status}). Tente de novo.`, resposta.status);
    return json as T;
  } catch (e) {
    if (e instanceof ErroConta) throw e;
    if (controle.signal.aborted) throw new ErroConta('A conexão demorou demais. Tente de novo com sinal melhor.');
    throw new ErroConta('Sem conexão com o servidor. Confira a internet e tente de novo.');
  } finally {
    clearTimeout(limite);
  }
}

// ---------- sincronização ----------

/** JSON do último estado que a nuvem tem (enviado ou baixado): evita reenviar o mesmo. */
let ultimoSincronizado: string | null = null;
let temporizador: ReturnType<typeof setTimeout> | null = null;

function podeEnviar(): boolean {
  return sessao !== null && sessao.baixado && !sessao.conta.demo;
}

async function enviar(): Promise<void> {
  if (!sessao || !podeEnviar()) return;
  const dados = dadosParaNuvem(obterEstado());
  const texto = JSON.stringify(dados);
  if (texto === ultimoSincronizado) {
    apagar(CHAVE_PENDENTE);
    return;
  }
  try {
    await chamar('/api/conta/dados', { metodo: 'PUT', corpo: { estado: dados }, token: sessao.token });
    ultimoSincronizado = texto;
    apagar(CHAVE_PENDENTE);
  } catch {
    gravar(CHAVE_PENDENTE, true); // tenta de novo na próxima alteração ou quando o app voltar
  }
}

// Cada alteração do estado agenda o envio (marcando pendente já, para quem abrir o app de novo não baixar por cima).
assinar(() => {
  if (!podeEnviar()) return;
  gravar(CHAVE_PENDENTE, true);
  if (temporizador) clearTimeout(temporizador);
  temporizador = setTimeout(() => void enviar(), ESPERA_ENVIO_MS);
});

async function baixar(): Promise<void> {
  if (!sessao) return;
  const { estado } = await chamar<{ estado: EstadoNuvem | null }>('/api/conta/dados', { token: sessao.token });
  if (estado) {
    substituirEstado(estado);
    ultimoSincronizado = JSON.stringify(dadosParaNuvem(obterEstado()));
  }
  definirSessao({ ...sessao, baixado: true });
  apagar(CHAVE_PENDENTE);
  // Conta nova: leva para a nuvem o que já estava no aparelho.
  if (!estado) await enviar();
  void reagendarAvisos({ buscar: true });
}

/** Ao abrir o app (e ao voltar para ele): manda o que ficou pendente ou traz o que mudou em outro aparelho. */
export async function sincronizar(): Promise<void> {
  if (!sessao) return;
  try {
    if (!sessao.baixado) await baixar();
    else if (sessao.conta.demo) return; // a demonstração só baixa ao entrar: as mexidas ficam no aparelho
    else if (ler<boolean>(CHAVE_PENDENTE)) await enviar();
    else await baixar();
  } catch (e) {
    if (e instanceof ErroConta && e.status === 401) definirSessao(null); // sessão vencida: pede login de novo
  }
}

// ---------- entrar, criar conta, sair ----------

async function iniciar(r: { token: string; conta: Conta }): Promise<void> {
  ultimoSincronizado = null;
  definirSessao({ token: r.token, conta: r.conta, baixado: false });
  try {
    await baixar();
  } catch {
    // Entrou, mas a rede caiu antes de trazer os dados: tenta de novo ao abrir o app, sem enviar nada antes.
  }
}

export async function entrar(email: string, senha: string): Promise<Conta> {
  const r = await chamar<{ token: string; conta: Conta }>('/api/conta/entrar', { metodo: 'POST', corpo: { email, senha } });
  await iniciar(r);
  return r.conta;
}

export async function criarConta(nome: string, email: string, senha: string): Promise<Conta> {
  const r = await chamar<{ token: string; conta: Conta }>('/api/conta/cadastro', { metodo: 'POST', corpo: { nome, email, senha } });
  if (!obterEstado().produtor) salvarProdutor(nome.trim());
  await iniciar(r);
  return r.conta;
}

/** Manda o código de 6 números para o e-mail (a resposta é a mesma com ou sem conta). */
export async function pedirCodigo(email: string): Promise<string> {
  const r = await chamar<{ mensagem: string }>('/api/conta/recuperar', { metodo: 'POST', corpo: { email } });
  return r.mensagem;
}

/** Troca a senha com o código do e-mail e já entra na conta. */
export async function redefinirSenha(email: string, codigo: string, senha: string): Promise<Conta> {
  const r = await chamar<{ token: string; conta: Conta }>('/api/conta/redefinir', { metodo: 'POST', corpo: { email, codigo, senha } });
  await iniciar(r);
  return r.conta;
}

export function entrarNaDemonstracao(): Promise<Conta> {
  return entrar(DEMO_EMAIL, DEMO_SENHA);
}

/** Tira a conta deste aparelho. Os dados ficam guardados na conta; no aparelho são apagados. */
export async function sair(): Promise<void> {
  if (podeEnviar() && ler<boolean>(CHAVE_PENDENTE)) await enviar();
  if (temporizador) clearTimeout(temporizador);
  ultimoSincronizado = null;
  definirSessao(null);
  apagarTudo();
  await reagendarAvisos(); // sem talhões: cancela os avisos agendados
}

/** Apaga a conta e os dados dela no servidor, e depois tudo neste aparelho. */
export async function excluirConta(): Promise<void> {
  if (!sessao) return;
  await chamar('/api/conta', { metodo: 'DELETE', token: sessao.token });
  if (temporizador) clearTimeout(temporizador);
  ultimoSincronizado = null;
  definirSessao(null);
  apagarTudo();
  await reagendarAvisos();
}
