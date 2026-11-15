import { Platform } from 'react-native';

import { gravar, ler } from '@/lib/armazenamento';

/**
 * De onde o visitante veio, na web: UTM, site de origem e página de entrada. O primeiro toque fica para
 * sempre; o último muda quando a pessoa volta por outro link. Vai junto no cadastro (apps/web: app.conta.origem).
 * As páginas públicas do site gravam a mesma chave (app/layout.tsx), então a origem sobrevive à navegação.
 */
const PRIMEIRO = 'graoraiz:primeiro-toque';
const ULTIMO = 'graoraiz:ultimo-toque';
const UTMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

type Toque = Partial<Record<(typeof UTMS)[number] | 'referrer' | 'landing' | 'em', string>>;

export function capturarToque(): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const busca = new URLSearchParams(window.location.search);
  const toque: Toque = { landing: `${window.location.pathname}${window.location.search}`.slice(0, 300), em: new Date().toISOString() };
  for (const u of UTMS) {
    const v = busca.get(u);
    if (v) toque[u] = v.slice(0, 150);
  }
  let externo = false;
  try {
    externo = Boolean(document.referrer) && new URL(document.referrer).host !== window.location.host;
  } catch {
    externo = false;
  }
  if (externo) toque.referrer = document.referrer.slice(0, 300);
  if (!ler<Toque>(PRIMEIRO)) gravar(PRIMEIRO, toque);
  if (externo || UTMS.some((u) => toque[u])) gravar(ULTIMO, toque);
}

export function atribuicaoAtual(): { primeiro: Toque | null; ultimo: Toque | null } | null {
  const primeiro = ler<Toque>(PRIMEIRO);
  const ultimo = ler<Toque>(ULTIMO) ?? primeiro;
  return primeiro || ultimo ? { primeiro, ultimo } : null;
}
