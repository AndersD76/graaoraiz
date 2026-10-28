import { type Ref, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { CreditosMapa } from '@/components/creditos-mapa';
import { type OpcoesMapa, paginaDoMapa, type PontoMapa, type Realce } from '@/lib/pagina-mapa';

export interface MensagemMapa {
  carregado?: boolean;
  semMapa?: boolean;
  erroMapa?: boolean;
  lat?: number;
  lon?: number;
  contorno?: [number, number][];
}

export interface ComandoMapa {
  mover?: PontoMapa;
  modo?: OpcoesMapa['modo'];
  contorno?: [number, number][] | null;
  camada?: string | null;
  realces?: Realce[] | null;
  desfazer?: boolean;
  limpar?: boolean;
  enquadrar?: boolean;
}

export interface ControleMapa {
  enviar: (comando: ComandoMapa) => void;
  recarregar: () => void;
}

export interface PropsMapaBase {
  inicial: PontoMapa | null;
  opcoes?: OpcoesMapa;
  altura?: number;
  aoMensagem: (m: MensagemMapa) => void;
  controle?: Ref<ControleMapa>;
  rotulo?: string;
  /** Crédito de uma camada extra (ex.: Sentinel-2), somado aos créditos do mapa embaixo dele. */
  creditoExtra?: string | null;
}

/** Mapa open-source num WebView. Comandos enviados antes de o mapa carregar ficam na fila. */
export function MapaBase({ inicial, opcoes, altura = 280, aoMensagem, controle, rotulo = 'Mapa do talhão', creditoExtra }: PropsMapaBase) {
  // `object` no genérico: a tipagem da biblioteca usa `P = undefined`, que zera as props no TypeScript 6.
  const web = useRef<WebView<object>>(null);
  // A página é montada uma vez; depois tudo muda por comando, sem recarregar.
  const [html] = useState(() => paginaDoMapa(inicial, opcoes));
  const carregado = useRef(false);
  const fila = useRef<ComandoMapa[]>([]);

  const executar = (c: ComandoMapa) => web.current?.injectJavaScript(`window.comando && window.comando(${JSON.stringify(c)}); true;`);

  useImperativeHandle(controle, () => ({
    enviar: (c) => {
      if (carregado.current) executar(c);
      else fila.current.push(c);
    },
    recarregar: () => {
      carregado.current = false;
      web.current?.reload();
    },
  }));

  const aoReceber = (e: WebViewMessageEvent) => {
    try {
      const m = JSON.parse(e.nativeEvent.data) as MensagemMapa;
      if (m.carregado) {
        carregado.current = true;
        fila.current.forEach(executar);
        fila.current = [];
      }
      aoMensagem(m);
    } catch {
      // Mensagem que não é do mapa: ignora.
    }
  };

  return (
    <View style={estilos.caixa}>
      <View style={[estilos.moldura, { height: altura }]}>
        <WebView<object>
          ref={web}
          source={{ html, baseUrl: 'https://graoraiz.app/' }}
          originWhitelist={['*']}
          onMessage={aoReceber}
          onError={() => aoMensagem({ semMapa: true })}
          nestedScrollEnabled
          // iPhone: sem rolagem nem "elástico" da página; os gestos ficam com o mapa.
          bounces={false}
          scrollEnabled={false}
          style={estilos.mapa}
          accessibilityLabel={rotulo}
        />
      </View>
      <CreditosMapa extra={creditoExtra} />
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { gap: 4 },
  moldura: { borderRadius: 20, overflow: 'hidden' },
  mapa: { flex: 1 },
});
