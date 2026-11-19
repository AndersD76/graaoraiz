import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Autoria, ChamadaApp, Fontes, JsonLd, Perguntas, Trilha } from '@/components/seo/pecas';
import { Rastreio } from '@/components/seo/rastreio';
import { metadadosPagina } from '@/lib/metadados';
import { absoluta } from '@/lib/seo';
import { CLUSTERS, clusterValido } from '@/lib/seo/config';
import { descricaoTermo, termoPublicado, termosPublicados, tituloTermo } from '@/lib/seo/paginas';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return [{ slug: 'exemplo-inexistente' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = await termoPublicado(slug);
  if (!t) return { title: 'Termo não encontrado', robots: { index: false } };
  return metadadosPagina({ titulo: tituloTermo(t), tituloAbsoluto: true, descricao: descricaoTermo(t), caminho: `/glossario/${t.slug}` });
}

/** Para onde levar quem lê cada assunto: a ferramenta ou página do Grão Raiz que resolve o problema. */
const PROXIMO_PASSO: Record<string, { href: string; texto: string }> = {
  pulverizacao: { href: '/hora-de-pulverizar', texto: 'Veja a hora de pulverizar no seu município' },
  geada: { href: '/hora-de-pulverizar', texto: 'Veja o risco de geada da semana no seu município' },
  chuva: { href: '/hora-de-pulverizar', texto: 'Veja a chuva prevista no seu município' },
  'maquinas-usadas': { href: '/maquinas-usadas', texto: 'Veja máquinas usadas à venda (anunciar é grátis)' },
};

async function Conteudo({ params }: Props) {
  const { slug } = await params;
  const t = await termoPublicado(slug);
  if (!t) notFound();
  const todos = await termosPublicados();
  const relacionados = t.relacionados.map((s) => todos.find((x) => x.slug === s)).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const mesmoCluster = todos.filter((x) => x.cluster === t.cluster && x.slug !== t.slug && !t.relacionados.includes(x.slug)).slice(0, 6);
  const caminho = `/glossario/${t.slug}`;
  const nomeCluster = clusterValido(t.cluster) ? CLUSTERS[t.cluster] : t.cluster;
  const passo = PROXIMO_PASSO[t.cluster];

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <Rastreio contexto={{ page_type: 'glossario', cluster: t.cluster, consulta_alvo: t.consulta, isca_id: t.cluster === 'pulverizacao' ? 'calculadora-delta-t' : 'app-talhao' }} />
      <Trilha itens={[{ nome: 'Glossário', caminho: '/glossario' }, { nome: t.termo, caminho }]} />
      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-marca">{nomeCluster}</p>
      <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{t.termo}: o que é</h1>
      <p className="mt-4 text-lg leading-relaxed">{t.respostaDireta}</p>
      <Autoria revisadoEm={t.revisadoEm} />

      <div className="mt-8 space-y-4 leading-relaxed">
        {t.explicacao.split(/\n{2,}/).map((p) => (
          <p key={p.slice(0, 40)}>{p}</p>
        ))}
      </div>

      <section aria-labelledby="exemplo-titulo" className="mt-10 rounded-2xl bg-superficie p-5">
        <h2 id="exemplo-titulo" className="text-xl font-bold">
          Na prática
        </h2>
        <p className="mt-2 leading-relaxed">{t.exemplo}</p>
      </section>

      {t.cluster === 'pulverizacao' ? (
        <div data-isca="calculadora-delta-t" className="mt-8 rounded-2xl border border-marca/30 bg-marca-clara p-5">
          <p className="font-bold">Calcule o delta T agora</p>
          <p className="mt-1 text-texto-2">Temperatura e umidade viram delta T na hora, com a faixa boa para aplicar.</p>
          <Link href="/ferramentas/delta-t" className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-marca px-5 font-semibold text-white hover:bg-marca-escura">
            Abrir a calculadora grátis
          </Link>
        </div>
      ) : passo ? (
        <p className="mt-8">
          <Link href={passo.href} className="font-semibold text-marca underline-offset-2 hover:underline">
            {passo.texto} →
          </Link>
        </p>
      ) : null}

      <Perguntas perguntas={t.perguntas} />

      {relacionados.length || mesmoCluster.length ? (
        <section aria-labelledby="rel-titulo" className="mt-12">
          <h2 id="rel-titulo" className="text-xl font-bold">
            Termos relacionados
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {[...relacionados, ...mesmoCluster].map((r) => (
              <li key={r.slug}>
                <Link href={`/glossario/${r.slug}`} className="inline-flex rounded-full border border-linha px-3 py-1 text-sm hover:bg-superficie">
                  {r.termo}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ChamadaApp texto="Clima, aplicação e preços da sua lavoura num app só, grátis." origem={`glossario-${t.slug}`} />
      <Fontes fontes={t.fontes} />
      <JsonLd
        dados={{
          '@context': 'https://schema.org',
          '@type': 'DefinedTerm',
          name: t.termo,
          description: t.respostaDireta,
          url: absoluta(caminho),
          inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'Glossário agrícola do Grão Raiz', url: absoluta('/glossario') },
        }}
      />
    </article>
  );
}

export default function TermoGlossario(props: Props) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-14 text-texto-2">Carregando…</div>}>
      <Conteudo {...props} />
    </Suspense>
  );
}
