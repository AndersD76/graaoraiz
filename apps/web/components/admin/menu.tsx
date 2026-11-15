'use client';

import { Funnel, HandCoins, LayoutDashboard, Menu, MessageCircle, Settings, Sprout, Star, Tractor, Users, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense, useState } from 'react';

const SECOES = [
  {
    titulo: 'Principal',
    itens: [
      { rotulo: 'Dashboard', href: '/admin', icone: LayoutDashboard },
      { rotulo: 'Usuários', href: '/admin/usuarios', icone: Users },
      { rotulo: 'Anúncios', href: '/admin/anuncios', icone: Tractor },
      { rotulo: 'Vendas e comissões', href: '/admin/vendas', icone: HandCoins },
    ],
  },
  {
    titulo: 'Operações',
    itens: [
      { rotulo: 'Pedidos de contato', href: '/admin/contatos', icone: MessageCircle },
      { rotulo: 'Funil', href: '/admin/funil', icone: Funnel },
      { rotulo: 'Avaliações', href: '/admin/avaliacoes', icone: Star },
    ],
  },
  {
    titulo: 'Gestão',
    itens: [{ rotulo: 'Configurações', href: '/admin/configuracoes', icone: Settings }],
  },
];

function ativo(caminho: string, href: string): boolean {
  return href === '/admin' ? caminho === '/admin' : caminho === href || caminho.startsWith(`${href}/`);
}

function Lista({ caminho, aoEscolher }: { caminho: string; aoEscolher?: () => void }) {
  return (
    <nav aria-label="Painel" className="flex flex-col gap-5 px-3 py-4">
      {SECOES.map((s) => (
        <div key={s.titulo} className="flex flex-col gap-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-adm-texto-2">{s.titulo}</p>
          {s.itens.map(({ rotulo, href, icone: Icone }) => {
            const marcado = ativo(caminho, href);
            return (
              <Link
                key={href}
                href={href}
                onClick={aoEscolher}
                aria-current={marcado ? 'page' : undefined}
                className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                  marcado ? 'bg-adm-marca text-adm-sobre-marca' : 'text-adm-texto-2 hover:bg-adm-fundo hover:text-adm-texto'
                }`}
              >
                <Icone className="size-5" aria-hidden />
                {rotulo}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function Marca() {
  return (
    <Link href="/admin" className="flex h-16 items-center gap-2.5 border-b border-adm-linha px-6">
      <span className="rounded-lg bg-adm-marca p-1.5 text-adm-sobre-marca">
        <Sprout className="size-5" aria-hidden />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-bold">Grão Raiz</span>
        <span className="text-xs text-adm-texto-2">Painel de controle</span>
      </span>
    </Link>
  );
}

function ListaComCaminho({ aoEscolher }: { aoEscolher?: () => void }) {
  return <Lista caminho={usePathname()} aoEscolher={aoEscolher} />;
}

/** O endereço atual só existe na hora do pedido: enquanto isso, o menu aparece sem o item marcado. */
function Navegacao({ aoEscolher }: { aoEscolher?: () => void }) {
  return (
    <Suspense fallback={<Lista caminho="" aoEscolher={aoEscolher} />}>
      <ListaComCaminho aoEscolher={aoEscolher} />
    </Suspense>
  );
}

/** Menu fixo à esquerda no computador. */
export function MenuLateral() {
  return (
    // A coluna ocupa a altura toda (fundo contínuo); o menu dentro dela fica fixo ao rolar.
    <div className="hidden w-64 shrink-0 border-r border-adm-linha bg-adm-cartao md:block">
      <aside className="sticky top-0 flex h-dvh flex-col overflow-y-auto">
        <Marca />
        <Navegacao />
      </aside>
    </div>
  );
}

/** No celular: botão no topo que abre o mesmo menu numa gaveta. */
export function MenuMovel() {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Abrir o menu"
        aria-expanded={aberto}
        className="inline-flex size-10 items-center justify-center rounded-lg border border-adm-linha md:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>
      {aberto ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu do painel">
          <button type="button" aria-label="Fechar o menu" className="absolute inset-0 bg-black/50" onClick={() => setAberto(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-adm-cartao shadow-xl">
            <div className="flex items-center justify-between pr-3">
              <Marca />
              <button type="button" onClick={() => setAberto(false)} aria-label="Fechar o menu" className="inline-flex size-10 items-center justify-center rounded-lg">
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <Navegacao aoEscolher={() => setAberto(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
