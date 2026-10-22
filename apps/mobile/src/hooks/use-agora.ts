import { isoLocal } from '@graoraiz/clima';
import { useSyncExternalStore } from 'react';
import { AppState, type NativeEventSubscription } from 'react-native';

/**
 * Relógio compartilhado: hora local ("2026-10-22T14:35") que muda a cada minuto e ao voltar para o app.
 * Nunca chame new Date() durante a renderização: o React Compiler guarda o valor e a tela congela
 * no dia em que foi aberta (o acumulado de chuva e o semáforo deixam de virar à meia-noite).
 */
let agora = isoLocal(new Date());
const ouvintes = new Set<() => void>();
let relogio: ReturnType<typeof setInterval> | null = null;
let voltaAoApp: NativeEventSubscription | null = null;

function conferir(): void {
  const novo = isoLocal(new Date());
  if (novo === agora) return;
  agora = novo;
  ouvintes.forEach((ouvinte) => ouvinte());
}

function assinar(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  if (!relogio) {
    relogio = setInterval(conferir, 20_000);
    voltaAoApp = AppState.addEventListener('change', (estado) => estado === 'active' && conferir());
  }
  conferir();
  return () => {
    ouvintes.delete(ouvinte);
    if (ouvintes.size === 0 && relogio) {
      clearInterval(relogio);
      relogio = null;
      voltaAoApp?.remove();
      voltaAoApp = null;
    }
  };
}

function obter(): string {
  return agora;
}

export function useAgora(): string {
  return useSyncExternalStore(assinar, obter, obter);
}
