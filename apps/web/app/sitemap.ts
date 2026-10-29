import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';

// Datas fixas: o conteúdo é estático e Cache Components não permite ler o relógio no pré-render.
const PAGINAS: { caminho: string; atualizacao: string; prioridade: number }[] = [
  { caminho: '/', atualizacao: '2026-10-22', prioridade: 1 },
  { caminho: '/baixar', atualizacao: '2026-10-22', prioridade: 0.6 },
  { caminho: '/avaliar', atualizacao: '2026-10-29', prioridade: 0.5 },
  { caminho: '/privacidade', atualizacao: '2026-10-22', prioridade: 0.3 },
  { caminho: '/termos', atualizacao: '2026-10-22', prioridade: 0.3 },
  { caminho: '/excluir-dados', atualizacao: '2026-10-22', prioridade: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGINAS.map((p) => ({
    url: `${SITE_URL}${p.caminho === '/' ? '' : p.caminho}`,
    lastModified: p.atualizacao,
    changeFrequency: 'monthly',
    priority: p.prioridade,
  }));
}
