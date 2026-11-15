import type { ReactNode } from 'react';
import { MenuLateral } from '@/components/admin/menu';
import { Topo } from '@/components/admin/topo';

/**
 * Moldura das telas do painel. A sessão não é lida aqui no topo (isso seguraria a página inteira):
 * cada tela confere o administrador dentro do próprio Suspense, e cada ação confere de novo no servidor.
 */
export default function LayoutPainel({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <MenuLateral />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topo />
        <main id="conteudo" className="flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
