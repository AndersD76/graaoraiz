import { rotuloCategoria } from '@graoraiz/clima';
import { Download, HandCoins, Receipt, Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { marcarComissao } from '@/app/admin/acoes';
import { BotaoAcao } from '@/components/admin/botao-acao';
import { CabecalhoPagina, Cartao, CartaoNumero, Carregando, Celula, Filtros, fmtData, fmtNumero, fmtReais, LinkTexto, Selo, Tabela, Vazio } from '@/components/admin/ui';
import { exigirAdmin } from '@/lib/admin/auth';
import { lerFiltroVendas, totaisVendas, vendas } from '@/lib/admin/consultas';

export const metadata: Metadata = { title: 'Vendas e comissões' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const FILTROS = [
  { valor: 'aberto', rotulo: 'A receber' },
  { valor: 'pago', rotulo: 'Pagas' },
  { valor: 'todas', rotulo: 'Todas' },
];

async function Conteudo({ searchParams }: Props) {
  await exigirAdmin();
  const filtro = lerFiltroVendas((await searchParams).status);
  const [linhas, t] = await Promise.all([vendas(filtro), totaisVendas()]);

  return (
    <>
      <CabecalhoPagina titulo="Vendas e comissões" descricao="Cada venda fica registrada mesmo se o vendedor excluir a conta. A cobrança da comissão é combinada pelo WhatsApp.">
        <a
          href="/admin/vendas/planilha"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-adm-linha bg-adm-cartao px-3 text-sm font-semibold hover:bg-adm-fundo"
        >
          <Download className="size-4" aria-hidden /> Baixar planilha (CSV)
        </a>
      </CabecalhoPagina>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CartaoNumero rotulo="Vendas registradas" valor={fmtNumero.format(t.n)} icone={Receipt} detalhe={`${fmtReais.format(t.valor)} em máquinas vendidas`} />
        <CartaoNumero rotulo="Comissão total" valor={fmtReais.format(t.devida)} icone={HandCoins} detalhe="soma de todas as vendas" />
        <CartaoNumero rotulo="Recebida" valor={fmtReais.format(t.recebida)} icone={Wallet} detalhe="marcadas como pagas" />
        <CartaoNumero rotulo="A receber" valor={fmtReais.format(t.aberta)} icone={HandCoins} detalhe="cobrar do vendedor" />
      </div>

      <div className="mb-4">
        <Filtros opcoes={FILTROS} atual={filtro} base="/admin/vendas" parametros={{}} nome="status" />
      </div>
      <Cartao>
        {linhas.length ? (
          <Tabela legenda="Vendas e comissões" cabecalho={['Máquina', 'Vendedor', 'Venda', 'Comissão', 'Situação', '']}>
            {linhas.map((v) => (
              <tr key={v.anuncio_id} className="hover:bg-adm-fundo">
                <Celula>
                  <span className="block max-w-64 truncate font-medium">{v.titulo}</span>
                  <span className="text-adm-texto-2">
                    {rotuloCategoria(v.categoria)} · vendida em {fmtData.format(v.vendido_em)}
                  </span>
                </Celula>
                <Celula>
                  {v.conta_id ? <LinkTexto href={`/admin/usuarios/${v.conta_id}`}>{v.vendedor_nome}</LinkTexto> : <span className="font-medium">{v.vendedor_nome}</span>}
                  <span className="block text-adm-texto-2">
                    <a href={`https://wa.me/55${v.whatsapp}`} target="_blank" rel="noopener" className="hover:underline">
                      WhatsApp {v.whatsapp}
                    </a>
                  </span>
                </Celula>
                <Celula className="whitespace-nowrap tabular-nums">{fmtReais.format(Number(v.valor_venda))}</Celula>
                <Celula className="whitespace-nowrap tabular-nums">
                  <span className="font-semibold">{fmtReais.format(Number(v.comissao_valor))}</span>
                  <span className="block text-adm-texto-2">{Number(v.comissao_percentual).toLocaleString('pt-BR')}%</span>
                </Celula>
                <Celula>{v.comissao_paga_em ? <Selo tom="bom">Paga em {fmtData.format(v.comissao_paga_em)}</Selo> : <Selo tom="atencao">A receber</Selo>}</Celula>
                <Celula>
                  {v.comissao_paga_em ? (
                    <BotaoAcao acao={marcarComissao} campos={{ id: v.anuncio_id, paga: 'nao' }} rotulo="Desfazer" icone="desfazer" confirmar="Voltar esta comissão para “a receber”?" />
                  ) : (
                    <BotaoAcao acao={marcarComissao} campos={{ id: v.anuncio_id, paga: 'sim' }} rotulo="Marcar paga" icone="pago" variante="primario" />
                  )}
                </Celula>
              </tr>
            ))}
          </Tabela>
        ) : (
          <Vazio titulo={filtro === 'aberto' ? 'Nenhuma comissão a receber' : 'Nenhuma venda aqui'} texto="Quando um vendedor marcar “vendi” no app, a venda e a comissão aparecem aqui." />
        )}
      </Cartao>
    </>
  );
}

export default function Vendas(props: Props) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo {...props} />
    </Suspense>
  );
}
