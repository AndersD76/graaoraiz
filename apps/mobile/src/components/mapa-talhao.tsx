import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { CamposCoordenada } from '@/components/campos-coordenada';
import { Botao, T } from '@/components/ui';
import type { Coordenada } from '@/lib/localizacao';
import { paginaDoMapa } from '@/lib/pagina-mapa';

function comandoMover(c: Coordenada): string {
  return `window.moverPara && window.moverPara(${c.lat}, ${c.lon}); true;`;
}

/** Mapa open-source (MapLibre + OpenFreeMap/OpenStreetMap): toque para marcar o talhão; o pino pode ser arrastado. */
export function MapaTalhao({ coordenada, aoMudar }: { coordenada: Coordenada | null; aoMudar: (c: Coordenada) => void }) {
  // `object` no genérico: a tipagem da biblioteca usa `P = undefined`, que zera as props no TypeScript 6.
  const web = useRef<WebView<object>>(null);
  // A página é montada uma vez; depois o mapa é movido por JavaScript, sem recarregar.
  const [html] = useState(() => paginaDoMapa(coordenada));
  const [semMapa, setSemMapa] = useState(false);
  const [digitar, setDigitar] = useState(false);
  const carregado = useRef(false);
  const pendente = useRef<Coordenada | null>(null);
  const ultimaDoMapa = useRef<string | null>(null);

  // Coordenada vinda de fora (GPS ou campos): move o pino; se o mapa ainda não carregou, guarda para depois.
  useEffect(() => {
    if (!coordenada || `${coordenada.lat},${coordenada.lon}` === ultimaDoMapa.current) return;
    if (carregado.current) web.current?.injectJavaScript(comandoMover(coordenada));
    else pendente.current = coordenada;
  }, [coordenada]);

  const aoReceber = (e: WebViewMessageEvent) => {
    try {
      const dados = JSON.parse(e.nativeEvent.data) as { lat?: number; lon?: number; semMapa?: boolean; carregado?: boolean };
      if (dados.semMapa) setSemMapa(true);
      if (dados.carregado) {
        carregado.current = true;
        setSemMapa(false);
        if (pendente.current) web.current?.injectJavaScript(comandoMover(pendente.current));
        pendente.current = null;
      }
      if (typeof dados.lat === 'number' && typeof dados.lon === 'number') {
        ultimaDoMapa.current = `${dados.lat},${dados.lon}`;
        aoMudar({ lat: dados.lat, lon: dados.lon });
      }
    } catch {
      // Mensagem que não é do mapa: ignora.
    }
  };

  const tentarDeNovo = () => {
    carregado.current = false;
    pendente.current = coordenada;
    setSemMapa(false);
    web.current?.reload();
  };

  return (
    <View style={estilos.caixa}>
      <View style={estilos.moldura}>
        <WebView<object>
          ref={web}
          source={{ html, baseUrl: 'https://graoraiz.app/' }}
          originWhitelist={['*']}
          onMessage={aoReceber}
          onError={() => setSemMapa(true)}
          nestedScrollEnabled
          // iPhone: sem rolagem nem "elástico" da página; os gestos ficam com o mapa.
          bounces={false}
          scrollEnabled={false}
          style={estilos.mapa}
          accessibilityLabel="Mapa para marcar o talhão"
        />
      </View>
      {semMapa ? (
        <>
          <T variante="pequeno">Sem internet para carregar o mapa. Use “Estou no talhão”, digite as coordenadas ou tente de novo com sinal.</T>
          <Botao titulo="Tentar carregar o mapa de novo" tipo="secundario" aoTocar={tentarDeNovo} />
        </>
      ) : (
        <T variante="pequeno">Toque no mapa sobre a lavoura para marcar o talhão. Mapa: OpenFreeMap / OpenStreetMap.</T>
      )}
      <Botao titulo={digitar ? 'Esconder coordenadas' : 'Digitar coordenadas'} tipo="texto" aoTocar={() => setDigitar((d) => !d)} />
      {digitar ? <CamposCoordenada coordenada={coordenada} aoMudar={aoMudar} /> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { gap: 6 },
  moldura: { height: 280, borderRadius: 16, overflow: 'hidden' },
  mapa: { flex: 1 },
});
