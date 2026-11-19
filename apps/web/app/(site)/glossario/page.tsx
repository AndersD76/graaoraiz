import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Autoria, JsonLd, Trilha } from '@/components/seo/pecas';
import { metadadosPagina } from '@/lib/metadados';
import { absoluta } from '@/lib/seo';
import { CLUSTERS, type Cluster } from '@/lib/seo/config';
import { termosPublicados } from '@/lib/seo/paginas';

export const metadata: Metadata = metadadosPagina({
  titulo: 'Glossário agrícola: termos do produtor de grãos',
  tituloAbsoluto: true,
  descricao: 'Delta T, deriva, geada, NDVI, CAR, EUDR, ZARC e outros termos da lavoura explicados com exemplo prático e fonte oficial. Grátis.',
  caminho: '/glossario',
});

async function Lista() {
  const termos = await termosPublicados();
  if (termos.length === 0) notFound();
  const grupos = (Object.keys(CLUSTERS) as Cluster[]).map((c) => ({ c, itens: termos.filter((t) => t.cluster === c) })).filter((g) => g.itens.length);
  return (
    <>
      <p className="mt-2 text-texto-2">{termos.length} termos, cada um com exemplo de lavoura e as fontes consultadas.</p>
      {grupos.map((g) => (
        <section key={g.c} aria-labelledby={`g-${g.c}`} className="mt-10">
          <h2 id={`g-${g.c}`} className="text-xl font-bold">
            {CLUSTERS[g.c]}
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {g.itens.map((t) => (
              <li key={t.slug}>
                <Link href={`/glossario/${t.slug}`} className="block rounded-xl border border-linha px-4 py-3 hover:bg-superficie">
                  <span className="font-medium">{t.termo}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <JsonLd
        dados={{
          '@context': 'https://schema.org',
          '@type': 'DefinedTermSet',
          name: 'Glossário agrícola do Grão Raiz',
          url: absoluta('/glossario'),
          hasDefinedTerm: termos.map((t) => ({ '@type': 'DefinedTerm', name: t.termo, url: absoluta(`/glossario/${t.slug}`) })),
        }}
      />
    </>
  );
}

export default function Glossario() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <Trilha itens={[{ nome: 'Glossário', caminho: '/glossario' }]} />
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Glossário agrícola</h1>
      <p className="mt-4 text-lg leading-relaxed">
        Os termos que o produtor de grãos encontra no dia a dia, de delta T e deriva a CAR, PRODES e EUDR, explicados em linguagem direta, com exemplo de lavoura e a
        fonte oficial de cada informação.
      </p>
      <Autoria revisadoEm="2026-11-18" />
      <Suspense fallback={<p className="mt-6 text-texto-2">Carregando os termos…</p>}>
        <Lista />
      </Suspense>
    </article>
  );
}
