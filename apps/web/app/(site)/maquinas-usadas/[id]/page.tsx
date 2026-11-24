import { formatarReais, resumoUso, rotuloCategoria } from '@graoraiz/clima';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CartaoMaquina } from '@/components/vitrine-maquinas';
import { metadadosPagina } from '@/lib/metadados';
import { absoluta, cortar, jsonLd } from '@/lib/seo';
import { anuncioPublico, anunciosPublicos, concordar, PLURAL_CATEGORIA } from '@/lib/vitrine';

type Props = { params: Promise<{ id: string }> };

const data = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' });

// Com Cache Components a rota dinâmica precisa de ao menos um parâmetro no build. O marcador não é um id
// válido (responde 404 sem ir ao banco); os anúncios reais são montados na primeira visita e ficam em cache.
export function generateStaticParams() {
  return [{ id: 'exemplo' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const a = await anuncioPublico(id);
  if (!a) return { title: 'Anúncio não encontrado', robots: { index: false } };
  const uso = resumoUso(a);
  const base = metadadosPagina({
    // O layout acrescenta " | Grão Raiz": o título cabe em ~60 caracteres.
    titulo: cortar(`${a.titulo} em ${a.municipio}/${a.uf}`, 46),
    descricao: cortar(`${a.titulo} por ${formatarReais(a.preco)}${uso ? `, ${uso}` : ''}, em ${a.municipio}/${a.uf}. Veja as fotos e converse com o vendedor pelo app.`, 155),
    caminho: `/maquinas-usadas/${a.id}`,
    // Vendida: a página fica para quem tem o link, mas sai do índice.
    indexar: a.situacao === 'ativo',
  });
  const foto = a.foto ? [{ url: absoluta(`/api/anuncios/fotos/${a.foto}`), alt: a.titulo }] : undefined;
  return foto ? { ...base, openGraph: { ...base.openGraph, images: foto }, twitter: { ...base.twitter, images: foto } } : base;
}

async function Detalhe({ params }: Props) {
  const { id } = await params;
  const a = await anuncioPublico(id);
  if (!a) notFound();
  const uso = resumoUso(a);
  const vendido = a.situacao !== 'ativo';
  const parecidos = (await anunciosPublicos(a.categoria)).filter((x) => x.id !== a.id).slice(0, 4);
  const categoria = PLURAL_CATEGORIA[a.categoria];
  const resposta = `${a.titulo}${uso ? `, ${uso}` : ''}, ${vendido ? 'vendido' : 'à venda'} por ${formatarReais(a.preco)} em ${a.municipio} (${a.uf}). Anunciado por ${a.vendedor} no Grão Raiz em ${data.format(new Date(a.criadoEm))}.`;

  return (
    <article className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <nav aria-label="Você está em" className="text-sm text-texto-2">
        <a href="/" className="hover:underline">
          Grão Raiz
        </a>
        {' › '}
        <Link href="/maquinas-usadas" className="hover:underline">
          Máquinas usadas
        </Link>
        {' › '}
        <Link href={`/maquinas-usadas/categoria/${a.categoria}`} className="hover:underline">
          {categoria}
        </Link>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          {a.fotos.map((f, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- a foto vem da API do próprio app, já reduzida
            <img
              key={f}
              src={`/api/anuncios/fotos/${f}`}
              alt={`${a.titulo}, foto ${i + 1} de ${a.fotos.length}`}
              width={800}
              height={600}
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : undefined}
              className="aspect-[4/3] w-full rounded-2xl object-cover"
            />
          ))}
        </div>

        <div>
          {vendido ? <p className="mb-4 inline-block rounded-full bg-superficie px-4 py-1 font-semibold">Vendido</p> : null}
          <p className="text-4xl font-extrabold text-marca">{formatarReais(a.preco)}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{a.titulo}</h1>
          <p className="mt-4 text-lg leading-relaxed text-texto-2">{resposta}</p>

          {vendido ? null : (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {/* <a> e não <Link>: o app web é um arquivo estático, não uma página do Next. */}
              <a href={`/maquina/${a.id}`} className="inline-flex min-h-12 items-center justify-center rounded-full bg-marca px-6 font-semibold text-white hover:bg-marca-escura">
                Falar com o vendedor no app
              </a>
              <a href="/anunciar" className="inline-flex min-h-12 items-center justify-center rounded-full border border-campo px-6 font-semibold hover:bg-superficie">
                Anunciar a minha
              </a>
            </div>
          )}

          <dl className="mt-8 divide-y divide-linha rounded-2xl border border-linha">
            {[
              ['Categoria', rotuloCategoria(a.categoria)],
              ['Marca', a.marca],
              ['Modelo', a.modelo],
              ['Ano', a.ano ? String(a.ano) : null],
              ['Horas de uso', a.horas !== null ? `${a.horas.toLocaleString('pt-BR')} h` : null],
              ['Local', `${a.municipio}/${a.uf}`],
              ['Atualizado em', data.format(new Date(a.atualizadoEm))],
            ]
              .filter((l): l is [string, string] => Boolean(l[1]))
              .map(([rotulo, valor]) => (
                <div key={rotulo} className="flex justify-between gap-4 px-5 py-3">
                  <dt className="text-texto-2">{rotulo}</dt>
                  <dd className="text-right font-semibold">{valor}</dd>
                </div>
              ))}
          </dl>

          {a.descricao ? (
            <section className="mt-8">
              <h2 className="text-xl font-bold">Descrição do vendedor</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed">{a.descricao}</p>
            </section>
          ) : null}

          <section className="mt-8 rounded-2xl bg-superficie p-5">
            <h2 className="font-bold">Compra segura</h2>
            <p className="mt-1 text-texto-2">
              Veja a máquina funcionando antes de pagar, confira a nota e o documento e desconfie de preço muito abaixo do mercado. Nunca pague sinal para reservar.
            </p>
          </section>
        </div>
      </div>

      {parecidos.length ? (
        <section className="mt-14" aria-labelledby="parecidos-titulo">
          <h2 id="parecidos-titulo" className="text-2xl font-bold">
            {concordar(a.categoria, 'Outros', 'Outras')} {categoria.toLowerCase()} à venda
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {parecidos.map((p) => (
              <CartaoMaquina key={p.id} anuncio={p} />
            ))}
          </ul>
        </section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([
            {
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: a.titulo,
              description: a.descricao ?? resposta,
              image: a.fotos.map((f) => absoluta(`/api/anuncios/fotos/${f}`)),
              category: rotuloCategoria(a.categoria),
              ...(a.marca ? { brand: { '@type': 'Brand', name: a.marca } } : {}),
              ...(a.modelo ? { model: a.modelo } : {}),
              offers: {
                '@type': 'Offer',
                url: absoluta(`/maquinas-usadas/${a.id}`),
                price: a.preco.toFixed(2),
                priceCurrency: 'BRL',
                itemCondition: 'https://schema.org/UsedCondition',
                availability: vendido ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
                areaServed: `${a.municipio}, ${a.uf}, Brasil`,
              },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Grão Raiz', item: absoluta('/') },
                { '@type': 'ListItem', position: 2, name: 'Máquinas usadas', item: absoluta('/maquinas-usadas') },
                { '@type': 'ListItem', position: 3, name: categoria, item: absoluta(`/maquinas-usadas/categoria/${a.categoria}`) },
                { '@type': 'ListItem', position: 4, name: a.titulo, item: absoluta(`/maquinas-usadas/${a.id}`) },
              ],
            },
          ]),
        }}
      />
    </article>
  );
}

/** Página pública de um anúncio: lida por buscadores e IAs e usada na prévia do link no WhatsApp. */
export default async function AnuncioMaquina({ params }: Props) {
  // Checagem antes do Suspense: anúncio inexistente, pausado ou removido responde 404 de verdade
  // (depois que o streaming começa, o Next só consegue mandar 200 com noindex).
  const { id } = await params;
  if (!(await anuncioPublico(id))) notFound();
  return (
    <Suspense fallback={<p className="mx-auto max-w-6xl px-4 py-14 text-texto-2">Carregando o anúncio…</p>}>
      <Detalhe params={params} />
    </Suspense>
  );
}
