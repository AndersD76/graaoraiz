import Link from 'next/link';
import { Marca } from './marca';

const LINKS = [
  { href: '/#como-funciona', rotulo: 'Como funciona' },
  { href: '/#recursos', rotulo: 'Recursos' },
  { href: '/#planos', rotulo: 'Planos' },
  { href: '/#duvidas', rotulo: 'Dúvidas' },
];

export function Cabecalho() {
  return (
    <header className="sticky top-0 z-20 border-b border-linha bg-fundo/95 backdrop-blur supports-[backdrop-filter]:bg-fundo/85">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="-m-1 rounded-lg p-1" aria-label="Grão Raiz — página inicial">
          <Marca />
        </Link>
        <nav aria-label="Seções" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-texto-2 hover:bg-superficie hover:text-texto"
                >
                  {l.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link
          href="/#lista-espera"
          className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-marca px-5 text-sm font-semibold text-white hover:bg-marca-escura"
        >
          Quero usar
        </Link>
      </div>
    </header>
  );
}
