import Link from 'next/link';
import { cacheLife } from 'next/cache';
import { ATRIBUICAO_OPEN_METEO } from '@graoraiz/clima';
import { CONTATO_EMAIL } from '@/lib/config';
import { Marca } from './marca';

/** Ano atual em cache (Cache Components não permite ler o relógio direto durante o pré-render). */
async function anoAtual(): Promise<number> {
  'use cache';
  cacheLife('days');
  return new Date().getFullYear();
}

const classeLink = 'inline-flex min-h-11 items-center text-texto-2 underline-offset-2 hover:text-texto hover:underline';

export async function Rodape() {
  const ano = await anoAtual();
  return (
    <footer className="border-t border-linha bg-superficie">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Marca />
            <p className="mt-3 text-sm leading-relaxed text-texto-2">
              Condições do tempo por talhão para pulverizar, colher e entrar com máquina.
            </p>
          </div>
          <nav aria-label="Links do rodapé">
            <ul className="grid gap-x-8 text-sm sm:grid-cols-2">
              <li>
                <Link href="/privacidade" className={classeLink}>
                  Privacidade
                </Link>
              </li>
              <li>
                <Link href="/termos" className={classeLink}>
                  Termos de uso
                </Link>
              </li>
              <li>
                <Link href="/excluir-dados" className={classeLink}>
                  Excluir dados
                </Link>
              </li>
              <li>
                <a href={`mailto:${CONTATO_EMAIL}`} className={`${classeLink} break-all`}>
                  {CONTATO_EMAIL}
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <div className="mt-8 flex flex-col gap-1 border-t border-linha pt-6 text-sm text-texto-2 sm:flex-row sm:justify-between">
          <p>
            <a href="https://open-meteo.com/" className="underline-offset-2 hover:text-texto hover:underline" rel="noopener">
              {ATRIBUICAO_OPEN_METEO}
            </a>
          </p>
          <p>© {ano} Grão Raiz</p>
        </div>
      </div>
    </footer>
  );
}
