import { createHmac, randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto';

import { Pool } from 'pg';
import { z } from 'zod';

import { respostaErro } from './respostas';

/**
 * Contas do app: cadastro e login por e-mail e senha, e o estado do app guardado na nuvem.
 * Banco: DATABASE_URL (Postgres, tabelas em db/contas.sql). Sessão: token assinado com AUTH_SECRET,
 * enviado pelo app no cabeçalho Authorization: Bearer <token>.
 */

let pool: Pool | null = null;

export function banco(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não configurada');
  pool ??= new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 15_000 });
  return pool;
}

// ---------- senha ----------

const N = 16384;
const R = 8;
const P = 1;
const TAMANHO = 64;

function derivar(senha: string, sal: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(senha, sal, TAMANHO, { N, r: R, p: P }, (erro, chave) => (erro ? reject(erro) : resolve(chave)));
  });
}

/** "scrypt$N$r$p$sal$hash" (base64). */
export async function gerarHashSenha(senha: string): Promise<string> {
  const sal = randomBytes(16);
  const hash = await derivar(senha, sal);
  return `scrypt$${N}$${R}$${P}$${sal.toString('base64')}$${hash.toString('base64')}`;
}

export async function conferirSenha(senha: string, guardado: string): Promise<boolean> {
  const partes = guardado.split('$');
  if (partes.length !== 6 || partes[0] !== 'scrypt') return false;
  const sal = Buffer.from(partes[4], 'base64');
  const esperado = Buffer.from(partes[5], 'base64');
  const hash = await derivar(senha, sal);
  return hash.length === esperado.length && timingSafeEqual(hash, esperado);
}

// ---------- token de sessão ----------

const VALIDADE_S = 180 * 24 * 60 * 60;

function segredo(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET não configurada (mínimo 32 caracteres)');
  return 'segredo-de-desenvolvimento-nao-use-em-producao';
}

function assinar(dados: string): string {
  return createHmac('sha256', segredo()).update(dados).digest('base64url');
}

export function emitirToken(contaId: string): string {
  const corpo = Buffer.from(JSON.stringify({ sub: contaId, exp: Math.floor(Date.now() / 1000) + VALIDADE_S })).toString('base64url');
  return `${corpo}.${assinar(corpo)}`;
}

/** Id da conta do token válido, ou null. */
export function lerToken(token: string): string | null {
  const [corpo, assinatura] = token.split('.');
  if (!corpo || !assinatura) return null;
  const esperada = Buffer.from(assinar(corpo));
  const recebida = Buffer.from(assinatura);
  if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) return null;
  try {
    const { sub, exp } = JSON.parse(Buffer.from(corpo, 'base64url').toString('utf8')) as { sub?: unknown; exp?: unknown };
    if (typeof sub !== 'string' || typeof exp !== 'number' || exp < Date.now() / 1000) return null;
    return sub;
  } catch {
    return null;
  }
}

// ---------- validação ----------

const email = z
  .string({ error: 'Informe o e-mail.' })
  .trim()
  .toLowerCase()
  .max(120, 'E-mail longo demais.')
  .pipe(z.email({ error: 'E-mail inválido.' }));
const senha = z.string({ error: 'Informe a senha.' }).min(6, 'A senha precisa de pelo menos 6 caracteres.').max(100, 'Senha longa demais.');

export const esquemaCadastro = z.object({
  nome: z.string({ error: 'Informe seu nome.' }).trim().min(1, 'Informe seu nome.').max(80, 'Nome longo demais.'),
  email,
  senha,
});

export const esquemaEntrar = z.object({ email, senha: z.string({ error: 'Informe a senha.' }).min(1, 'Informe a senha.').max(100) });

export const esquemaRecuperar = z.object({ email });

export const esquemaRedefinir = z.object({
  email,
  codigo: z.string({ error: 'Informe o código.' }).trim().regex(/^\d{6}$/, 'O código tem 6 números.'),
  senha,
});

// ---------- código de recuperação ----------

export const VALIDADE_CODIGO_MIN = 15;
export const MAX_TENTATIVAS_CODIGO = 5;

/** Seis números, sorteados com gerador criptográfico. */
export function gerarCodigo(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/** O código fica guardado só como HMAC (ligado à conta), nunca em texto. */
export function hashCodigo(contaId: string, codigo: string): string {
  return assinar(`recuperacao:${contaId}:${codigo}`);
}

export function conferirCodigo(contaId: string, codigo: string, guardado: string): boolean {
  const a = Buffer.from(hashCodigo(contaId, codigo));
  const b = Buffer.from(guardado);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---------- respostas ----------

/** O app nativo não precisa, mas a versão web (testes e demonstração no PC) chama de outra origem. */
export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

export function json(corpo: unknown, status = 200): Response {
  return Response.json(corpo, { status, headers: { 'Cache-Control': 'no-store', ...CORS } });
}

export function erro(status: number, mensagem: string): Response {
  const r = respostaErro(status, mensagem);
  for (const [k, v] of Object.entries(CORS)) r.headers.set(k, v);
  return r;
}

export function preflight(): Response {
  return new Response(null, { status: 204, headers: CORS });
}

/** Lê o corpo JSON com limite de tamanho; devolve a resposta de erro quando não der. */
export async function lerCorpo(request: Request, limite: number): Promise<{ corpo: unknown } | { falha: Response }> {
  const bruto = await request.text().catch(() => '');
  if (bruto.length > limite) return { falha: erro(413, 'Dados grandes demais.') };
  try {
    return { corpo: JSON.parse(bruto) };
  } catch {
    return { falha: erro(400, 'Envie os dados em JSON.') };
  }
}

export interface ContaPublica {
  id: string;
  nome: string;
  email: string;
  demo: boolean;
}

/** Conta do cabeçalho Authorization, ou a resposta 401. */
export async function contaDaRequisicao(request: Request): Promise<{ conta: ContaPublica } | { falha: Response }> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const id = token ? lerToken(token) : null;
  if (!id) return { falha: erro(401, 'Sessão expirada. Entre de novo.') };
  const r = await banco().query<ContaPublica>('select id, nome, email, demo from app.conta where id = $1', [id]);
  if (!r.rows[0]) return { falha: erro(401, 'Conta não encontrada. Entre de novo.') };
  return { conta: r.rows[0] };
}

// ---------- tentativas de login ----------

const tentativas = new Map<string, { n: number; desde: number }>();
const JANELA_MS = 15 * 60 * 1000;
const MAX_TENTATIVAS = 10;

/** Freia adivinhação de senha: 10 erros por e-mail a cada 15 minutos (por instância do servidor). */
export function bloqueadoPorTentativas(chave: string): boolean {
  const t = tentativas.get(chave);
  if (!t || Date.now() - t.desde > JANELA_MS) return false;
  return t.n >= MAX_TENTATIVAS;
}

export function registrarFalha(chave: string): void {
  const t = tentativas.get(chave);
  if (!t || Date.now() - t.desde > JANELA_MS) tentativas.set(chave, { n: 1, desde: Date.now() });
  else t.n += 1;
}

export function limparFalhas(chave: string): void {
  tentativas.delete(chave);
}
