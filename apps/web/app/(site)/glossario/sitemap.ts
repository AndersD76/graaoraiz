import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';
import { termosPublicados } from '@/lib/seo/paginas';

/** Sitemap do glossário (servido em /glossario/sitemap.xml), com a data real de revisão de cada termo. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const termos = await termosPublicados();
  if (termos.length === 0) return [];
  const maisRecente = termos.reduce((m, t) => (t.revisadoEm > m ? t.revisadoEm : m), '2026-11-18');
  return [
    { url: `${SITE_URL}/glossario`, lastModified: maisRecente, priority: 0.7 },
    ...termos.map((t) => ({ url: `${SITE_URL}/glossario/${t.slug}`, lastModified: t.revisadoEm, priority: 0.5 })),
  ];
}
