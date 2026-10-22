import * as Location from 'expo-location';

export interface Coordenada {
  lat: number;
  lon: number;
}

const ESPERA_GPS_MS = 15_000;

/**
 * Localização atual com o app aberto (nunca em segundo plano). Null se o usuário negar
 * ou se não houver posição. Se o GPS demorar (dentro de casa, por exemplo), usa a última
 * posição conhecida dos últimos 10 minutos em vez de deixar o botão girando.
 */
export async function localizacaoAtual(): Promise<Coordenada | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const atual = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).catch(() => null);
  const espera = new Promise<null>((resolver) => setTimeout(() => resolver(null), ESPERA_GPS_MS));
  const posicao =
    (await Promise.race([atual, espera])) ??
    (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 }).catch(() => null));

  return posicao ? { lat: posicao.coords.latitude, lon: posicao.coords.longitude } : null;
}
