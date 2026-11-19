import { connection } from 'next/server';
import { SITE_URL } from '@/lib/config';

/** Índice dos sitemaps por tipo de página (é este que vai para o Search Console e o Bing). */
export async function GET() {
  await connection();
  const hoje = new Date().toISOString().slice(0, 10);
  const mapas = ['/sitemap.xml', '/hora-de-pulverizar/sitemap.xml', '/glossario/sitemap.xml'];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${mapas.map((m) => `  <sitemap><loc>${SITE_URL}${m}</loc><lastmod>${hoje}</lastmod></sitemap>`).join('\n')}
</sitemapindex>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
