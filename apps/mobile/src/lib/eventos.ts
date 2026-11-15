import { Platform } from 'react-native';

import { gravar, ler } from '@/lib/armazenamento';
import { SERVIDOR_URL } from '@/lib/config';
import { chamarServidor } from '@/lib/conta';

/**
 * Marcos do funil que só o app enxerga (apps/web: POST /api/eventos → app.evento). Cadastro, anúncio,
 * contato e venda já são registrados no servidor. Falha de rede nunca atrapalha o uso: o evento se perde.
 */
export type EventoApp = 'app_opened' | 'field_created' | 'aha_reached' | 'alerts_enabled' | 'listing_viewed';

const SESSAO = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

export function registrar(nome: EventoApp, propriedades?: Record<string, string | number | boolean | null>): void {
  if (!SERVIDOR_URL) return;
  const pagina = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.pathname : undefined;
  chamarServidor('/api/eventos', { metodo: 'POST', corpo: { nome, sessao: SESSAO, pagina, propriedades: { plataforma: Platform.OS, ...propriedades } } }).catch(() => undefined);
}

/** Marco que só conta uma vez por aparelho (ex.: a primeira previsão do próprio talhão). */
export function registrarUmaVez(nome: EventoApp, propriedades?: Record<string, string | number | boolean | null>): void {
  const chave = `graoraiz:evento:${nome}`;
  if (ler<boolean>(chave)) return;
  gravar(chave, true);
  registrar(nome, propriedades);
}
