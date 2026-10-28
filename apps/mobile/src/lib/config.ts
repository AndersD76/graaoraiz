/**
 * Configuração vinda de variáveis EXPO_PUBLIC_* (definidas em .env ou no EAS).
 * Nada aqui é segredo: tudo que começa com EXPO_PUBLIC_ vai dentro do app.
 */

/** Servidor próprio (apps/web) que repassa a previsão com cache. Sem ele, o app fala direto com o Open-Meteo. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || null;

/**
 * Servidor das contas (apps/web: /api/conta/*). Com ele o app pede login e guarda os dados na nuvem;
 * sem ele (testes automáticos, desenvolvimento) o app funciona só no aparelho, sem login.
 */
export const SERVIDOR_URL = process.env.EXPO_PUBLIC_SERVIDOR_URL?.replace(/\/$/, '') || API_URL;

/** Conta de demonstração (só leitura no servidor): a mesma lavoura de exemplo para qualquer um. */
export const DEMO_EMAIL = 'demo@graoraiz.com.br';
export const DEMO_SENHA = 'demo2026';

/** Site com política de privacidade, termos e página de download. */
export const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://graoraiz.com.br';

export const REVENUECAT_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || null;
export const REVENUECAT_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || null;

/** Entitlement configurado no RevenueCat que libera o Pro. */
export const ENTITLEMENT_PRO = 'pro';

export const PRECOS_REFERENCIA = { mensal: 'R$ 29,90', anual: 'R$ 249,90', anualPorMes: 'R$ 20,83' };

/**
 * Permite simular o Pro sem loja: em desenvolvimento e na build dos testes automáticos
 * (EXPO_PUBLIC_E2E=1, definida só por e2e/build.mjs). Nunca ligada nas builds das lojas.
 */
export const PERMITE_SIMULAR_PRO = __DEV__ || process.env.EXPO_PUBLIC_E2E === '1';

/**
 * Versão de demonstração: todos os módulos do Pro liberados, sem loja (EXPO_PUBLIC_LIBERAR_PRO=1).
 * Ligada só no perfil preview do eas.json (APK para mostrar a produtores). Nunca nas builds das lojas.
 */
export const LIBERA_PRO = process.env.EXPO_PUBLIC_LIBERAR_PRO === '1';
