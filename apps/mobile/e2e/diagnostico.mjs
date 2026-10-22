// Abre a versão web e lista requisições de JS e erros do console (diagnóstico do bundle).
import { chromium } from '@playwright/test';

const navegador = await chromium.launch();
const pagina = await navegador.newPage();
pagina.on('console', (m) => m.type() === 'error' && console.log('[console]', m.text().slice(0, 300)));
pagina.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 300)));
pagina.on('response', async (r) => {
  const url = r.url();
  if (url.includes('.js') || url.includes('_expo')) {
    const tipo = r.headers()['content-type'] ?? '';
    console.log(r.status(), tipo.split(';')[0], url.replace('http://localhost:8085', '').slice(0, 160));
  }
});
await pagina.goto(process.argv[2] ?? 'http://localhost:8085/', { waitUntil: 'networkidle' });
await pagina.waitForTimeout(3000);
console.log('crossOriginIsolated:', await pagina.evaluate(() => self.crossOriginIsolated));
console.log('--- texto da página ---');
console.log((await pagina.locator('body').innerText()).slice(0, 500));
await navegador.close();
