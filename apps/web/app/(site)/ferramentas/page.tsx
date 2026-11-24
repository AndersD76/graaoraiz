import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Autoria, Trilha } from '@/components/seo/pecas';
import { metadadosPagina } from '@/lib/metadados';
import { slugsDoGlossario } from '@/lib/seo/paginas';

export const metadata: Metadata = metadadosPagina({
  titulo: 'Ferramentas grátis para o produtor de grãos',
  tituloAbsoluto: true,
  descricao: 'Calculadora de delta T, previsão da hora de pulverizar por município e glossário agrícola com fontes. Tudo grátis e sem cadastro.',
  caminho: '/ferramentas',
});

const FERRAMENTAS = [
  { href: '/ferramentas/delta-t', titulo: 'Calculadora de delta T', texto: 'Temperatura e umidade do ar viram delta T na hora, com a faixa boa para aplicar e a tabela pronta.' },
  { href: '/hora-de-pulverizar', titulo: 'Hora de pulverizar por município', texto: 'As janelas de hoje e da semana, hora a hora, para os municípios produtores de grãos.' },
  { href: '/glossario', titulo: 'Glossário agrícola', texto: 'Termos de clima, aplicação, regras ambientais e máquinas explicados com exemplo e fonte.' },
  { href: '/maquinas-usadas', titulo: 'Classificados de máquinas usadas', texto: 'Anuncie ou encontre tratores, colheitadeiras, implementos, silos e secadores. Grátis, sem taxa e sem comissão.' },
];

async function Lista() {
  const temGlossario = (await slugsDoGlossario()).length > 0;
  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2">
      {FERRAMENTAS.filter((f) => temGlossario || f.href !== '/glossario').map((f) => (
        <li key={f.href}>
          <Link href={f.href} className="block h-full rounded-2xl border border-linha p-5 hover:bg-superficie">
            <span className="text-lg font-bold">{f.titulo}</span>
            <span className="mt-1 block text-texto-2">{f.texto}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Ferramentas() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <Trilha itens={[{ nome: 'Ferramentas', caminho: '/ferramentas' }]} />
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Ferramentas grátis para o produtor de grãos</h1>
      <p className="mt-4 text-lg leading-relaxed">
        Ferramentas do Grão Raiz que funcionam direto no navegador, sem cadastro: calcule o delta T, veja a hora de pulverizar no seu município, consulte o glossário
        e anuncie máquinas usadas sem pagar nada.
      </p>
      <Autoria revisadoEm="2026-11-18" />
      <Suspense fallback={<p className="mt-8 text-texto-2">Carregando…</p>}>
        <Lista />
      </Suspense>
    </article>
  );
}
