import type { ConversaAberta, ConversaResumo, MensagemConversa } from '@graoraiz/clima';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { chamarServidor, ErroConta, useConta } from '@/lib/conta';

/**
 * Conversas dos classificados (apps/web: /api/conversas): comprador e vendedor falam pelo app.
 * Sem conexão contínua com o servidor: a tela aberta pergunta de tempos em tempos se há novidade.
 */

const INTERVALO_CONVERSA_MS = 4_000;
const INTERVALO_LISTA_MS = 30_000;

function mensagem(e: unknown, padrao: string): string {
  return e instanceof ErroConta ? e.message : padrao;
}

/** Abre (ou reabre) a conversa com o vendedor do anúncio. Devolve o id da conversa. */
export async function abrirConversaDoAnuncio(anuncioId: string): Promise<string> {
  const r = await chamarServidor<{ id: string }>(`/api/anuncios/${anuncioId}/conversa`, { metodo: 'POST' });
  return r.id;
}

/**
 * Repete `tarefa` a cada `intervaloMs` enquanto a tela está em foco e o app aberto (no navegador, com a aba
 * visível). Roda uma vez ao focar.
 */
function useRepetirEmFoco(tarefa: () => Promise<void>, intervaloMs: number) {
  const ref = useRef(tarefa);
  useEffect(() => {
    ref.current = tarefa;
  }, [tarefa]);
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      let timer: ReturnType<typeof setTimeout> | null = null;
      const visivel = () => AppState.currentState === 'active' && (typeof document === 'undefined' || document.visibilityState !== 'hidden');
      const rodar = async () => {
        if (!ativo) return;
        if (visivel()) await ref.current().catch(() => undefined);
        if (ativo) timer = setTimeout(() => void rodar(), intervaloMs);
      };
      void rodar();
      const assinatura = AppState.addEventListener('change', (s) => {
        if (s === 'active') void ref.current().catch(() => undefined);
      });
      return () => {
        ativo = false;
        if (timer) clearTimeout(timer);
        assinatura.remove();
      };
    }, [intervaloMs]),
  );
}

/** Lista "Conversas" da conta, atualizada a cada 30 s com a tela aberta. */
export function useConversas() {
  const conta = useConta();
  const pode = Boolean(conta && !conta.demo);
  const [estado, setEstado] = useState<{ conversas: ConversaResumo[] | null; naoLidas: number; erro: string | null }>({ conversas: null, naoLidas: 0, erro: null });
  const [atualizando, setAtualizando] = useState(false);

  const buscar = useCallback(async () => {
    if (!pode) return;
    try {
      const r = await chamarServidor<{ conversas: ConversaResumo[]; naoLidas: number }>('/api/conversas');
      setEstado({ conversas: r.conversas, naoLidas: r.naoLidas, erro: null });
    } catch (e) {
      setEstado((s) => ({ ...s, erro: mensagem(e, 'Não deu para buscar as conversas agora.') }));
    }
  }, [pode]);

  useRepetirEmFoco(buscar, INTERVALO_LISTA_MS);

  const atualizar = useCallback(async () => {
    setAtualizando(true);
    await buscar();
    setAtualizando(false);
  }, [buscar]);

  return { ...estado, carregando: pode && estado.conversas === null && estado.erro === null, atualizando, atualizar };
}

/** Conversa aberta: busca a cada 4 s só as mensagens novas e manda as da pessoa. */
export function useConversa(id: string | undefined) {
  const [conversa, setConversa] = useState<ConversaAberta | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const ultimaRef = useRef<number | null>(null);

  const juntar = useCallback((novas: MensagemConversa[], resto: Partial<ConversaAberta> = {}) => {
    setConversa((c) => {
      if (!c) return c;
      const vistas = new Set(c.mensagens.map((m) => m.id));
      const mensagens = [...c.mensagens, ...novas.filter((m) => !vistas.has(m.id))];
      ultimaRef.current = mensagens.length ? mensagens[mensagens.length - 1].id : ultimaRef.current;
      return { ...c, ...resto, mensagens };
    });
  }, []);

  const buscar = useCallback(async () => {
    if (!id) return;
    try {
      const depois = ultimaRef.current;
      const r = await chamarServidor<ConversaAberta>(`/api/conversas/${id}${depois === null ? '' : `?depois=${depois}`}`);
      setErro(null);
      if (depois === null) {
        ultimaRef.current = r.mensagens.length ? r.mensagens[r.mensagens.length - 1].id : 0;
        setConversa(r);
      } else {
        const { mensagens, ...resto } = r;
        juntar(mensagens, resto);
      }
    } catch (e) {
      setErro(mensagem(e, 'Não deu para abrir a conversa agora.'));
    }
  }, [id, juntar]);

  useRepetirEmFoco(buscar, INTERVALO_CONVERSA_MS);

  const enviar = useCallback(
    async (texto: string) => {
      if (!id) return;
      const r = await chamarServidor<{ mensagem: MensagemConversa }>(`/api/conversas/${id}`, { metodo: 'POST', corpo: { texto } });
      juntar([r.mensagem]);
    },
    [id, juntar],
  );

  return { conversa, erro, carregando: !conversa && !erro, enviar };
}
