'use client';

import { useEffect } from 'react';

/** Propriedades obrigatórias dos eventos de conteúdo (taxonomia objeto_ação). */
export interface ContextoPagina {
  page_type: string;
  cluster: string;
  consulta_alvo: string;
  isca_id: string | null;
}

function sessao(): string {
  try {
    let s = localStorage.getItem('graoraiz:sessao');
    if (!s) {
      s = crypto.randomUUID();
      localStorage.setItem('graoraiz:sessao', s);
    }
    return s;
  } catch {
    return 'sem-armazenamento';
  }
}

/** Manda um evento para a telemetria própria (app.evento). Nunca atrapalha a página se falhar. */
export function enviarEvento(nome: string, contexto: ContextoPagina, extra: Record<string, string | number | boolean | null> = {}): void {
  try {
    const corpo = JSON.stringify({ nome, sessao: sessao(), pagina: location.pathname.slice(0, 300), propriedades: { ...contexto, ...extra } });
    const ok = navigator.sendBeacon?.('/api/eventos', new Blob([corpo], { type: 'application/json' }));
    if (!ok) void fetch('/api/eventos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: corpo, keepalive: true }).catch(() => {});
  } catch {
    // telemetria nunca derruba a página
  }
}

/** Visita da página (com canal: busca, IA, social...) e isca vista quando ela aparece na tela. */
export function Rastreio({ contexto }: { contexto: ContextoPagina }) {
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    enviarEvento('pagina_vista', contexto, {
      referrer: document.referrer && new URL(document.referrer).host !== location.host ? document.referrer.slice(0, 200) : null,
      utm_source: p.get('utm_source')?.slice(0, 60) ?? null,
      utm_medium: p.get('utm_medium')?.slice(0, 60) ?? null,
    });
    const iscas = document.querySelectorAll('[data-isca]');
    if (!iscas.length || !('IntersectionObserver' in window)) return;
    let vista = false;
    const obs = new IntersectionObserver((itens) => {
      if (vista || !itens.some((i) => i.isIntersecting)) return;
      vista = true;
      enviarEvento('isca_vista', contexto);
      obs.disconnect();
    });
    iscas.forEach((el) => obs.observe(el));
    // Clique em qualquer chamada para o app.
    const aoClicar = (e: MouseEvent) => {
      const alvo = (e.target as HTMLElement | null)?.closest('[data-cta-produto]');
      if (alvo) enviarEvento('cta_produto_clicado', contexto, { destino: alvo.getAttribute('data-cta-produto') });
    };
    document.addEventListener('click', aoClicar);
    return () => {
      obs.disconnect();
      document.removeEventListener('click', aoClicar);
    };
  }, [contexto]);
  return null;
}
