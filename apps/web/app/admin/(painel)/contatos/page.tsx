import { formatarReais } from '@graoraiz/clima';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CabecalhoPagina, Cartao, Carregando, Celula, fmtDataHora, fmtNumero, LinkTexto, Paginacao, SeloSituacao, Tabela, Vazio } from '@/components/admin/ui';
import { exigirAdmin } from '@/lib/admin/auth';
import { contatos, lerPagina, POR_PAGINA } from '@/lib/admin/consultas';

export const metadata: Metadata = { title: 'Pedidos de contato' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function Conteudo({ searchParams }: Props) {
  await exigirAdmin();
  const pagina = lerPagina((await searchParams).pagina);
  const { linhas, total } = await contatos(pagina);

  return (
    <>
      <CabecalhoPagina
        titulo="Pedidos de contato"
        descricao={`${fmtNumero.format(total)} ${total === 1 ? 'vez' : 'vezes'} que um comprador mandou a primeira mensagem ao vendedor (antes de 24/11/2026, pediu o WhatsApp). Bom para acompanhar se a venda saiu.`}
      />
      <Cartao>
        {linhas.length ? (
          <Tabela legenda="Pedidos de contato" cabecalho={['Quando', 'Comprador', 'Máquina', 'Vendedor', 'Situação']}>
            {linhas.map((l) => (
              <tr key={`${l.anuncio_id}-${l.comprador_id}`} className="hover:bg-adm-fundo">
                <Celula className="whitespace-nowrap tabular-nums">{fmtDataHora.format(l.criado_em)}</Celula>
                <Celula>
                  <LinkTexto href={`/admin/usuarios/${l.comprador_id}`}>{l.comprador}</LinkTexto>
                  <span className="block text-adm-texto-2">{l.comprador_email}</span>
                </Celula>
                <Celula>
                  <span className="block max-w-64 truncate font-medium">{l.titulo}</span>
                  <span className="text-adm-texto-2">{formatarReais(Number(l.preco))}</span>
                </Celula>
                <Celula>
                  <LinkTexto href={`/admin/usuarios/${l.vendedor_id}`}>{l.vendedor}</LinkTexto>
                </Celula>
                <Celula>
                  <SeloSituacao situacao={l.situacao} />
                </Celula>
              </tr>
            ))}
          </Tabela>
        ) : (
          <Vazio titulo="Nenhum pedido de contato ainda" texto="Quando alguém mandar a primeira mensagem a um vendedor, aparece aqui." />
        )}
        <Paginacao pagina={pagina} total={total} porPagina={POR_PAGINA} base="/admin/contatos" parametros={{}} />
      </Cartao>
    </>
  );
}

export default function Contatos(props: Props) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo {...props} />
    </Suspense>
  );
}
