import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CreditosMapa } from '@/components/creditos-mapa';
import type { ComandoMapa, PropsMapaBase } from '@/components/mapa-base';
import { paginaDoMapa } from '@/lib/pagina-mapa';

export type { ComandoMapa, ControleMapa, MensagemMapa, PropsMapaBase } from '@/components/mapa-base';

/**
 * Versão web (testes no navegador): o mesmo mapa num iframe. A página fala por
 * window.ReactNativeWebView; aqui essa ponte vira postMessage para a janela pai.
 */
const PONTE = '<script>window.ReactNativeWebView={postMessage:function(m){parent.postMessage({graoraizMapa:m},"*");}};</script>';

interface JanelaDoMapa {
  comando?: (c: ComandoMapa) => void;
}

/**
 * A página vai num endereço blob (e não em srcdoc): dentro de um iframe "about:srcdoc" o MapLibre
 * baixa o estilo mas nunca termina de carregar, e o mapa fica em branco.
 */
function enderecoDaPagina(html: string): string {
  return URL.createObjectURL(new Blob([html], { type: 'text/html' }));
}

export function MapaBase({ inicial, opcoes, altura = 280, aoMensagem, controle, rotulo = 'Mapa do talhão', creditoExtra }: PropsMapaBase) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const [html] = useState(() => paginaDoMapa(inicial, opcoes).replace('<head>', `<head>${PONTE}`));
  const [endereco, setEndereco] = useState(() => enderecoDaPagina(html));
  const carregado = useRef(false);
  const fila = useRef<ComandoMapa[]>([]);
  const aoMensagemAtual = useRef(aoMensagem);

  useEffect(() => {
    aoMensagemAtual.current = aoMensagem;
  }, [aoMensagem]);

  useEffect(() => () => URL.revokeObjectURL(endereco), [endereco]);

  const executar = (c: ComandoMapa) => (iframe.current?.contentWindow as unknown as JanelaDoMapa | null)?.comando?.(c);

  useImperativeHandle(controle, () => ({
    enviar: (c) => {
      if (carregado.current) executar(c);
      else fila.current.push(c);
    },
    recarregar: () => {
      carregado.current = false;
      setEndereco(enderecoDaPagina(html));
    },
  }));

  useEffect(() => {
    const ouvir = (e: MessageEvent) => {
      if (e.source !== iframe.current?.contentWindow) return;
      const bruto = (e.data as { graoraizMapa?: unknown } | null)?.graoraizMapa;
      if (typeof bruto !== 'string') return;
      const m = JSON.parse(bruto) as Parameters<PropsMapaBase['aoMensagem']>[0];
      if (m.carregado) {
        carregado.current = true;
        fila.current.forEach(executar);
        fila.current = [];
      }
      aoMensagemAtual.current(m);
    };
    window.addEventListener('message', ouvir);
    return () => window.removeEventListener('message', ouvir);
  }, []);

  return (
    <View style={estilos.caixa}>
      <View style={[estilos.moldura, { height: altura }]}>
        <iframe ref={iframe} src={endereco} title={rotulo} style={{ border: 0, width: '100%', height: '100%' }} />
      </View>
      <CreditosMapa extra={creditoExtra} />
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { gap: 4 },
  moldura: { borderRadius: 20, overflow: 'hidden' },
});
