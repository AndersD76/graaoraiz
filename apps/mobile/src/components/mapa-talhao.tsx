import { areaHa, formatarNumero } from '@graoraiz/clima';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { CamposCoordenada } from '@/components/campos-coordenada';
import { type ControleMapa, MapaBase, type MensagemMapa } from '@/components/mapa-base';
import { Botao, Chip, Linha, T } from '@/components/ui';
import type { Coordenada } from '@/lib/localizacao';

/**
 * Mapa de satélite (MapLibre + Esri, nomes do OpenStreetMap) do cadastro do talhão: toque para marcar
 * o ponto ou desenhe o contorno tocando nos cantos da lavoura (a área sai sozinha).
 */
export function MapaTalhao({
  coordenada,
  aoMudar,
  contorno = null,
  aoMudarContorno,
}: {
  coordenada: Coordenada | null;
  aoMudar: (c: Coordenada) => void;
  contorno?: [number, number][] | null;
  aoMudarContorno?: (c: [number, number][] | null) => void;
}) {
  const mapa = useRef<ControleMapa>(null);
  const [modo, setModo] = useState<'ponto' | 'contorno'>('ponto');
  const [semMapa, setSemMapa] = useState(false);
  const [digitar, setDigitar] = useState(Platform.OS === 'web');
  const ultimaDoMapa = useRef<string | null>(null);

  // Coordenada vinda de fora (GPS ou campos digitados) move o pino.
  useEffect(() => {
    if (!coordenada || `${coordenada.lat},${coordenada.lon}` === ultimaDoMapa.current) return;
    mapa.current?.enviar({ mover: coordenada });
  }, [coordenada]);

  const aoMensagem = (m: MensagemMapa) => {
    if (m.semMapa || m.erroMapa) setSemMapa(true);
    if (m.carregado) setSemMapa(false);
    if (typeof m.lat === 'number' && typeof m.lon === 'number') {
      ultimaDoMapa.current = `${m.lat},${m.lon}`;
      aoMudar({ lat: m.lat, lon: m.lon });
    }
    if (m.contorno) aoMudarContorno?.(m.contorno.length >= 3 ? m.contorno : m.contorno.length ? m.contorno : null);
  };

  const trocarModo = (novo: 'ponto' | 'contorno') => {
    setModo(novo);
    mapa.current?.enviar({ modo: novo });
  };

  const area = contorno && contorno.length >= 3 ? areaHa(contorno) : null;

  return (
    <View style={estilos.caixa}>
      {aoMudarContorno ? (
        <Linha>
          <Chip rotulo="Marcar ponto" icone="pino" ativo={modo === 'ponto'} aoTocar={() => trocarModo('ponto')} testID="modo-ponto" />
          <Chip rotulo="Desenhar contorno" icone="regua" ativo={modo === 'contorno'} aoTocar={() => trocarModo('contorno')} testID="modo-contorno" />
        </Linha>
      ) : null}
      <MapaBase controle={mapa} inicial={coordenada} opcoes={{ contorno }} aoMensagem={aoMensagem} rotulo="Mapa para marcar o talhão" />
      {semMapa ? (
        <>
          <T variante="pequeno">Sem internet para carregar o mapa. Use “Estou no talhão”, digite as coordenadas ou tente de novo com sinal.</T>
          <Botao titulo="Tentar carregar o mapa de novo" tipo="secundario" icone="atualizar" aoTocar={() => mapa.current?.recarregar()} />
        </>
      ) : modo === 'contorno' ? (
        <T variante="pequeno">Toque nos cantos da lavoura, um de cada vez. A área é calculada sozinha.</T>
      ) : (
        <T variante="pequeno">
          {Platform.OS === 'web'
            ? 'Arraste para mover o mapa e use os botões + e − para aproximar. Depois, toque na lavoura.'
            : 'Mova o mapa com dois dedos e aproxime com pinça. Depois, toque na lavoura.'}
        </T>
      )}
      {modo === 'contorno' ? (
        <Linha>
          {area !== null ? (
            <T variante="forte" style={estilos.flex} testID="area-contorno">
              {formatarNumero(area, 1)} ha
            </T>
          ) : (
            <T variante="pequeno" style={estilos.flex}>
              {contorno?.length ?? 0} de 3 cantos no mínimo
            </T>
          )}
          <Botao titulo="Desfazer" tipo="secundario" compacto icone="esquerda" aoTocar={() => mapa.current?.enviar({ desfazer: true })} />
          <Botao titulo="Limpar" tipo="secundario" compacto icone="lixeira" aoTocar={() => mapa.current?.enviar({ limpar: true })} />
        </Linha>
      ) : null}
      {Platform.OS !== 'web' ? (
        <Botao titulo={digitar ? 'Esconder coordenadas' : 'Digitar coordenadas'} tipo="texto" aoTocar={() => setDigitar((d) => !d)} />
      ) : null}
      {digitar ? <CamposCoordenada coordenada={coordenada} aoMudar={aoMudar} /> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { gap: 8 },
  flex: { flex: 1 },
});
