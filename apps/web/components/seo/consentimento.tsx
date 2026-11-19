'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

/** ID do GA4 (G-XXXX). Sem ele não há terceiro coletando dado: nem GA4, nem aviso de cookies. */
const GA4 = process.env.NEXT_PUBLIC_GA4_ID ?? '';
const CHAVE = 'graoraiz:consentimento';

interface Escolha {
  estatistica: boolean;
  marketing: boolean;
  em: string;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function lerEscolha(): Escolha | null {
  try {
    const v = localStorage.getItem(CHAVE);
    return v ? (JSON.parse(v) as Escolha) : null;
  } catch {
    return null;
  }
}

function aplicar(e: Escolha): void {
  window.gtag?.('consent', 'update', {
    analytics_storage: e.estatistica ? 'granted' : 'denied',
    ad_storage: e.marketing ? 'granted' : 'denied',
    ad_user_data: e.marketing ? 'granted' : 'denied',
    ad_personalization: e.marketing ? 'granted' : 'denied',
  });
}

/** Carrega o gtag com o Consent Mode v2 já negado por padrão (nada é gravado antes da escolha). */
function carregarGtag(): void {
  if (window.gtag) return;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params -- o gtag exige o objeto arguments
    window.dataLayer!.push(arguments);
  };
  window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 });
  window.gtag('js', new Date());
  window.gtag('config', GA4, { anonymize_ip: true });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4)}`;
  document.head.appendChild(s);
}

const EVENTO = 'graoraiz:consentimento-mudou';

function assinar(aviso: () => void): () => void {
  window.addEventListener(EVENTO, aviso);
  window.addEventListener('storage', aviso);
  return () => {
    window.removeEventListener(EVENTO, aviso);
    window.removeEventListener('storage', aviso);
  };
}

/** Já escolheu? No servidor (e antes de hidratar) responde "sim", para o aviso não piscar. */
function useJaEscolheu(): boolean {
  return useSyncExternalStore(assinar, () => lerEscolha() !== null, () => true);
}

/** Aviso de cookies discreto (não bloqueia a leitura), com escolha separada de estatística e marketing. */
export function Consentimento() {
  const jaEscolheu = useJaEscolheu();
  const [reaberto, setReaberto] = useState(false);
  const [detalhes, setDetalhes] = useState(false);
  const [estatistica, setEstatistica] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!GA4) return;
    carregarGtag();
    const e = lerEscolha();
    if (e) aplicar(e);
    const reabrir = () => setReaberto(true);
    window.addEventListener('graoraiz:preferencias-cookies', reabrir);
    return () => window.removeEventListener('graoraiz:preferencias-cookies', reabrir);
  }, []);

  if (!GA4 || (jaEscolheu && !reaberto)) return null;

  const salvar = (e: Omit<Escolha, 'em'>) => {
    const escolha = { ...e, em: new Date().toISOString() };
    try {
      localStorage.setItem(CHAVE, JSON.stringify(escolha));
    } catch {
      // sem armazenamento: vale só para esta visita
    }
    aplicar(escolha);
    setReaberto(false);
    window.dispatchEvent(new Event(EVENTO));
  };

  return (
    <div role="region" aria-label="Preferências de cookies" className="fixed inset-x-0 bottom-0 z-40 border-t border-linha bg-fundo p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-texto-2">
          Usamos o Google Analytics, com a sua permissão, para entender quais páginas ajudam o produtor. <a href="/privacidade" className="underline">Saiba mais</a>.
        </p>
        {detalhes ? (
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={estatistica} onChange={(e) => setEstatistica(e.target.checked)} className="size-4" /> Estatísticas de uso
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="size-4" /> Marketing (anúncios)
            </label>
            <button type="button" onClick={() => salvar({ estatistica, marketing })} className="min-h-10 rounded-xl bg-marca px-4 font-semibold text-white">
              Salvar escolha
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => salvar({ estatistica: false, marketing: false })} className="min-h-10 rounded-xl border border-linha px-4 font-semibold">
              Recusar
            </button>
            <button type="button" onClick={() => setDetalhes(true)} className="min-h-10 rounded-xl border border-linha px-4 font-semibold">
              Escolher
            </button>
            <button type="button" onClick={() => salvar({ estatistica: true, marketing: false })} className="min-h-10 rounded-xl bg-marca px-4 font-semibold text-white">
              Aceitar estatísticas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
