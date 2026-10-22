import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Completa o app.json com o que depende de variáveis de ambiente (EAS ou .env):
 * - GOOGLE_MAPS_ANDROID_KEY: chave do Maps SDK for Android (obrigatória nas builds de loja para o mapa aparecer).
 * - EAS_PROJECT_ID: id do projeto no Expo (gerado por `eas init`).
 * No iPhone o mapa usa o Apple Maps, sem chave.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const mapsKey = process.env.GOOGLE_MAPS_ANDROID_KEY;
  const projectId = process.env.EAS_PROJECT_ID;

  return {
    ...config,
    name: config.name ?? 'Grão Raiz',
    slug: config.slug ?? 'grao-raiz',
    plugins: [...(config.plugins ?? []), ...(mapsKey ? [['react-native-maps', { androidGoogleMapsApiKey: mapsKey }] as [string, unknown]] : [])],
    extra: {
      ...config.extra,
      ...(projectId ? { eas: { projectId } } : {}),
    },
  };
};
