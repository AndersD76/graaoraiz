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

/** WhatsApp de contato (só dígitos, com 55 e DDD): rodapé, Sobre e textos legais. Decisão de 20/11/2026: sem e-mail de contato. */
const CONTATO_WHATSAPP = (texto(process.env.NEXT_PUBLIC_CONTATO_WHATSAPP) ?? '5554999648368').replace(/\D/g, '');

function formatarTelefone(digitos: string): string {
  const local = digitos.startsWith('55') ? digitos.slice(2) : digitos;
  const ddd = local.slice(0, 2);
  const numero = local.slice(2);
  const corte = numero.length - 4;
  return `(${ddd}) ${numero.slice(0, corte)}-${numero.slice(corte)}`;
}

/** "(54) 99964-8368" */
export const CONTATO_WHATSAPP_EXIBIR = formatarTelefone(CONTATO_WHATSAPP);
/** "+55 54 99964-8368", para os dados estruturados. */
export const CONTATO_WHATSAPP_TELEFONE = `+${CONTATO_WHATSAPP.slice(0, 2)} ${CONTATO_WHATSAPP_EXIBIR.replace(/[()]/g, '')}`;

/** Link que abre a conversa no WhatsApp, com uma mensagem pronta opcional. */
export function linkWhatsApp(mensagem?: string): string {
  return `https://wa.me/${CONTATO_WHATSAPP}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ''}`;
}

export const PLAY_URL: string | null = texto(process.env.NEXT_PUBLIC_PLAY_URL) ?? null;

export const APP_STORE_URL: string | null = texto(process.env.NEXT_PUBLIC_APP_STORE_URL) ?? null;

export const RESPONSAVEL_PLACEHOLDER = '[nome ou razão social do responsável — preencher]';

export const RESPONSAVEL = texto(process.env.NEXT_PUBLIC_RESPONSAVEL) ?? RESPONSAVEL_PLACEHOLDER;

/** Enquanto o responsável não for preenchido, os textos legais mostram um aviso de revisão. */
export const RESPONSAVEL_PENDENTE = RESPONSAVEL === RESPONSAVEL_PLACEHOLDER;

export const PRECO = { mensal: 'R$ 29,90', anual: 'R$ 249,90' } as const;

/** Data exibida na Política de Privacidade e nos Termos de Uso. */
export const ULTIMA_ATUALIZACAO_LEGAL = '20 de novembro de 2026';

export const NOME_APP = 'Grão Raiz';
