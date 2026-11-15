import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BarrasDeitadas } from '@/components/admin/graficos';
import { CabecalhoPagina, Cartao, Carregando, Celula, Filtros, fmtNumero, Tabela, Vazio } from '@/components/admin/ui';
import { exigirAdmin } from '@/lib/admin/auth';
import { ETAPAS_FUNIL, funil, funilPorSemana, indexNow, lerPeriodo, origensDasContas, robosDeIa } from '@/lib/admin/consultas';

export const metadata: Metadata = { title: 'Funil' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const OPCOES_PERIODO = [
  { valor: '7', rotulo: '7 dias' },
  { valor: '30', rotulo: '30 dias' },
  { valor: '90', rotulo: '90 dias' },
];

async function Conteudo({ searchParams }: Props) {
  await exigirAdmin();
  const dias = lerPeriodo((await searchParams).periodo);
  const [etapas, porSemana, origens, robos, envios] = await Promise.all([funil(dias), funilPorSemana(), origensDasContas(dias), robosDeIa(dias), indexNow(dias)]);
  const semanas = [...new Set(porSemana.map((r) => r.semana))];
  const valor = (semana: string, nome: string) => porSemana.find((r) => r.semana === semana && r.nome === nome)?.n ?? 0;

  return (
    <>
      <CabecalhoPagina titulo="Funil" descricao="Do primeiro acesso à venda de máquina. Conta pessoas (conta ou navegador), não cliques.">
        <Filtros opcoes={OPCOES_PERIODO} atual={String(dias)} base="/admin/funil" parametros={{}} nome="periodo" />
      </CabecalhoPagina>

      <div className="grid gap-6 xl:grid-cols-2">
        <Cartao titulo={`Etapas nos últimos ${dias} dias`} descricao="A % é sobre quem abriu o app.">
          <BarrasDeitadas titulo="Etapas do funil" dados={etapas.map((e) => ({ rotulo: e.rotulo, n: e.n }))} relativo />
        </Cartao>
        <Cartao titulo={`De onde vieram as contas (${dias} dias)`} descricao="Primeiro link de entrada (UTM ou site de origem).">
          {origens.length ? (
            <BarrasDeitadas titulo="Origem das contas" dados={origens.map((o) => ({ rotulo: o.fonte, n: o.n }))} />
          ) : (
            <Vazio titulo="Nenhuma conta no período" />
          )}
        </Cartao>
      </div>

      <div className="mt-6">
        <Cartao titulo="Por semana (8 semanas)" descricao="Começo de cada semana no topo da coluna.">
          {semanas.length ? (
            <Tabela legenda="Funil por semana" cabecalho={['Etapa', ...semanas]}>
              {ETAPAS_FUNIL.map((e) => (
                <tr key={e.nome}>
                  <Celula>{e.rotulo}</Celula>
                  {semanas.map((s) => (
                    <Celula key={s} className="tabular-nums">
                      {fmtNumero.format(valor(s, e.nome))}
                    </Celula>
                  ))}
                </tr>
              ))}
            </Tabela>
          ) : (
            <Vazio titulo="Nenhum evento ainda" texto="Os eventos começam a chegar depois que esta versão for publicada." />
          )}
        </Cartao>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Cartao titulo={`Robôs de IA que leram o site (${dias} dias)`} descricao="ChatGPT, Perplexity, Claude e outros: sinal de que o site pode aparecer nas respostas.">
          {robos.length ? (
            <Tabela legenda="Robôs de IA" cabecalho={['Robô', 'Visitas', 'Páginas diferentes']}>
              {robos.map((r) => (
                <tr key={r.bot}>
                  <Celula>{r.bot}</Celula>
                  <Celula className="tabular-nums">{fmtNumero.format(r.n)}</Celula>
                  <Celula className="tabular-nums">{fmtNumero.format(r.paginas)}</Celula>
                </tr>
              ))}
            </Tabela>
          ) : (
            <Vazio titulo="Nenhuma visita registrada" />
          )}
        </Cartao>
        <Cartao titulo={`Avisos aos buscadores (IndexNow, ${dias} dias)`} descricao="Cada anúncio novo ou mudado avisa o Bing e outros buscadores.">
          {envios.length ? (
            <Tabela legenda="Envios ao IndexNow" cabecalho={['Resposta', 'Envios']}>
              {envios.map((e) => (
                <tr key={e.status}>
                  <Celula>{e.status}</Celula>
                  <Celula className="tabular-nums">{fmtNumero.format(e.n)}</Celula>
                </tr>
              ))}
            </Tabela>
          ) : (
            <Vazio titulo="Nenhum envio" texto="Liga quando a variável INDEXNOW_KEY estiver no servidor." />
          )}
        </Cartao>
      </div>
    </>
  );
}

export default function Funil(props: Props) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo {...props} />
    </Suspense>
  );
}
