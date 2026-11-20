import { CONTATO_WHATSAPP_EXIBIR, linkWhatsApp } from '@/lib/config';

/** Link de contato pelo WhatsApp ("WhatsApp (54) 99964-8368"), com mensagem pronta opcional. */
export function ContatoWhatsApp({ mensagem, className }: { mensagem?: string; className?: string }) {
  return (
    <a href={linkWhatsApp(mensagem)} target="_blank" rel="noopener" className={className}>
      WhatsApp {CONTATO_WHATSAPP_EXIBIR}
    </a>
  );
}
