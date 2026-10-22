import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Página não encontrada',
  robots: { index: false },
};

export default function NaoEncontrada() {
  return (
    <section className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-marca">Erro 404</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Página não encontrada</h1>
      <p className="mt-4 text-lg text-texto-2">O endereço pode estar errado ou a página mudou de lugar.</p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-marca px-6 font-semibold text-white hover:bg-marca-escura"
      >
        Ir para a página inicial
      </Link>
    </section>
  );
}
