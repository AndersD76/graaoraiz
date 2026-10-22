import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Campo, T } from '@/components/ui';
import type { Coordenada } from '@/lib/localizacao';

/** Na web não há mapa nativo: digita-se a coordenada (usado nos testes no navegador). */
export function MapaTalhao({ coordenada, aoMudar }: { coordenada: Coordenada | null; aoMudar: (c: Coordenada) => void }) {
  const [lat, setLat] = useState(coordenada ? String(coordenada.lat) : '');
  const [lon, setLon] = useState(coordenada ? String(coordenada.lon) : '');

  const aplicar = (novaLat: string, novaLon: string) => {
    const la = Number(novaLat.replace(',', '.'));
    const lo = Number(novaLon.replace(',', '.'));
    if (novaLat && novaLon && Number.isFinite(la) && Number.isFinite(lo) && Math.abs(la) <= 90 && Math.abs(lo) <= 180) {
      aoMudar({ lat: la, lon: lo });
    }
  };

  return (
    <View style={estilos.caixa}>
      <T variante="pequeno">O mapa de satélite aparece no app do celular. Aqui, informe a coordenada.</T>
      <Campo
        rotulo="Latitude"
        value={coordenada && !lat ? String(coordenada.lat) : lat}
        onChangeText={(v) => {
          setLat(v);
          aplicar(v, lon);
        }}
        keyboardType="numbers-and-punctuation"
        placeholder="-25.43"
        testID="campo-latitude"
      />
      <Campo
        rotulo="Longitude"
        value={coordenada && !lon ? String(coordenada.lon) : lon}
        onChangeText={(v) => {
          setLon(v);
          aplicar(lat, v);
        }}
        keyboardType="numbers-and-punctuation"
        placeholder="-49.27"
        testID="campo-longitude"
      />
    </View>
  );
}

const estilos = StyleSheet.create({ caixa: { gap: 8 } });
