/**
 * Configuração do site, lida das variáveis de ambiente (veja .env.example).
 * Valores vazios contam como "não definidos", para que um .env copiado com campos em branco
 * não esconda os padrões.
 */

function texto(valor: string | undefined): string | undefined {
  const limpo = valor?.trim();
  return limpo ? limpo : undefined;
}

export const SITE_URL = (texto(process.env.NEXT_PUBLIC_SITE_URL) ?? 'http://localhost:3000').replace(/\/+$/, '');

export const CONTATO_EMAIL = texto(process.env.NEXT_PUBLIC_CONTATO_EMAIL) ?? 'contato@graoraiz.com.br';

export const PLAY_URL: string | null = texto(process.env.NEXT_PUBLIC_PLAY_URL) ?? null;

export const APP_STORE_URL: string | null = texto(process.env.NEXT_PUBLIC_APP_STORE_URL) ?? null;

export const RESPONSAVEL_PLACEHOLDER = '[nome ou razão social do responsável — preencher]';

export const RESPONSAVEL = texto(process.env.NEXT_PUBLIC_RESPONSAVEL) ?? RESPONSAVEL_PLACEHOLDER;

/** Enquanto o responsável não for preenchido, os textos legais mostram um aviso de revisão. */
export const RESPONSAVEL_PENDENTE = RESPONSAVEL === RESPONSAVEL_PLACEHOLDER;

export const PRECO = { mensal: 'R$ 19,90', anual: 'R$ 149,90' } as const;

/** Data exibida na Política de Privacidade e nos Termos de Uso. */
export const ULTIMA_ATUALIZACAO_LEGAL = '22 de outubro de 2026';

export const NOME_APP = 'Grão Raiz';
