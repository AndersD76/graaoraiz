import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { apagar, gravar, ler } from '@/lib/armazenamento';
import { chamarServidor } from '@/lib/conta';

/**
 * Avisos de mensagem nova dos classificados no app Android/iPhone: o token Expo deste aparelho fica na conta
 * (apps/web: /api/push) e o servidor manda o push quando chega mensagem. Na web: push-mensagens.web.ts.
 */

const CHAVE = 'graoraiz:push-mensagens';
const CANAL = 'mensagens';

export type EstadoAvisosMensagem = 'ativo' | 'desligado' | 'negado' | 'indisponivel';

function projetoEas(): string | null {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
}

export async function estadoAvisosMensagem(): Promise<EstadoAvisosMensagem> {
  if (!projetoEas()) return 'indisponivel';
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'denied') return 'negado';
  return status === 'granted' && ler<string>(CHAVE) ? 'ativo' : 'desligado';
}

/** Pede a permissão e registra este aparelho na conta. Chamar a partir de um toque da pessoa. */
export async function ativarAvisosMensagem(): Promise<EstadoAvisosMensagem> {
  const projectId = projetoEas();
  if (!projectId) return 'indisponivel';
  const permissao = await Notifications.requestPermissionsAsync();
  if (permissao.status !== 'granted') return permissao.canAskAgain ? 'desligado' : 'negado';
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Mensagens dos classificados',
      // eslint-disable-next-line import/namespace
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await chamarServidor('/api/push', { metodo: 'POST', corpo: { tipo: 'expo', endpoint: token } });
  gravar(CHAVE, token);
  return 'ativo';
}

/** Para de avisar neste aparelho (antes de sair da conta). Nunca lança. */
export async function desligarAvisosMensagem(): Promise<void> {
  const endpoint = ler<string>(CHAVE);
  if (!endpoint) return;
  try {
    await chamarServidor('/api/push', { metodo: 'DELETE', corpo: { endpoint } });
  } catch {
    // Sem rede: o servidor apaga o token quando o Expo disser que não vale mais.
  }
  apagar(CHAVE);
}

/** Ao tocar num aviso de mensagem, chama `aoAbrir` com o caminho da conversa. Devolve a função que para de ouvir. */
export function ouvirToqueNasMensagens(aoAbrir: (caminho: string) => void): () => void {
  const tratar = (resposta: Notifications.NotificationResponse | null) => {
    const caminho = resposta?.notification.request.content.data?.caminho;
    if (typeof caminho === 'string' && caminho.startsWith('/conversa')) aoAbrir(caminho);
  };
  tratar(Notifications.getLastNotificationResponse());
  const assinatura = Notifications.addNotificationResponseReceivedListener(tratar);
  return () => assinatura.remove();
}
