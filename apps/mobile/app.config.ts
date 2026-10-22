import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Completa o app.json com o que pode vir de variável de ambiente.
 * EAS_PROJECT_ID substitui o projectId fixado no app.json (útil para builds de teste em outra conta).
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const projectId = process.env.EAS_PROJECT_ID;
  return {
    ...config,
    name: config.name ?? 'Grão Raiz',
    slug: config.slug ?? 'grao-raiz',
    extra: {
      ...config.extra,
      ...(projectId ? { eas: { projectId } } : {}),
    },
  };
};
