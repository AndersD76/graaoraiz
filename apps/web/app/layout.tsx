import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Cabecalho } from '@/components/cabecalho';
import { Rodape } from '@/components/rodape';
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
  colorScheme: 'light',
};

// De onde o visitante veio (UTM, site de origem, página de entrada): grava na mesma chave que o app web lê
// no cadastro (apps/mobile/src/lib/atribuicao.ts). Só no próprio navegador; vai ao servidor só se a pessoa criar conta.
const TOQUE = `(function(){try{var p=new URLSearchParams(location.search),t={landing:(location.pathname+location.search).slice(0,300),em:new Date().toISOString()},u=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'],m=false;u.forEach(function(k){var v=p.get(k);if(v){t[k]=v.slice(0,150);m=true}});if(document.referrer&&new URL(document.referrer).host!==location.host){t.referrer=document.referrer.slice(0,300);m=true}if(!localStorage.getItem('graoraiz:primeiro-toque'))localStorage.setItem('graoraiz:primeiro-toque',JSON.stringify(t));if(m)localStorage.setItem('graoraiz:ultimo-toque',JSON.stringify(t))}catch(e){}})();`;

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
        <script dangerouslySetInnerHTML={{ __html: TOQUE }} />
      </body>
    </html>
  );
}
