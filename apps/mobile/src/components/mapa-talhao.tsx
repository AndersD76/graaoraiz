import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { T } from '@/components/ui';
import type { Coordenada } from '@/lib/localizacao';
import { paginaDoMapa } from '@/lib/pagina-mapa';

/** Mapa open-source (MapLibre + OpenFreeMap/OpenStreetMap): toque para marcar o talhão; o pino pode ser arrastado. */
export function MapaTalhao({ coordenada, aoMudar }: { coordenada: Coordenada | null; aoMudar: (c: Coordenada) => void }) {
  // `object` no genérico: a tipagem da biblioteca usa `P = undefined`, que zera as props no TypeScript 6.
  const web = useRef<WebView<object>>(null);
  // A página é montada uma vez; depois o mapa é movido por JavaScript, sem recarregar.
  const [html] = useState(() => paginaDoMapa(coordenada));
  const [semMapa, setSemMapa] = useState(false);
  const ultimaDoMapa = useRef<string | null>(null);

  useEffect(() => {
    if (!coordenada) return;
    const chave = `${coordenada.lat},${coordenada.lon}`;
    if (chave === ultimaDoMapa.current) return; // veio do próprio mapa
    web.current?.injectJavaScript(`window.moverPara && window.moverPara(${coordenada.lat}, ${coordenada.lon}); true;`);
  }, [coordenada]);

  const aoReceber = (e: WebViewMessageEvent) => {
    try {
      const dados = JSON.parse(e.nativeEvent.data) as { lat?: number; lon?: number; semMapa?: boolean };
      if (dados.semMapa) setSemMapa(true);
      if (typeof dados.lat === 'number' && typeof dados.lon === 'number') {
        ultimaDoMapa.current = `${dados.lat},${dados.lon}`;
        aoMudar({ lat: dados.lat, lon: dados.lon });
      }
    } catch {
      // Mensagem que não é do mapa: ignora.
    }
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
          style={estilos.mapa}
          accessibilityLabel="Mapa para marcar o talhão"
        />
      </View>
      <T variante="pequeno">
        {semMapa
          ? 'Sem internet para carregar o mapa. Use "Estou no talhão" ou tente de novo com sinal.'
          : 'Toque no mapa sobre a lavoura para marcar o talhão. Mapa: OpenFreeMap / OpenStreetMap.'}
      </T>
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { gap: 6 },
  moldura: { height: 280, borderRadius: 16, overflow: 'hidden' },
  mapa: { flex: 1 },
});
