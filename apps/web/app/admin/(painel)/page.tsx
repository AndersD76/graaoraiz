import { rotuloCategoria } from '@graoraiz/clima';
import { HandCoins, MapPinned, MessageCircle, Receipt, Sprout, Star, Tractor, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BarrasDeitadas, ColunasPorDia } from '@/components/admin/graficos';
import { CabecalhoPagina, Cartao, CartaoNumero, Carregando, Filtros, fmtData, fmtNumero, fmtReais, LinkTexto, Selo, Vazio } from '@/components/admin/ui';
import { exigirAdmin } from '@/lib/admin/auth';
import { anunciosPorCategoria, cadastrosPorDia, contas, funil, lerPeriodo, type Periodo, resumo, vendas } from '@/lib/admin/consultas';

export const metadata: Metadata = { title: 'Dashboard' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const OPCOES_PERIODO = [
  { valor: '7', rotulo: '7 dias' },
  { valor: '30', rotulo: '30 dias' },
  { valor: '90', rotulo: '90 dias' },
];

async function Conteudo({ searchParams }: Props) {
  await exigirAdmin();
  const dias: Periodo = lerPeriodo((await searchParams).periodo);
  const [r, porDia, etapas, categorias, ultimas, ultimasVendas] = await Promise.all([
    resumo(dias),
    cadastrosPorDia(dias),
    funil(dias),
    anunciosPorCategoria(),
    contas('', 'reais', 1),
    vendas('todas', 5),
  ]);
  const antes = `vs. ${dias} dias anteriores`;

  return (
    <>
      <CabecalhoPagina titulo="Dashboard" descricao={`Resumo dos últimos ${dias} dias. Contas de demonstração ficam de fora.`}>
        <Filtros opcoes={OPCOES_PERIODO} atual={String(dias)} base="/admin" parametros={{}} nome="periodo" />
      </CabecalhoPagina>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CartaoNumero rotulo="Contas novas" valor={fmtNumero.format(r.contas_novas)} icone={Users} comparar={{ atual: r.contas_novas, antes: r.contas_novas_antes, rotulo: antes }} />
        <CartaoNumero rotulo="Contas usando o app" valor={fmtNumero.format(r.contas_ativas)} icone={Sprout} detalhe={`de ${fmtNumero.format(r.contas_total)} contas; sincronizaram no período`} />
        <CartaoNumero
          rotulo="Talhões cadastrados"
          valor={fmtNumero.format(r.talhoes)}
          icone={MapPinned}
          detalhe={r.area_ha > 0 ? `${fmtNumero.format(Math.round(r.area_ha))} ha informados` : 'área ainda não informada'}
        />
        <CartaoNumero rotulo="Anúncios no ar" valor={fmtNumero.format(r.anuncios_ativos)} icone={Tractor} detalhe={`${fmtNumero.format(r.anuncios_novos)} novos no período`} />
        <CartaoNumero rotulo="Pedidos de contato" valor={fmtNumero.format(r.contatos)} icone={MessageCircle} comparar={{ atual: r.contatos, antes: r.contatos_antes, rotulo: antes }} />
        <CartaoNumero rotulo="Vendas de máquinas" valor={fmtNumero.format(r.vendas)} icone={Receipt} detalhe={`${fmtReais.format(r.vendas_valor)} vendidos no período`} />
        <CartaoNumero
          rotulo="Comissão a receber"
          valor={fmtReais.format(r.comissao_aberta)}
          icone={HandCoins}
          detalhe={`${fmtNumero.format(r.comissao_aberta_n)} em aberto · ${fmtReais.format(r.comissao_recebida)} já recebidos`}
        />
        <CartaoNumero
          rotulo="Nota da versão de teste"
          valor={r.nota_media === null ? '—' : r.nota_media.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
          icone={Star}
          detalhe={`${fmtNumero.format(r.avaliacoes)} ${r.avaliacoes === 1 ? 'avaliação' : 'avaliações'}`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Cartao titulo="Contas criadas por dia" descricao={`${fmtNumero.format(r.contas_novas)} no período`} className="xl:col-span-2">
          <ColunasPorDia titulo="Contas criadas por dia" dados={porDia} unidade={['conta', 'contas']} />
        </Cartao>
        <Cartao titulo="Anúncios no ar por categoria">
          {categorias.length ? (
            <BarrasDeitadas titulo="Anúncios no ar por categoria" dados={categorias.map((c) => ({ rotulo: rotuloCategoria(c.categoria), n: c.n }))} />
          ) : (
            <Vazio titulo="Nenhum anúncio no ar" texto="Quando alguém anunciar, as categorias aparecem aqui." />
          )}
        </Cartao>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Cartao titulo="Funil do período" descricao="Pessoas em cada etapa (conta ou, sem conta, o navegador). A % é sobre quem abriu o app." acao={<LinkTexto href={`/admin/funil?periodo=${dias}`}>Detalhes</LinkTexto>}>
          <BarrasDeitadas titulo="Funil do período" dados={etapas.map((e) => ({ rotulo: e.rotulo, n: e.n }))} relativo />
        </Cartao>
        <div className="flex flex-col gap-6">
          <Cartao titulo="Contas mais recentes" acao={<LinkTexto href="/admin/usuarios">Ver todas</LinkTexto>}>
            {ultimas.linhas.length ? (
              <ul className="-my-2 divide-y divide-adm-linha">
                {ultimas.linhas.slice(0, 6).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0">
                      <LinkTexto href={`/admin/usuarios/${c.id}`}>{c.nome}</LinkTexto>
                      <span className="block truncate text-adm-texto-2">{c.email}</span>
                    </span>
                    <span className="shrink-0 text-right text-adm-texto-2">
                      {fmtData.format(c.criado_em)}
                      <span className="block">{c.talhoes ? `${c.talhoes} talhão(ões)` : 'sem talhão'}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Vazio titulo="Nenhuma conta ainda" />
            )}
          </Cartao>
          <Cartao titulo="Vendas recentes" acao={<LinkTexto href="/admin/vendas?status=todas">Ver todas</LinkTexto>}>
            {ultimasVendas.length ? (
              <ul className="-my-2 divide-y divide-adm-linha">
                {ultimasVendas.map((v) => (
                  <li key={v.anuncio_id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{v.titulo}</span>
                      <span className="text-adm-texto-2">
                        {v.vendedor_nome} · {fmtData.format(v.vendido_em)}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-semibold tabular-nums">{fmtReais.format(Number(v.comissao_valor))}</span>
                      {v.comissao_paga_em ? <Selo tom="bom">Paga</Selo> : <Selo tom="atencao">A receber</Selo>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Vazio titulo="Nenhuma venda ainda" texto="Quando um vendedor marcar “vendi”, a comissão aparece aqui." />
            )}
          </Cartao>
        </div>
      </div>
    </>
  );
}

export default function Dashboard(props: Props) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo {...props} />
    </Suspense>
  );
}
