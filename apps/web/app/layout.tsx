import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { NOME_APP, SITE_URL } from '@/lib/config';

const DESCRICAO =
  'Hora de pulverizar, risco de geada e temporal, satélite, chuva, preço do dia e EUDR e crédito rural, por talhão e não por cidade.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${NOME_APP} — o vigia da sua lavoura`,
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
    title: `${NOME_APP} — o vigia da sua lavoura`,
    description: DESCRICAO,
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1F6B2E',
};

/** Raiz comum: o site público ((site)/layout.tsx) e o painel (admin/layout.tsx) montam cada um a sua moldura. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
