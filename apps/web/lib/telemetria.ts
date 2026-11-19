// Telemetria local: cada evento do funil vai para a tabela app.evento, no próprio banco.
// Migrável depois para um serviço central com INSERT ... SELECT; nada depende de serviço externo.
import { banco } from '@/lib/contas';

/** Nomes no formato objeto_ação. Os que o app pode mandar pela API estão em EVENTOS_DO_APP. */
export type NomeEvento =
  | 'app_opened'
  | 'signup_completed'
  | 'login_succeeded'
  | 'field_created'
  | 'aha_reached'
  | 'alerts_enabled'
  | 'listing_viewed'
  | 'listing_created'
  | 'seller_contacted'
  | 'listing_sold'
  | 'feedback_submitted'
  | 'crawler_ai_hit'
  | 'indexnow_sent'
  // Conteúdo orgânico e iscas (páginas do site). Propriedades: page_type, cluster, consulta_alvo, isca_id, canal.
  | 'pagina_vista'
  | 'isca_vista'
  | 'isca_iniciada'
  | 'isca_concluida'
  | 'lead_capturado'
  | 'cta_produto_clicado';

export const EVENTOS_DO_APP = ['app_opened', 'field_created', 'aha_reached', 'alerts_enabled', 'listing_viewed'] as const;
/** Eventos que as páginas do site mandam pela API (o lead_capturado nasce no servidor). */
export const EVENTOS_DO_SITE = ['pagina_vista', 'isca_vista', 'isca_iniciada', 'isca_concluida', 'cta_produto_clicado'] as const;

export interface Evento {
  nome: NomeEvento;
  origem: 'servidor' | 'app' | 'site';
  contaId?: string | null;
  sessao?: string | null;
  pagina?: string | null;
  propriedades?: Record<string, unknown>;
}

/** Grava o evento sem travar quem chamou: falha de telemetria nunca derruba a requisição. */
export function registrarEvento(e: Evento): void {
  void banco()
    .query('insert into app.evento (nome, origem, conta_id, sessao, pagina, propriedades) values ($1, $2, $3, $4, $5, $6)', [
      e.nome,
      e.origem,
      e.contaId ?? null,
      e.sessao?.slice(0, 64) ?? null,
      e.pagina?.slice(0, 300) ?? null,
      JSON.stringify(e.propriedades ?? {}),
    ])
    .catch((erro: unknown) => console.error('[telemetria] falha ao gravar', e.nome, erro instanceof Error ? erro.message : erro));
}
