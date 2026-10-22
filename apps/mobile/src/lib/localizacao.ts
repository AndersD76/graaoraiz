import * as Location from 'expo-location';

export interface Coordenada {
  lat: number;
  lon: number;
}

/** Localização atual com o app aberto (nunca em segundo plano). Null se o usuário negar. */
export async function localizacaoAtual(): Promise<Coordenada | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  const posicao = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { lat: posicao.coords.latitude, lon: posicao.coords.longitude };
}
