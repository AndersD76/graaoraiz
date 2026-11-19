import type { ReactNode } from 'react';
import { Cabecalho } from '@/components/cabecalho';
import { Rodape } from '@/components/rodape';
import { Consentimento } from '@/components/seo/consentimento';

// De onde o visitante veio (UTM, site de origem, página de entrada): grava na mesma chave que o app web lê
// no cadastro (apps/mobile/src/lib/atribuicao.ts). Só no próprio navegador; vai ao servidor só se a pessoa criar conta.
const TOQUE = `(function(){try{var p=new URLSearchParams(location.search),t={landing:(location.pathname+location.search).slice(0,300),em:new Date().toISOString()},u=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'],m=false;u.forEach(function(k){var v=p.get(k);if(v){t[k]=v.slice(0,150);m=true}});if(document.referrer&&new URL(document.referrer).host!==location.host){t.referrer=document.referrer.slice(0,300);m=true}if(!localStorage.getItem('graoraiz:primeiro-toque'))localStorage.setItem('graoraiz:primeiro-toque',JSON.stringify(t));if(m)localStorage.setItem('graoraiz:ultimo-toque',JSON.stringify(t))}catch(e){}})();`;

/** Moldura das páginas públicas: cabeçalho, conteúdo e rodapé. */
export function MolduraSite({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
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
      <Consentimento />
      <script dangerouslySetInnerHTML={{ __html: TOQUE }} />
    </div>
  );
}
