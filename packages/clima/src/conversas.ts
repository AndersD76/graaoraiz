// Conversas dos classificados: comprador e vendedor falam pelo app (desde 24/11/2026, sem WhatsApp).
import type { SituacaoAnuncio } from './maquinas';

/** Tamanho máximo de uma mensagem, em caracteres. */
export const MAX_MENSAGEM = 1000;

/** Uma conversa na lista "Conversas". */
export interface ConversaResumo {
  id: string;
  anuncio: { id: string; titulo: string; foto: string | null; preco: number; situacao: SituacaoAnuncio };
  /** Primeiro nome da outra pessoa. */
  com: string;
  /** "vendedor" quando o anúncio é meu. */
  papel: 'vendedor' | 'comprador';
  ultima: { texto: string; minha: boolean; em: string } | null;
  naoLidas: number;
  atualizadaEm: string;
}

export interface MensagemConversa {
  id: number;
  texto: string;
  minha: boolean;
  em: string;
}

/** Conversa aberta: o cabeçalho, as mensagens e até quando a outra pessoa leu (para o "visto"). */
export interface ConversaAberta extends Omit<ConversaResumo, 'ultima' | 'naoLidas'> {
  mensagens: MensagemConversa[];
  outroLeuEm: string;
}

/** Hora da mensagem: "14:05" se for de hoje, senão "23/11 14:05". */
export function horaMensagem(iso: string, agora: Date = new Date()): string {
  const d = new Date(iso);
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  const dia = (x: Date) => x.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' });
  return dia(d) === dia(agora) ? hora : `${dia(d)} ${hora}`;
}
