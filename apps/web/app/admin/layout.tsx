import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SCRIPT_TEMA } from '@/components/admin/tema-script';

export const metadata: Metadata = {
  title: { default: 'Painel', template: '%s | Painel Grão Raiz' },
  robots: { index: false, follow: false },
};

/** Raiz do painel: tema próprio (claro ou escuro), fora da moldura do site público. */
export default function LayoutAdmin({ children }: { children: ReactNode }) {
  return (
    // O script ao lado aplica o tema escolhido antes de pintar; por isso o atributo pode diferir do HTML do servidor.
    <div id="admin" className="admin min-h-dvh" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      {children}
    </div>
  );
}
