// Ajudas de SEO e GEO: endereços absolutos, JSON-LD seguro, textos no tamanho certo e crawlers.
import { SITE_URL } from '@/lib/config';

export function absoluta(caminho: string): string {
  return `${SITE_URL}${caminho.startsWith('/') ? caminho : `/${caminho}`}`;
}

/** JSON-LD para <script type="application/ld+json">: escapa "<" para texto do usuário não fechar a tag. */
export function jsonLd(dados: unknown): string {
  return JSON.stringify(dados).replace(/</g, '\\u003c');
}

/** Corta no limite sem partir palavra, com reticências. */
export function cortar(texto: string, max: number): string {
  const limpo = texto.replace(/\s+/g, ' ').trim();
  if (limpo.length <= max) return limpo;
  const corte = limpo.slice(0, max - 1);
  const espaco = corte.lastIndexOf(' ');
  return `${(espaco > max * 0.6 ? corte.slice(0, espaco) : corte).replace(/[\s,.;:–-]+$/, '')}…`;
}

/** Crawlers de busca e de IA liberados no robots.txt e contados no monitor (app.evento, crawler_ai_hit). */
export const CRAWLERS_BUSCA = ['Googlebot', 'Bingbot', 'Applebot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User', 'Claude-SearchBot', 'Claude-User'];

/** Crawlers que coletam para treinar modelos: liberados hoje; a decisão de bloquear é do dono do site. */
export const CRAWLERS_TREINO = ['GPTBot', 'Google-Extended', 'ClaudeBot', 'Applebot-Extended', 'CCBot'];

const IA = /(GPTBot|OAI-SearchBot|ChatGPT-User|PerplexityBot|Perplexity-User|ClaudeBot|Claude-SearchBot|Claude-User|anthropic-ai|Google-Extended|Applebot-Extended|CCBot|Bytespider|Amazonbot|meta-externalagent|DuckAssistBot|MistralAI-User)/i;

/** Nome do crawler de IA no user-agent, ou null. */
export function crawlerDeIa(userAgent: string | null): string | null {
  return userAgent?.match(IA)?.[1] ?? null;
}
