import { Marca } from './marca';

// <a> e não <Link>: a raiz é o app web (arquivo estático), não uma página do Next.
export function Cabecalho() {
  return (
    <header className="sticky top-0 z-20 border-b border-linha bg-fundo/95 backdrop-blur supports-[backdrop-filter]:bg-fundo/85">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <a href="/" className="-m-1 rounded-lg p-1" aria-label="Grão Raiz — abrir o app">
          <Marca />
        </a>
        <a
          href="/"
          className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-marca px-5 text-sm font-semibold text-white hover:bg-marca-escura"
        >
          Abrir o app
        </a>
      </div>
    </header>
  );
}
