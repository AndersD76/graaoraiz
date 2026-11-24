import { CATEGORIAS_MAQUINA, type CategoriaMaquina, formatarReais, resumoUso } from '@graoraiz/clima';
import Link from 'next/link';
import { cobraComissao, comissaoPercentual } from '@/lib/maquinas';
import { absoluta, jsonLd } from '@/lib/seo';
import { type AnuncioPublico, concordar, PLURAL_CATEGORIA } from '@/lib/vitrine';

/** Cartão de uma máquina na vitrine pública (página lida pelo Google). */
export function CartaoMaquina({ anuncio }: { anuncio: AnuncioPublico }) {
  const uso = resumoUso(anuncio);
  return (
    <li className="overflow-hidden rounded-2xl border border-linha bg-fundo">
      <Link href={`/maquinas-usadas/${anuncio.id}`} className="block hover:bg-superficie">
        {anuncio.foto ? (
          // eslint-disable-next-line @next/next/no-img-element -- a foto vem da API do próprio app, já reduzida
          <img src={`/api/anuncios/fotos/${anuncio.foto}`} alt={anuncio.titulo} width={400} height={300} loading="lazy" className="aspect-[4/3] w-full object-cover" />
        ) : (
          <div className="aspect-[4/3] w-full bg-superficie" aria-hidden="true" />
        )}
        <div className="p-4">
          <p className="text-xl font-extrabold text-marca">{formatarReais(anuncio.preco)}</p>
          <h3 className="mt-1 font-semibold leading-snug">{anuncio.titulo}</h3>
          {uso ? <p className="mt-1 text-sm text-texto-2">{uso}</p> : null}
          <p className="mt-1 text-sm text-texto-2">
            {anuncio.municipio}/{anuncio.uf}
          </p>
        </div>
      </Link>
    </li>
  );
}

/** Links para as páginas de cada categoria (navegação e links internos). */
export function CategoriasMaquinas({ atual }: { atual: CategoriaMaquina | null }) {
  return (
    <nav aria-label="Categorias" className="flex flex-wrap gap-2">
      <Link
        href="/maquinas-usadas"
        className={`rounded-full border px-4 py-2 text-sm font-semibold ${atual === null ? 'border-marca bg-marca text-white' : 'border-linha hover:bg-superficie'}`}
      >
        Todas
      </Link>
      {CATEGORIAS_MAQUINA.map((c) => (
        <Link
          key={c.valor}
          href={`/maquinas-usadas/categoria/${c.valor}`}
          className={`rounded-full border px-4 py-2 text-sm font-semibold ${atual === c.valor ? 'border-marca bg-marca text-white' : 'border-linha hover:bg-superficie'}`}
        >
          {PLURAL_CATEGORIA[c.valor]}
        </Link>
      ))}
    </nav>
  );
}

/** Perguntas visíveis na página (o FAQPage do JSON-LD repete exatamente estas). */
export function perguntasVitrine(): { pergunta: string; resposta: string }[] {
  const pct = comissaoPercentual().toLocaleString('pt-BR');
  const custo = cobraComissao()
    ? `Anunciar é grátis. Se a máquina for vendida para alguém que pediu o contato pelo Grão Raiz, o vendedor paga ${pct}% do valor da venda, por PIX.`
    : 'Nada. Anunciar e vender pelo Grão Raiz é grátis, sem taxa e sem comissão sobre a venda.';
  return [
    { pergunta: 'Quanto custa anunciar uma máquina no Grão Raiz?', resposta: custo },
    { pergunta: 'Como falo com o vendedor?', resposta: 'Abra o anúncio no app e toque em “Chamar no WhatsApp”. É preciso ter conta grátis; o pedido de contato fica registrado.' },
    { pergunta: 'O Grão Raiz garante a máquina?', resposta: 'Não. O Grão Raiz aproxima comprador e vendedor; a negociação, o pagamento e a documentação são entre vocês. Veja a máquina funcionando e confira a nota e o documento antes de pagar.' },
    { pergunta: 'Que máquinas posso anunciar?', resposta: 'Tratores, colheitadeiras, plantadeiras, pulverizadores, implementos e caminhões usados no campo, e equipamentos de armazenagem e recebimento de grãos: silos, secadores, máquinas de pré-limpeza, classificadores, elevadores e transportadores, tombadores, coletores de amostras e balanças. Sempre com fotos reais e preço.' },
  ];
}

export function FaqVitrine() {
  const perguntas = perguntasVitrine();
  return (
    <section aria-labelledby="faq-titulo" className="mt-14">
      <h2 id="faq-titulo" className="text-2xl font-bold">
        Perguntas frequentes
      </h2>
      <dl className="mt-4 divide-y divide-linha rounded-2xl border border-linha">
        {perguntas.map((p) => (
          <div key={p.pergunta} className="p-5">
            <dt className="font-semibold">{p.pergunta}</dt>
            <dd className="mt-2 text-texto-2">{p.resposta}</dd>
          </div>
        ))}
      </dl>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: perguntas.map((p) => ({ '@type': 'Question', name: p.pergunta, acceptedAnswer: { '@type': 'Answer', text: p.resposta } })),
          }),
        }}
      />
    </section>
  );
}

/** Corpo de uma página de vitrine (todas ou uma categoria). */
export function PaginaVitrine({ titulo, abertura, anuncios, categoria }: { titulo: string; abertura: string; anuncios: AnuncioPublico[]; categoria: CategoriaMaquina | null }) {
  const caminho = categoria ? [{ nome: 'Máquinas usadas', url: '/maquinas-usadas' }, { nome: PLURAL_CATEGORIA[categoria], url: `/maquinas-usadas/categoria/${categoria}` }] : [{ nome: 'Máquinas usadas', url: '/maquinas-usadas' }];
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <nav aria-label="Você está em" className="text-sm text-texto-2">
        <a href="/" className="hover:underline">
          Grão Raiz
        </a>
        {caminho.map((c) => (
          <span key={c.url}>
            {' › '}
            <Link href={c.url} className="hover:underline">
              {c.nome}
            </Link>
          </span>
        ))}
      </nav>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{titulo}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-texto-2">{abertura}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        {/* <a> e não <Link>: o app web é um arquivo estático, não uma página do Next. */}
        <a href="/anunciar" className="inline-flex min-h-12 items-center rounded-full bg-marca px-6 font-semibold text-white hover:bg-marca-escura">
          Anunciar minha máquina grátis
        </a>
        <a href="/maquinas" className="inline-flex min-h-12 items-center rounded-full border border-campo px-6 font-semibold hover:bg-superficie">
          Abrir no app
        </a>
      </div>

      <div className="mt-8">
        <CategoriasMaquinas atual={categoria} />
      </div>

      {anuncios.length ? (
        <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {anuncios.map((a) => (
            <CartaoMaquina key={a.id} anuncio={a} />
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded-2xl bg-superficie p-6 text-lg">
          Ainda não há {categoria ? `${PLURAL_CATEGORIA[categoria].toLowerCase()} ${concordar(categoria, 'anunciados', 'anunciadas')}` : 'máquinas anunciadas'}. Anuncie a sua: é grátis e o anúncio aparece aqui para quem procura.
        </p>
      )}

      <FaqVitrine />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [{ nome: 'Grão Raiz', url: '/' }, ...caminho].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.nome, item: absoluta(c.url) })),
          }),
        }}
      />
    </section>
  );
}
