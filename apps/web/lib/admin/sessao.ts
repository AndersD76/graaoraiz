import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Sessão do painel administrativo: cookie assinado (HMAC-SHA256 com AUTH_SECRET) separado do token do app.
 * - Prefixo próprio na assinatura: um token do app nunca vale como sessão de administrador.
 * - Validade curta (12 h).
 * - Preso à senha: trocar a senha derruba as sessões abertas.
 */

export const COOKIE_ADMIN = 'graoraiz_admin';
export const VALIDADE_ADMIN_S = 12 * 60 * 60;

export interface DadosSessao {
  /** Id da conta. */
  sub: string;
  /** Expira em (segundos desde 1970). */
  exp: number;
  /** Impressão da senha atual (muda quando a senha muda). */
  s: string;
}

function segredoAdmin(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET não configurada (mínimo 32 caracteres)');
  return 'segredo-de-desenvolvimento-nao-use-em-producao';
}

function assinar(corpo: string): string {
  return createHmac('sha256', segredoAdmin()).update(`admin.${corpo}`).digest('base64url');
}

/** Impressão curta do hash da senha guardado no banco (o hash em si nunca vai para o cookie). */
export function impressaoSenha(senhaHash: string): string {
  return createHash('sha256').update(senhaHash).digest('base64url').slice(0, 16);
}

export function emitirSessao(contaId: string, senhaHash: string, agora = Date.now()): string {
  const dados: DadosSessao = { sub: contaId, exp: Math.floor(agora / 1000) + VALIDADE_ADMIN_S, s: impressaoSenha(senhaHash) };
  const corpo = Buffer.from(JSON.stringify(dados)).toString('base64url');
  return `${corpo}.${assinar(corpo)}`;
}

/** Dados da sessão válida (assinatura certa e dentro do prazo), ou null. A senha é conferida depois, no banco. */
export function lerSessao(valor: string | undefined | null, agora = Date.now()): DadosSessao | null {
  if (!valor) return null;
  const partes = valor.split('.');
  if (partes.length !== 2 || !partes[0] || !partes[1]) return null;
  const [corpo, assinatura] = partes;
  const esperada = Buffer.from(assinar(corpo));
  const recebida = Buffer.from(assinatura);
  if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) return null;
  try {
    const d = JSON.parse(Buffer.from(corpo, 'base64url').toString('utf8')) as Partial<DadosSessao>;
    if (typeof d.sub !== 'string' || typeof d.exp !== 'number' || typeof d.s !== 'string') return null;
    if (d.exp <= Math.floor(agora / 1000)) return null;
    return { sub: d.sub, exp: d.exp, s: d.s };
  } catch {
    return null;
  }
}
