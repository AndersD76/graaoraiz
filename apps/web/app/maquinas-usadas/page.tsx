import type { Metadata } from 'next';
import { PaginaVitrine } from '@/components/vitrine-maquinas';
import { comissaoPercentual } from '@/lib/maquinas';
import { metadadosPagina } from '@/lib/metadados';
import { anunciosPublicos } from '@/lib/vitrine';

export const metadata: Metadata = metadadosPagina({
  titulo: 'Máquinas agrícolas usadas à venda',
  descricao:
    'Tratores, colheitadeiras, plantadeiras e pulverizadores usados à venda direto com produtores. Anunciar é grátis; fale com o vendedor pelo WhatsApp.',
  caminho: '/maquinas-usadas',
});

/** Vitrine pública dos classificados, renderizada no servidor para buscadores e IAs. */
export default async function MaquinasUsadas() {
  const anuncios = await anunciosPublicos(null);
  const pct = comissaoPercentual().toLocaleString('pt-BR');
  return (
    <PaginaVitrine
      titulo="Máquinas e implementos agrícolas usados à venda"
      abertura={`No Grão Raiz, produtores compram e vendem tratores, colheitadeiras, plantadeiras, pulverizadores e implementos usados direto entre si. Anunciar é grátis, o contato é pelo WhatsApp e a comissão de ${pct}% só é cobrada quando a máquina é vendida. ${anuncios.length === 1 ? 'Há 1 máquina anunciada agora.' : `Há ${anuncios.length} máquinas anunciadas agora.`}`}
      anuncios={anuncios}
      categoria={null}
    />
  );
}
