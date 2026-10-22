import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Cabecalho } from '@/components/cabecalho';
import { Rodape } from '@/components/rodape';
import { NOME_APP, SITE_URL } from '@/lib/config';

const DESCRICAO =
  'Semáforo de pulverização com o melhor horário, janela de tempo seco para colher, pluviômetro e avisos de geada e temporal — por talhão, não por cidade.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${NOME_APP} — o tempo certo para agir no seu talhão`,
    template: `%s | ${NOME_APP}`,
  },
  description: DESCRICAO,
  applicationName: NOME_APP,
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: NOME_APP,
    url: '/',
    title: `${NOME_APP} — o tempo certo para agir no seu talhão`,
    description: DESCRICAO,
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1F6B2E',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-marca focus:px-4 focus:py-3 focus:font-semibold focus:text-white"
        >
          Pular para o conteúdo
        </a>
        <Cabecalho />
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <Rodape />
      </body>
    </html>
  );
}
