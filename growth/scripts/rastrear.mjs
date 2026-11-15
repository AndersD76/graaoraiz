// Rastreador simples que se passa pelo Googlebot: lê o sitemap e as rotas do app e confere o básico de SEO.
// Uso: node growth/scripts/rastrear.mjs <url-base> [saida.md]
import { writeFileSync } from 'node:fs';

const base = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '');
const saida = process.argv[3];
const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const ROTAS_APP = ['/', '/lavoura', '/maquinas', '/entrar', '/anunciar', '/painel/funil', '/rota-que-nao-existe'];

const texto = (html, re) => html.match(re)?.[1]?.trim() ?? '';
const contar = (html, re) => (html.match(re) ?? []).length;

async function examinar(url) {
  const t0 = Date.now();
  const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'manual' });
  const ms = Date.now() - t0;
  const html = r.headers.get('content-type')?.includes('html') ? await r.text() : '';
  const corpo = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript>|<\/noscript>/g, ' ').replace(/<[^>]+>/g, ' ');
  const jsonld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => {
    try {
      const d = JSON.parse(m[1]);
      return (Array.isArray(d) ? d : [d]).map((x) => x['@type']);
    } catch {
      return ['INVÁLIDO'];
    }
  });
  const titulo = texto(html, /<title>([^<]*)<\/title>/);
  const descricao = texto(html, /<meta name="description" content="([^"]*)"/);
  return {
    url: url.replace(base, '') || '/',
    status: r.status,
    destino: r.headers.get('location') ?? '',
    robots: [r.headers.get('x-robots-tag'), texto(html, /<meta name="robots" content="([^"]*)"/)].filter(Boolean).join(' / '),
    canonical: texto(html, /<link rel="canonical" href="([^"]*)"/).replace(base, ''),
    titulo,
    tituloTam: titulo.length,
    descTam: descricao.length,
    h1: contar(html, /<h1[\s>]/g),
    palavras: corpo.split(/\s+/).filter((p) => /[a-zà-ú]{2,}/i.test(p)).length,
    links: contar(html, /<a [^>]*href="\/(?!\/)/g),
    jsonld: jsonld.join(', '),
    ms,
  };
}

const sitemap = await (await fetch(`${base}/sitemap.xml`, { headers: { 'User-Agent': UA } })).text();
const urls = [...new Set([...[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, base)), ...ROTAS_APP.map((r) => base + r)].map((u) => new URL(u).href))];
const linhas = [];
for (const u of urls) linhas.push(await examinar(u));

const robots = await (await fetch(`${base}/robots.txt`)).text();
const llms = await fetch(`${base}/llms.txt`);
const md = [
  `# Rastreio como Googlebot: ${base}`,
  '',
  `${linhas.length} URLs (sitemap + rotas do app). robots.txt: ${robots.split('\n').length} linhas. /llms.txt: HTTP ${llms.status}.`,
  '',
  '| URL | HTTP | robots | canonical | título (car.) | descrição (car.) | H1 | palavras | links internos | JSON-LD | ms |',
  '|---|---|---|---|---|---|---|---|---|---|---|',
  ...linhas.map((l) => `| ${l.url} | ${l.status}${l.destino ? ` → ${l.destino}` : ''} | ${l.robots || 'index'} | ${l.canonical || '—'} | ${l.tituloTam} | ${l.descTam} | ${l.h1} | ${l.palavras} | ${l.links} | ${l.jsonld || '—'} | ${l.ms} |`),
  '',
  '## Problemas',
  ...linhas.flatMap((l) => {
    const p = [];
    const indexavel = l.status === 200 && !/noindex/.test(l.robots);
    if (indexavel && !l.canonical) p.push('sem canonical');
    if (indexavel && (l.tituloTam === 0 || l.tituloTam > 65)) p.push(`título com ${l.tituloTam} caracteres`);
    if (indexavel && (l.descTam === 0 || l.descTam > 160)) p.push(`descrição com ${l.descTam} caracteres`);
    if (indexavel && l.h1 !== 1 && l.url !== '/') p.push(`${l.h1} H1`);
    if (l.jsonld.includes('INVÁLIDO')) p.push('JSON-LD inválido');
    return p.length ? [`- ${l.url}: ${p.join('; ')}`] : [];
  }),
];
const titulosRepetidos = Object.entries(linhas.filter((l) => l.status === 200 && !/noindex/.test(l.robots)).reduce((m, l) => ({ ...m, [l.titulo]: [...(m[l.titulo] ?? []), l.url] }), {})).filter(([, us]) => us.length > 1);
if (titulosRepetidos.length) md.push(...titulosRepetidos.map(([t, us]) => `- título repetido em páginas indexáveis ("${t}"): ${us.join(', ')}`));
if (md.at(-1) === '## Problemas') md.push('- nenhum problema crítico encontrado');

const relatorio = `${md.join('\n')}\n`;
if (saida) writeFileSync(saida, relatorio);
console.log(relatorio);
