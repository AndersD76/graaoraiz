/**
 * Limite de uso em memória (por instância do servidor): no máximo `max` usos por `janelaMs` para cada chave.
 * Serve de freio contra abuso em rotas caras ou que expõem dados (contato, cadastro, fotos, eventos).
 */
export function criarLimite({ max, janelaMs }: { max: number; janelaMs: number }) {
  const usos = new Map<string, { n: number; desde: number }>();
  return function permitido(chave: string, agora = Date.now()): boolean {
    const u = usos.get(chave);
    if (!u || agora - u.desde > janelaMs) {
      if (usos.size > 20_000) usos.clear();
      usos.set(chave, { n: 1, desde: agora });
      return true;
    }
    u.n += 1;
    return u.n <= max;
  };
}

/** IP de quem chama (primeiro do X-Forwarded-For, como o Railway entrega). */
export function ipDaRequisicao(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'sem-ip';
}
