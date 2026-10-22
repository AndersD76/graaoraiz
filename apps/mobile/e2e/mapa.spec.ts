import { expect, test } from '@playwright/test';

import { paginaDoMapa } from '../src/lib/pagina-mapa';

/**
 * Prova o mapa open-source de verdade (rede real): MapLibre do unpkg + estilo do OpenFreeMap.
 * O WebView do app recebe as mensagens por window.ReactNativeWebView; aqui ele é simulado.
 */
test('mapa open-source carrega e devolve a coordenada do toque', async ({ page }) => {
  const simulaWebView =
    '<script>window.mensagens=[];window.ReactNativeWebView={postMessage:function(m){window.mensagens.push(JSON.parse(m));}};</script>';
  const html = paginaDoMapa({ lat: -25.4321, lon: -49.2715 }).replace('<head>', `<head>${simulaWebView}`);
  await page.setContent(html, { waitUntil: 'load' });

  const mensagens = () => page.evaluate(() => (window as unknown as { mensagens: Record<string, unknown>[] }).mensagens);
  await expect.poll(async () => (await mensagens()).some((m) => m.carregado), { timeout: 30_000 }).toBe(true);
  expect((await mensagens()).some((m) => m.semMapa || m.erroMapa)).toBe(false);

  // Toque fora do centro: o pino vai para lá e o app recebe a nova coordenada.
  await page.mouse.click(120, 200);
  await expect.poll(async () => (await mensagens()).find((m) => typeof m.lat === 'number'), { timeout: 10_000 }).toBeTruthy();
  const ponto = (await mensagens()).find((m) => typeof m.lat === 'number') as { lat: number; lon: number };
  expect(Math.abs(ponto.lat - -25.4321)).toBeLessThan(0.05);
  expect(Math.abs(ponto.lon - -49.2715)).toBeLessThan(0.05);
  await page.waitForTimeout(1500); // termina de desenhar as ruas para a captura
  await page.screenshot({ path: 'e2e/capturas/11-mapa-open-source.png' });
});
