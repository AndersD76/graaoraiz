// Exporta a versão web do app (apps/mobile) para public/, que o Next serve na raiz do site.
// Roda antes do next build (npm run build). O app fala com este mesmo servidor (contas, preços, EUDR).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origem = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

// public/ é todo gerado aqui: o expo export apaga a pasta antes de exportar.
const resultado = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', resolve(web, 'public'), '--clear'], {
  cwd: resolve(web, '../mobile'),
  stdio: 'inherit',
  shell: true,
  // Versão de demonstração para produtores: módulos do Pro liberados, como no APK de teste.
  env: {
    ...process.env,
    EXPO_PUBLIC_SERVIDOR_URL: origem,
    EXPO_PUBLIC_SITE_URL: origem,
    EXPO_PUBLIC_LIBERAR_PRO: process.env.EXPO_PUBLIC_LIBERAR_PRO ?? '1',
    CI: '1',
  },
});
if (resultado.status !== 0) process.exit(resultado.status ?? 1);

// Prévia do link no WhatsApp e nas redes: o index.html do Expo só traz o título.
const titulo = 'Grão Raiz — o vigia da sua lavoura';
const descricao = 'Hora de pulverizar, geada e temporal, satélite, chuva, preço do dia e EUDR, por talhão. Grátis, abre no navegador do celular.';
const meta = [
  `<meta name="description" content="${descricao}" />`,
  '<meta name="theme-color" content="#1F6B2E" />',
  '<meta property="og:type" content="website" />',
  '<meta property="og:locale" content="pt_BR" />',
  '<meta property="og:site_name" content="Grão Raiz" />',
  `<meta property="og:url" content="${origem}/" />`,
  `<meta property="og:title" content="${titulo}" />`,
  `<meta property="og:description" content="${descricao}" />`,
  `<meta property="og:image" content="${origem}/opengraph-image" />`,
  '<meta property="og:image:width" content="1200" />',
  '<meta property="og:image:height" content="630" />',
  '<meta name="twitter:card" content="summary_large_image" />',
].join('\n    ');
const indice = resolve(web, 'public/index.html');
const html = readFileSync(indice, 'utf8')
  .replace('<html lang="en">', '<html lang="pt-BR">')
  .replace('<title>Grão Raiz</title>', `<title>${titulo}</title>\n    ${meta}`);
// Sem a prévia o app funciona igual: só avisa, para não travar a publicação.
if (!html.includes('og:image')) console.warn('Aviso: o index.html do app mudou e ficou sem a prévia do link.');
writeFileSync(indice, html);
