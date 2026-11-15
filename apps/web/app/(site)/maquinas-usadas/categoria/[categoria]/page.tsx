import { CATEGORIAS_MAQUINA } from '@graoraiz/clima';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PaginaVitrine } from '@/components/vitrine-maquinas';
import { metadadosPagina } from '@/lib/metadados';
import { anunciosPublicos, categoriaValida, PLURAL_CATEGORIA } from '@/lib/vitrine';

type Props = { params: Promise<{ categoria: string }> };

export function generateStaticParams() {
  return CATEGORIAS_MAQUINA.map((c) => ({ categoria: c.valor }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params;
  if (!categoriaValida(categoria)) return { title: 'Categoria não encontrada', robots: { index: false } };
  const anuncios = await anunciosPublicos(categoria);
  const nome = PLURAL_CATEGORIA[categoria];
  return metadadosPagina({
    titulo: `${nome} usados à venda`,
    descricao: `${nome} usados à venda direto com produtores, com fotos, preço e cidade. Fale com o vendedor pelo WhatsApp no Grão Raiz.`,
    caminho: `/maquinas-usadas/categoria/${categoria}`,
    // Página sem anúncio é rasa: fica fora do índice até ter conteúdo.
    indexar: anuncios.length > 0,
  });
}

export default async function CategoriaMaquinas({ params }: Props) {
  const { categoria } = await params;
  if (!categoriaValida(categoria)) notFound();
  const anuncios = await anunciosPublicos(categoria);
  const nome = PLURAL_CATEGORIA[categoria];
  return (
    <PaginaVitrine
      titulo={`${nome} usados à venda`}
      abertura={`${nome} usados anunciados por produtores no Grão Raiz, com fotos, preço, ano e horas de uso. ${anuncios.length === 0 ? 'Ainda não há anúncios nesta categoria.' : anuncios.length === 1 ? 'Há 1 anúncio no ar.' : `Há ${anuncios.length} anúncios no ar.`} O contato com o vendedor é pelo WhatsApp, no app.`}
      anuncios={anuncios}
      categoria={categoria}
    />
  );
}
