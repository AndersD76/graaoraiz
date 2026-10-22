/**
 * Configuração vinda de variáveis EXPO_PUBLIC_* (definidas em .env ou no EAS).
 * Nada aqui é segredo: tudo que começa com EXPO_PUBLIC_ vai dentro do app.
 */

/** Servidor próprio (apps/web) que repassa a previsão com cache. Sem ele, o app fala direto com o Open-Meteo. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || null;

/** Site com política de privacidade, termos e página de download. */
export const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://graoraiz.com.br';

export const REVENUECAT_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || null;
export const REVENUECAT_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || null;

/** Entitlement configurado no RevenueCat que libera o Pro. */
export const ENTITLEMENT_PRO = 'pro';

export const PRECOS_REFERENCIA = { mensal: 'R$ 19,90', anual: 'R$ 149,90' };

/**
 * Permite simular o Pro sem loja: em desenvolvimento e na build dos testes automáticos
 * (EXPO_PUBLIC_E2E=1, definida só por e2e/build.mjs). Nunca ligada nas builds das lojas.
 */
export const PERMITE_SIMULAR_PRO = __DEV__ || process.env.EXPO_PUBLIC_E2E === '1';
