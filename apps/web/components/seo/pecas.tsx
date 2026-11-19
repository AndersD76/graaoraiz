import Link from 'next/link';
import type { ReactNode } from 'react';
import { RESPONSAVEL } from '@/lib/config';
import { absoluta, jsonLd } from '@/lib/seo';

export function JsonLd({ dados }: { dados: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(dados) }} />;
}

/** Trilha visível ("Você está em") + BreadcrumbList no JSON-LD, iguais. */
export function Trilha({ itens }: { itens: { nome: string; caminho: string }[] }) {
  const todos = [{ nome: 'Grão Raiz', caminho: '/' }, ...itens];
  return (
    <>
      <nav aria-label="Você está em" className="text-sm text-texto-2">
        {todos.map((i, n) => (
          <span key={i.caminho}>
            {n > 0 ? ' › ' : ''}
            {n === todos.length - 1 ? (
              <span aria-current="page">{i.nome}</span>
            ) : i.caminho === '/' ? (
              <a href="/" className="hover:underline">
                {i.nome}
              </a>
            ) : (
              <Link href={i.caminho} className="hover:underline">
                {i.nome}
              </Link>
            )}
          </span>
        ))}
      </nav>
      <JsonLd
        dados={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: todos.map((i, n) => ({ '@type': 'ListItem', position: n + 1, name: i.nome, item: absoluta(i.caminho) })),
        }}
      />
    </>
  );
}

const fmtData = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'America/Sao_Paulo' });

/** Quem responde pelo conteúdo e quando foi revisado (visível, como pede o conteúdo útil do Google). */
export function Autoria({ revisadoEm, nota }: { revisadoEm: string; nota?: ReactNode }) {
  return (
    <p className="mt-3 text-sm text-texto-2">
      Por <Link href="/sobre" className="underline-offset-2 hover:underline">{RESPONSAVEL}</Link>, Grão Raiz · Atualizado em{' '}
      <time dateTime={revisadoEm}>{fmtData.format(new Date(revisadoEm.length === 10 ? `${revisadoEm}T12:00:00Z` : revisadoEm))}</time>
      {nota ? <> · {nota}</> : null}
    </p>
  );
}

export function Fontes({ fontes }: { fontes: { nome: string; url: string; acessado_em?: string }[] }) {
  if (!fontes.length) return null;
  return (
    <section aria-labelledby="fontes-titulo" className="mt-12">
      <h2 id="fontes-titulo" className="text-xl font-bold">
        Fontes
      </h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-texto-2">
        {fontes.map((f) => (
          <li key={f.url + f.nome}>
            <a href={f.url} rel="noopener" className="break-words underline-offset-2 hover:underline">
              {f.nome}
            </a>
            {f.acessado_em ? ` (consultado em ${f.acessado_em.split('-').reverse().join('/')})` : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Chamada para o app (o produto): o talhão exato, com aviso no celular. */
export function ChamadaApp({ texto, origem }: { texto: string; origem: string }) {
  return (
    <div className="mt-10 rounded-2xl bg-marca p-6 text-white sm:p-8">
      <p className="text-xl font-bold">{texto}</p>
      <p className="mt-2 text-white/85">Grátis, no navegador do celular. Aviso de geada, temporal e da hora de pulverizar no ponto exato da sua lavoura.</p>
      <a
        href={`/?utm_source=site&utm_medium=referral&utm_campaign=${encodeURIComponent(origem)}`}
        data-cta-produto={origem}
        className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-white px-5 font-semibold text-marca hover:bg-marca-clara"
      >
        Abrir o app grátis
      </a>
    </div>
  );
}

export function Perguntas({ perguntas }: { perguntas: { pergunta: string; resposta: string }[] }) {
  if (!perguntas.length) return null;
  return (
    <section aria-labelledby="faq-titulo" className="mt-12">
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
      <JsonLd
        dados={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: perguntas.map((p) => ({ '@type': 'Question', name: p.pergunta, acceptedAnswer: { '@type': 'Answer', text: p.resposta } })),
        }}
      />
    </section>
  );
}
