import { timingSafeEqual } from 'node:crypto';

/** Os painéis internos (/avaliacoes, /painel/maquinas) só abrem com ?chave= igual à do servidor. */
export function chavePainelConfere(informada: unknown): boolean {
  const certa = process.env.PAINEL_CHAVE || process.env.AVALIACOES_CHAVE;
  if (!certa || typeof informada !== 'string' || !informada) return false;
  const a = Buffer.from(informada);
  const b = Buffer.from(certa);
  return a.length === b.length && timingSafeEqual(a, b);
}
