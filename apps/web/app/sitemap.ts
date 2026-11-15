import { CATEGORIAS_MAQUINA } from '@graoraiz/clima';
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';
import { anunciosPublicos } from '@/lib/vitrine';

// Datas fixas das páginas de texto (mudam só quando o texto muda); anúncios usam a data real do banco.
const PAGINAS: { caminho: string; atualizacao: string; prioridade: number }[] = [
  { caminho: '/', atualizacao: '2026-11-05', prioridade: 1 },
  { caminho: '/baixar', atualizacao: '2026-10-22', prioridade: 0.5 },
  { caminho: '/avaliar', atualizacao: '2026-10-29', prioridade: 0.3 },
  { caminho: '/privacidade', atualizacao: '2026-11-03', prioridade: 0.2 },
  { caminho: '/termos', atualizacao: '2026-11-03', prioridade: 0.2 },
  { caminho: '/excluir-dados', atualizacao: '2026-11-03', prioridade: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const anuncios = await anunciosPublicos(null);
  const maisRecente = (lista: { atualizadoEm: string }[]) => lista.reduce((m, a) => (a.atualizadoEm > m ? a.atualizadoEm : m), '2026-11-03');
  const categorias = CATEGORIAS_MAQUINA.map((c) => ({ c: c.valor, lista: anuncios.filter((a) => a.categoria === c.valor) })).filter((x) => x.lista.length > 0);

  return [
    ...PAGINAS.map((p) => ({ url: `${SITE_URL}${p.caminho === '/' ? '' : p.caminho}`, lastModified: p.atualizacao, priority: p.prioridade })),
    { url: `${SITE_URL}/maquinas-usadas`, lastModified: maisRecente(anuncios), priority: 0.9 },
    ...categorias.map((x) => ({ url: `${SITE_URL}/maquinas-usadas/categoria/${x.c}`, lastModified: maisRecente(x.lista), priority: 0.7 })),
    ...anuncios.map((a) => ({ url: `${SITE_URL}/maquinas-usadas/${a.id}`, lastModified: a.atualizadoEm, priority: 0.6 })),
  ];
}
