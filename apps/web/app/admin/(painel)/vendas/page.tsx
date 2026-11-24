import { rotuloCategoria } from '@graoraiz/clima';
import { Download, HandCoins, Receipt, Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { marcarComissao } from '@/app/admin/acoes';
import { BotaoAcao } from '@/components/admin/botao-acao';
import { CabecalhoPagina, Cartao, CartaoNumero, Carregando, Celula, Filtros, fmtData, fmtNumero, fmtReais, LinkTexto, Selo, Tabela, Vazio } from '@/components/admin/ui';
import { exigirAdmin } from '@/lib/admin/auth';
import { lerFiltroVendas, totaisVendas, vendas } from '@/lib/admin/consultas';
import { cobraComissao } from '@/lib/maquinas';

export const metadata: Metadata = { title: 'Vendas' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const FILTROS = [
  { valor: 'aberto', rotulo: 'A receber' },
  { valor: 'pago', rotulo: 'Pagas' },
  { valor: 'todas', rotulo: 'Todas' },
];

async function Conteudo({ searchParams }: Props) {
  await exigirAdmin();
  const t = await totaisVendas();
  // Hoje anunciar e vender é grátis: as partes de comissão só aparecem se ela for ligada ou se já houver comissão registrada.
  const comComissao = cobraComissao() || t.devida > 0;
  const filtro = comComissao ? lerFiltroVendas((await searchParams).status) : 'todas';
  const linhas = await vendas(filtro);

  return (
    <>
      <CabecalhoPagina
        titulo={comComissao ? 'Vendas e comissões' : 'Vendas'}
        descricao={
          comComissao
            ? 'Cada venda com comissão fica registrada mesmo se o vendedor excluir a conta. A cobrança da comissão é combinada pelo e-mail do vendedor.'
            : 'Vendas marcadas pelos vendedores no app. Anunciar e vender é grátis: não há comissão a cobrar.'
        }
      >
        <a
          href="/admin/vendas/planilha"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-adm-linha bg-adm-cartao px-3 text-sm font-semibold hover:bg-adm-fundo"
        >
          <Download className="size-4" aria-hidden /> Baixar planilha (CSV)
        </a>
      </CabecalhoPagina>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CartaoNumero rotulo="Vendas registradas" valor={fmtNumero.format(t.n)} icone={Receipt} detalhe={`${fmtReais.format(t.valor)} em máquinas vendidas`} />
        {comComissao ? (
          <>
            <CartaoNumero rotulo="Comissão total" valor={fmtReais.format(t.devida)} icone={HandCoins} detalhe="soma de todas as vendas" />
            <CartaoNumero rotulo="Recebida" valor={fmtReais.format(t.recebida)} icone={Wallet} detalhe="marcadas como pagas" />
            <CartaoNumero rotulo="A receber" valor={fmtReais.format(t.aberta)} icone={HandCoins} detalhe="cobrar do vendedor" />
          </>
        ) : null}
      </div>

      {comComissao ? (
        <div className="mb-4">
          <Filtros opcoes={FILTROS} atual={filtro} base="/admin/vendas" parametros={{}} nome="status" />
        </div>
      ) : null}
      <Cartao>
        {linhas.length ? (
          <Tabela legenda="Vendas" cabecalho={comComissao ? ['Máquina', 'Vendedor', 'Venda', 'Comissão', 'Situação', ''] : ['Máquina', 'Vendedor', 'Venda']}>
            {linhas.map((v) => {
              const temComissao = Number(v.comissao_valor) > 0;
              return (
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
                      {/* Desde 24/11/2026 o anúncio não pede WhatsApp: o contato com o vendedor é o e-mail da conta. */}
                      {v.whatsapp ? (
                        <a href={`https://wa.me/55${v.whatsapp}`} target="_blank" rel="noopener" className="hover:underline">
                          WhatsApp {v.whatsapp}
                        </a>
                      ) : (
                        v.vendedor_email
                      )}
                    </span>
                  </Celula>
                  <Celula className="whitespace-nowrap tabular-nums">{fmtReais.format(Number(v.valor_venda))}</Celula>
                  {comComissao ? (
                    <>
                      <Celula className="whitespace-nowrap tabular-nums">
                        {temComissao ? (
                          <>
                            <span className="font-semibold">{fmtReais.format(Number(v.comissao_valor))}</span>
                            <span className="block text-adm-texto-2">{Number(v.comissao_percentual).toLocaleString('pt-BR')}%</span>
                          </>
                        ) : (
                          <span className="text-adm-texto-2">—</span>
                        )}
                      </Celula>
                      <Celula>
                        {!temComissao ? (
                          <Selo tom="neutro">Sem comissão</Selo>
                        ) : v.comissao_paga_em ? (
                          <Selo tom="bom">Paga em {fmtData.format(v.comissao_paga_em)}</Selo>
                        ) : (
                          <Selo tom="atencao">A receber</Selo>
                        )}
                      </Celula>
                      <Celula>
                        {!temComissao ? null : v.comissao_paga_em ? (
                          <BotaoAcao acao={marcarComissao} campos={{ id: v.anuncio_id, paga: 'nao' }} rotulo="Desfazer" icone="desfazer" confirmar="Voltar esta comissão para “a receber”?" />
                        ) : (
                          <BotaoAcao acao={marcarComissao} campos={{ id: v.anuncio_id, paga: 'sim' }} rotulo="Marcar paga" icone="pago" variante="primario" />
                        )}
                      </Celula>
                    </>
                  ) : null}
                </tr>
              );
            })}
          </Tabela>
        ) : (
          <Vazio
            titulo={filtro === 'aberto' ? 'Nenhuma comissão a receber' : 'Nenhuma venda aqui'}
            texto="Quando um vendedor marcar “vendi” no app, a venda aparece aqui."
          />
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
