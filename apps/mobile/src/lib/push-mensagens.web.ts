import { apagar, gravar, ler } from '@/lib/armazenamento';
import { chamarServidor } from '@/lib/conta';

/**
 * Avisos de mensagem nova na versão web: Web Push com o service worker public/sw-avisos.js (exportado para a
 * raiz do site). Funciona no Chrome, Edge e Firefox do computador e do Android; no iPhone, só com o site
 * adicionado à tela de início (iOS 16.4 ou mais novo). Sem push, o servidor avisa por e-mail.
 */

const CHAVE = 'graoraiz:push-mensagens';
const SW = '/sw-avisos.js';

export type EstadoAvisosMensagem = 'ativo' | 'desligado' | 'negado' | 'indisponivel';

function suportado(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/** Chave VAPID (base64url) no formato que o navegador pede. */
function bytesDaChave(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const bruto = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(bruto.length));
  for (let i = 0; i < bruto.length; i++) bytes[i] = bruto.charCodeAt(i);
  return bytes;
}

export async function estadoAvisosMensagem(): Promise<EstadoAvisosMensagem> {
  if (!suportado()) return 'indisponivel';
  if (Notification.permission === 'denied') return 'negado';
  if (Notification.permission !== 'granted') return 'desligado';
  const registro = await navigator.serviceWorker.getRegistration('/');
  const inscricao = await registro?.pushManager.getSubscription();
  return inscricao && ler<string>(CHAVE) === inscricao.endpoint ? 'ativo' : 'desligado';
}

/** Pede a permissão e inscreve este navegador na conta. Chamar a partir de um toque da pessoa. */
export async function ativarAvisosMensagem(): Promise<EstadoAvisosMensagem> {
  if (!suportado()) return 'indisponivel';
  // A permissão primeiro, ainda dentro do toque (o Safari só pergunta assim).
  const permissao = await Notification.requestPermission();
  if (permissao !== 'granted') return permissao === 'denied' ? 'negado' : 'desligado';
  const { chave } = await chamarServidor<{ chave: string | null }>('/api/push');
  if (!chave) return 'indisponivel';
  const registro = await navigator.serviceWorker.register(SW, { scope: '/' });
  await navigator.serviceWorker.ready;
  const inscricao =
    (await registro.pushManager.getSubscription()) ??
    (await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytesDaChave(chave) }));
  const { keys } = inscricao.toJSON();
  await chamarServidor('/api/push', { metodo: 'POST', corpo: { tipo: 'web', endpoint: inscricao.endpoint, chaves: keys } });
  gravar(CHAVE, inscricao.endpoint);
  return 'ativo';
}

/** Para de avisar neste navegador (antes de sair da conta). Nunca lança. */
export async function desligarAvisosMensagem(): Promise<void> {
  const endpoint = ler<string>(CHAVE);
  if (!endpoint) return;
  try {
    await chamarServidor('/api/push', { metodo: 'DELETE', corpo: { endpoint } });
  } catch {
    // Sem rede: a inscrição fica órfã no servidor até o serviço de push dizer que não vale mais.
  }
  apagar(CHAVE);
}

/** Na web quem abre a conversa ao tocar no aviso é o service worker. */
export function ouvirToqueNasMensagens(_aoAbrir: (caminho: string) => void): () => void {
  return () => {};
}
