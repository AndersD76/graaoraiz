import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';
import { CRAWLERS_BUSCA, CRAWLERS_TREINO } from '@/lib/seo';

/** Fora do índice: API, painéis internos e telas do app que dependem de conta. */
const BLOQUEADO = ['/api/', '/admin', '/entrar', '/ajustes', '/anunciar', '/meus-anuncios', '/onboarding', '/descadastrar'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Buscadores e IAs de busca/citação, liberados de forma explícita.
      { userAgent: CRAWLERS_BUSCA, allow: '/', disallow: BLOQUEADO },
      // Coleta para treino de modelos: liberada hoje; mudar para disallow '/' é decisão do dono do site.
      { userAgent: CRAWLERS_TREINO, allow: '/', disallow: BLOQUEADO },
      { userAgent: '*', allow: '/', disallow: BLOQUEADO },
    ],
    sitemap: [`${SITE_URL}/sitemap-index.xml`, `${SITE_URL}/sitemap.xml`, `${SITE_URL}/hora-de-pulverizar/sitemap.xml`, `${SITE_URL}/glossario/sitemap.xml`],
    host: SITE_URL,
  };
}
