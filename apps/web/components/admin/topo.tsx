import { Bell, ExternalLink, LogOut, Search } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { sair } from '@/app/admin/acoes';
import { adminAtual } from '@/lib/admin/auth';
import { pendencias } from '@/lib/admin/consultas';
import { MenuMovel } from './menu';
import { BotaoTema } from './tema';
import { fmtNumero } from './ui';

const menuFlutuante = 'absolute right-0 z-40 mt-2 w-72 rounded-xl border border-adm-linha bg-adm-cartao p-2 shadow-xl';
const botaoTopo = 'inline-flex size-10 cursor-pointer list-none items-center justify-center rounded-lg border border-adm-linha hover:bg-adm-fundo [&::-webkit-details-marker]:hidden';

/** Sino: o que pede atenção (comissões a receber, avaliações e anúncios recentes). */
async function Pendencias() {
  if (!(await adminAtual())) return null;
  const p = await pendencias();
  const itens = [
    { n: p.comissoes, texto: p.comissoes === 1 ? 'comissão a receber' : 'comissões a receber', href: '/admin/vendas' },
    { n: p.contatos, texto: 'pedidos de contato nas últimas 24 h', href: '/admin/contatos' },
    { n: p.anuncios, texto: 'anúncios novos nas últimas 24 h', href: '/admin/anuncios' },
    { n: p.avaliacoes, texto: 'avaliações nos últimos 7 dias', href: '/admin/avaliacoes' },
  ];
  const total = p.comissoes + p.contatos + p.anuncios + p.avaliacoes;
  return (
    <details className="relative">
      <summary className={botaoTopo} aria-label={`Pendências: ${total}`}>
        <Bell className="size-5" aria-hidden />
        {total > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-adm-ruim px-1 text-center text-[11px] font-bold leading-5 text-white">{total > 99 ? '99+' : total}</span>
        ) : null}
      </summary>
      <div className={menuFlutuante}>
        <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-adm-texto-2">Pendências</p>
        <ul>
          {itens.map((i) => (
            <li key={i.href}>
              <Link href={i.href} className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-adm-fundo">
                <span className="min-w-7 rounded-md bg-adm-marca-suave px-1.5 text-center font-bold tabular-nums text-adm-marca">{fmtNumero.format(i.n)}</span>
                {i.texto}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

async function Usuario() {
  const admin = await adminAtual();
  if (!admin) return null;
  const iniciais = admin.nome
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <details className="relative">
      <summary className={`${botaoTopo} size-auto gap-2 px-2`} aria-label={`Conta: ${admin.nome}`}>
        <span className="flex size-7 items-center justify-center rounded-full bg-adm-marca text-xs font-bold text-adm-sobre-marca">{iniciais}</span>
        <span className="hidden max-w-32 truncate text-sm font-medium lg:block">{admin.nome}</span>
      </summary>
      <div className={menuFlutuante}>
        <div className="border-b border-adm-linha px-2 pb-2">
          <p className="truncate font-semibold">{admin.nome}</p>
          <p className="truncate text-sm text-adm-texto-2">{admin.email}</p>
        </div>
        <a href="/" className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-adm-fundo" target="_blank" rel="noopener">
          <ExternalLink className="size-4" aria-hidden /> Abrir o app
        </a>
        <form action={sair}>
          <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-adm-ruim hover:bg-adm-ruim-suave">
            <LogOut className="size-4" aria-hidden /> Sair
          </button>
        </form>
      </div>
    </details>
  );
}

/** Barra do topo: menu (celular), busca geral, pendências, tema e conta. */
export function Topo() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-adm-linha bg-adm-cartao/95 px-4 backdrop-blur md:px-6">
      <MenuMovel />
      <form action="/admin/busca" method="get" role="search" className="relative flex-1 md:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-adm-texto-2" aria-hidden />
        <label htmlFor="busca-geral" className="sr-only">
          Buscar contas e anúncios
        </label>
        <input
          id="busca-geral"
          name="q"
          placeholder="Buscar contas e anúncios…"
          className="min-h-10 w-full rounded-lg border border-adm-linha bg-adm-fundo pl-9 pr-3 text-sm placeholder:text-adm-texto-2"
        />
      </form>
      <div className="ml-auto flex items-center gap-2">
        <Suspense fallback={<span className="size-10" />}>
          <Pendencias />
        </Suspense>
        <BotaoTema />
        <Suspense fallback={<span className="size-10" />}>
          <Usuario />
        </Suspense>
      </div>
    </header>
  );
}
