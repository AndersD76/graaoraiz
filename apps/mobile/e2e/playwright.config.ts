import { defineConfig } from '@playwright/test';

/**
 * Testes ponta a ponta na versão web do app (mesmo código das telas; mapa, notificações e
 * compartilhamento têm versões web simplificadas). Antes: `npm run e2e:build`.
 */
export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8085',
    viewport: { width: 412, height: 824 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    geolocation: { latitude: -25.4321, longitude: -49.2715 },
    permissions: ['geolocation'],
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node e2e/servidor.mjs dist-web 8085',
    url: 'http://localhost:8085',
    cwd: '..',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
