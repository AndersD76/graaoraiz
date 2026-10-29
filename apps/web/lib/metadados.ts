import type { Metadata } from 'next';
import { NOME_APP } from './config';

interface OpcoesMetadados {
  /** Título da página (o layout acrescenta " | Grão Raiz"). */
  titulo: string;
  descricao: string;
  /** Caminho canônico, começando com "/". */
  caminho: string;
  /** Usa o título exatamente como informado, sem o sufixo do layout. */
  tituloAbsoluto?: boolean;
  indexar?: boolean;
}

/** Imagem gerada por app/opengraph-image.tsx. Repetida aqui porque um openGraph definido na página substitui o herdado. */
const IMAGEM_COMPARTILHAMENTO = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: `${NOME_APP} — o vigia da sua lavoura`,
};

/** Metadados de uma página, incluindo Open Graph completo (o Next não mescla objetos aninhados). */
export function metadadosPagina({ titulo, descricao, caminho, tituloAbsoluto, indexar = true }: OpcoesMetadados): Metadata {
  const tituloOg = tituloAbsoluto ? titulo : `${titulo} | ${NOME_APP}`;
  return {
    title: tituloAbsoluto ? { absolute: titulo } : titulo,
    description: descricao,
    alternates: { canonical: caminho },
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      siteName: NOME_APP,
      url: caminho,
      title: tituloOg,
      description: descricao,
      images: [IMAGEM_COMPARTILHAMENTO],
    },
    twitter: {
      card: 'summary_large_image',
      title: tituloOg,
      description: descricao,
      images: [IMAGEM_COMPARTILHAMENTO],
    },
    robots: indexar ? undefined : { index: false, follow: true },
  };
}
