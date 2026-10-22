import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CamposCoordenada } from '@/components/campos-coordenada';
import { T } from '@/components/ui';
import type { Coordenada } from '@/lib/localizacao';
import { paginaDoMapa } from '@/lib/pagina-mapa';

/**
 * Versão web (testes no navegador): o mesmo mapa open-source do celular, num iframe.
 * A página do mapa fala por window.ReactNativeWebView; aqui essa ponte vira postMessage para a janela pai.
 */
const PONTE = '<script>window.ReactNativeWebView={postMessage:function(m){parent.postMessage({graoraizMapa:m},"*");}};</script>';

interface JanelaDoMapa {
  moverPara?: (lat: number, lon: number) => void;
}

export function MapaTalhao({ coordenada, aoMudar }: { coordenada: Coordenada | null; aoMudar: (c: Coordenada) => void }) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const [html] = useState(() => paginaDoMapa(coordenada).replace('<head>', `<head>${PONTE}`));
  const aoMudarAtual = useRef(aoMudar);
  const ultimaDoMapa = useRef<string | null>(null);
  const pendente = useRef<Coordenada | null>(null);
  const carregado = useRef(false);

  useEffect(() => {
    aoMudarAtual.current = aoMudar;
  }, [aoMudar]);

  // Mensagens do mapa: carregou (aplica o pino pendente) ou o usuário tocou (atualiza o talhão).
  useEffect(() => {
    const ouvir = (e: MessageEvent) => {
      if (e.source !== iframe.current?.contentWindow) return;
      const bruto = (e.data as { graoraizMapa?: unknown } | null)?.graoraizMapa;
      if (typeof bruto !== 'string') return;
      const dados = JSON.parse(bruto) as { lat?: number; lon?: number; carregado?: boolean };
      const janela = iframe.current?.contentWindow as unknown as JanelaDoMapa | null;
      if (dados.carregado) {
        carregado.current = true;
        if (pendente.current) janela?.moverPara?.(pendente.current.lat, pendente.current.lon);
        pendente.current = null;
      }
      if (typeof dados.lat !== 'number' || typeof dados.lon !== 'number') return;
      ultimaDoMapa.current = `${dados.lat},${dados.lon}`;
      aoMudarAtual.current({ lat: dados.lat, lon: dados.lon });
    };
    window.addEventListener('message', ouvir);
    return () => window.removeEventListener('message', ouvir);
  }, []);

  // Coordenada vinda de fora (GPS ou campos) → move o pino no mapa.
  useEffect(() => {
    if (!coordenada || `${coordenada.lat},${coordenada.lon}` === ultimaDoMapa.current) return;
    const janela = iframe.current?.contentWindow as unknown as JanelaDoMapa | null;
    if (carregado.current) janela?.moverPara?.(coordenada.lat, coordenada.lon);
    else pendente.current = coordenada;
  }, [coordenada]);

  return (
    <View style={estilos.caixa}>
      <View style={estilos.moldura}>
        <iframe ref={iframe} srcDoc={html} title="Mapa para marcar o talhão" style={{ border: 0, width: '100%', height: '100%' }} />
      </View>
      <T variante="pequeno">Toque no mapa sobre a lavoura para marcar o talhão. Mapa: OpenFreeMap / OpenStreetMap.</T>
      <T variante="pequeno">Ou informe a coordenada:</T>
      <CamposCoordenada coordenada={coordenada} aoMudar={aoMudar} />
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { gap: 8 },
  moldura: { height: 280, borderRadius: 16, overflow: 'hidden' },
});
