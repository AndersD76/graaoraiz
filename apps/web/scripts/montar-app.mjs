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
  `<link rel="canonical" href="${origem}/" />`,
].join('\n    ');

// Dados estruturados da página inicial (o conteúdo visível é o próprio app). Sem nota nem número de
// usuários: não há avaliação pública verificável ainda. Organização sem CNPJ: o negócio ainda é pessoa física.
const dados = [
  { '@context': 'https://schema.org', '@type': 'Organization', name: 'Grão Raiz', url: `${origem}/`, logo: `${origem}/icon.svg` },
  { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Grão Raiz', url: `${origem}/`, inLanguage: 'pt-BR' },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Grão Raiz',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, Android, iOS',
    description: descricao,
    url: `${origem}/`,
    inLanguage: 'pt-BR',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL', description: 'Grátis, com todos os recursos liberados' },
  },
];
const ld = `<script type="application/ld+json">${JSON.stringify(dados).replace(/</g, '\\u003c')}</script>`;

// Conteúdo de reserva para quem chega sem JavaScript (robôs e leitores simples): o mesmo que o app mostra.
const semJs = `<noscript>
      <main style="font-family:sans-serif;max-width:720px;margin:40px auto;padding:0 16px;line-height:1.5">
        <h1>Grão Raiz: o vigia da sua lavoura</h1>
        <p>App para o produtor de grãos: hora certa de pulverizar, avisos de geada, temporal e doença por talhão, caderno de campo com prova para o seguro e o Proagro, checagem de desmatamento (PRODES e CAR) para a lei europeia e o crédito rural, preço do dia e classificados de máquinas usadas.</p>
        <p>Para usar o app, ative o JavaScript no navegador.</p>
        <ul>
          <li><a href="/maquinas-usadas">Máquinas agrícolas usadas à venda</a></li>
          <li><a href="/baixar">Baixar o app</a></li>
          <li><a href="/termos">Termos de uso</a></li>
          <li><a href="/privacidade">Política de privacidade</a></li>
        </ul>
      </main>
    </noscript>`;

const indice = resolve(web, 'public/index.html');
const html = readFileSync(indice, 'utf8')
  .replace('<html lang="en">', '<html lang="pt-BR">')
  .replace('<title>Grão Raiz</title>', `<title>${titulo}</title>\n    ${meta}\n    ${ld}`)
  .replace(/<noscript>[\s\S]*?<\/noscript>/, semJs);
// Sem a prévia o app funciona igual: só avisa, para não travar a publicação.
if (!html.includes('og:image')) console.warn('Aviso: o index.html do app mudou e ficou sem a prévia do link.');
writeFileSync(indice, html);
