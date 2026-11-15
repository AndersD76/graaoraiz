'use client';

import { SunMoon } from 'lucide-react';

import { CHAVE_TEMA } from './tema-script';

function escuroAgora(raiz: HTMLElement): boolean {
  const escolhido = raiz.getAttribute('data-tema');
  if (escolhido) return escolhido === 'escuro';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Alterna claro e escuro e lembra a escolha neste navegador. */
export function BotaoTema() {
  return (
    <button
      type="button"
      aria-label="Alternar tema claro e escuro"
      title="Tema claro ou escuro"
      onClick={() => {
        const raiz = document.getElementById('admin');
        if (!raiz) return;
        const novo = escuroAgora(raiz) ? 'claro' : 'escuro';
        raiz.setAttribute('data-tema', novo);
        try {
          localStorage.setItem(CHAVE_TEMA, novo);
        } catch {}
      }}
      className="inline-flex size-10 items-center justify-center rounded-lg border border-adm-linha hover:bg-adm-fundo"
    >
      <SunMoon className="size-5" aria-hidden />
    </button>
  );
}
