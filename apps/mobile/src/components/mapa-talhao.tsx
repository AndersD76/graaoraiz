import { StyleSheet, View } from 'react-native';
import MapView, { type MapPressEvent, Marker } from 'react-native-maps';

import { T } from '@/components/ui';
import type { Coordenada } from '@/lib/localizacao';

const CENTRO_BRASIL = { latitude: -15.8, longitude: -50.5, latitudeDelta: 25, longitudeDelta: 25 };

/** Mapa de satélite: toque para marcar o talhão; o pino pode ser arrastado. */
export function MapaTalhao({ coordenada, aoMudar }: { coordenada: Coordenada | null; aoMudar: (c: Coordenada) => void }) {
  const regiao = coordenada
    ? { latitude: coordenada.lat, longitude: coordenada.lon, latitudeDelta: 0.02, longitudeDelta: 0.02 }
    : CENTRO_BRASIL;
  const marcar = (e: MapPressEvent) => aoMudar({ lat: e.nativeEvent.coordinate.latitude, lon: e.nativeEvent.coordinate.longitude });

  return (
    <View style={estilos.caixa}>
      <MapView
        style={estilos.mapa}
        mapType="hybrid"
        region={regiao}
        onPress={marcar}
        showsUserLocation
        accessibilityLabel="Mapa para marcar o talhão">
        {coordenada ? (
          <Marker
            coordinate={{ latitude: coordenada.lat, longitude: coordenada.lon }}
            draggable
            onDragEnd={(e) => aoMudar({ lat: e.nativeEvent.coordinate.latitude, lon: e.nativeEvent.coordinate.longitude })}
          />
        ) : null}
      </MapView>
      <T variante="pequeno">Toque no mapa sobre a lavoura para marcar o talhão.</T>
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { gap: 6 },
  mapa: { height: 260, borderRadius: 16, overflow: 'hidden' },
});
