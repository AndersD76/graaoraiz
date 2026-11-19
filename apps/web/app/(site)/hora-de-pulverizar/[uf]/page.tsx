import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Autoria, ChamadaApp, Trilha } from '@/components/seo/pecas';
import { Rastreio } from '@/components/seo/rastreio';
import { metadadosPagina } from '@/lib/metadados';
import { caminhoMunicipio, municipiosPublicados, type MunicipioAgro } from '@/lib/seo/municipios';
import { NOME_ESTADO } from '@/lib/ufs';

type Props = { params: Promise<{ uf: string }> };

export function generateStaticParams() {
  return [{ uf: 'xx' }];
}

const fmtN = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uf } = await params;
  const nome = NOME_ESTADO[uf.toUpperCase()];
  if (!nome) return { title: 'Estado não encontrado', robots: { index: false } };
  const lista = await municipiosPublicados(uf);
  return metadadosPagina({
    titulo: `Hora de pulverizar em ${nome} por município`,
    tituloAbsoluto: true,
    descricao: `Janelas para pulverizar em ${lista.length} municípios de ${nome}: delta T, vento, umidade e chuva hora a hora, com a área de grãos de cada cidade.`.slice(0, 155),
    caminho: `/hora-de-pulverizar/${uf}`,
    indexar: lista.length > 0,
  });
}

async function Conteudo({ params }: Props) {
  const { uf } = await params;
  const nome = NOME_ESTADO[uf.toUpperCase()];
  if (!nome || uf !== uf.toLowerCase()) notFound();
  const lista = await municipiosPublicados(uf);
  if (lista.length === 0) notFound();
  const porRegiao = new Map<string, MunicipioAgro[]>();
  for (const m of lista) {
    const k = m.regiaoNome ?? 'Outros';
    porRegiao.set(k, [...(porRegiao.get(k) ?? []), m]);
  }
  const regioes = [...porRegiao.entries()].sort((a, b) => b[1].reduce((s, m) => s + m.areaGraosHa, 0) - a[1].reduce((s, m) => s + m.areaGraosHa, 0));
  const maiores = lista.slice(0, 3).map((m) => m.nome);

  return (
    <article className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <Rastreio contexto={{ page_type: 'hub', cluster: 'pulverizacao', consulta_alvo: `hora de pulverizar ${nome.toLowerCase()}`, isca_id: 'boletim-pulverizacao-municipio' }} />
      <Trilha itens={[{ nome: 'Hora de pulverizar', caminho: '/hora-de-pulverizar' }, { nome, caminho: `/hora-de-pulverizar/${uf}` }]} />
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Hora de pulverizar em {nome}</h1>
      <p className="mt-4 text-lg leading-relaxed">
        Escolha o município para ver as janelas de pulverização de hoje e dos próximos dias, calculadas hora a hora com delta T, vento na altura da barra,
        umidade e chuva. São {lista.length} municípios de {nome} com página, a partir de {fmtN.format(1000)} ha de grãos; os maiores produtores são {maiores.join(', ')}.
      </p>
      <Autoria revisadoEm={new Date().toISOString().slice(0, 10)} />

      {regioes.map(([regiao, ms]) => (
        <section key={regiao} aria-labelledby={`r-${ms[0].codigo}`} className="mt-10">
          <h2 id={`r-${ms[0].codigo}`} className="text-xl font-bold">
            Região de {regiao}
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ms.map((m) => (
              <li key={m.codigo}>
                <Link href={caminhoMunicipio(m)} className="flex items-center justify-between gap-3 rounded-xl border border-linha px-4 py-3 hover:bg-superficie">
                  <span className="font-medium">{m.nome}</span>
                  <span className="text-sm text-texto-2">{fmtN.format(m.areaGraosHa)} ha</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="mt-6 text-xs text-texto-2">Área de grãos: soma da área plantada de soja, milho, trigo, feijão, algodão, arroz, sorgo e aveia (IBGE, Produção Agrícola Municipal).</p>

      <ChamadaApp texto="Prefere o aviso no celular, no ponto exato da lavoura?" origem={`uf-${uf}`} />
      <p className="mt-8 text-sm text-texto-2">
        Veja também: <Link href="/hora-de-pulverizar" className="underline-offset-2 hover:underline">todos os estados</Link> ·{' '}
        <Link href="/ferramentas/delta-t" className="underline-offset-2 hover:underline">calculadora de delta T</Link> ·{' '}
        <Link href="/metodologia" className="underline-offset-2 hover:underline">como calculamos</Link>
      </p>
    </article>
  );
}

export default function PaginaUf(props: Props) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-14 text-texto-2">Carregando…</div>}>
      <Conteudo {...props} />
    </Suspense>
  );
}
