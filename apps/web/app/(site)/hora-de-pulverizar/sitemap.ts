import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';
import { caminhoMunicipio, municipiosPublicados, ufsPublicadas } from '@/lib/seo/municipios';
import { dataDeHoje } from '@/lib/seo/paginas';

/**
 * Sitemap das páginas "hora de pulverizar" (servido em /hora-de-pulverizar/sitemap.xml). Só entram as publicadas.
 * lastmod = hoje: a previsão de cada página muda todo dia de verdade.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [ufs, municipios, hoje] = await Promise.all([ufsPublicadas(), municipiosPublicados(null), dataDeHoje()]);
  return [
    { url: `${SITE_URL}/hora-de-pulverizar`, lastModified: hoje, priority: 0.9, changeFrequency: 'daily' },
    ...ufs.map((u) => ({ url: `${SITE_URL}/hora-de-pulverizar/${u.uf.toLowerCase()}`, lastModified: hoje, priority: 0.7, changeFrequency: 'daily' as const })),
    ...municipios.map((m) => ({ url: `${SITE_URL}${caminhoMunicipio(m)}`, lastModified: hoje, priority: 0.6, changeFrequency: 'daily' as const })),
  ];
}
