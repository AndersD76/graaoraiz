import {
  type EventoSafra,
  LIMIARES_PULVERIZACAO_PADRAO,
  type LimiaresPulverizacao,
  PREFERENCIAS_AVISOS_PADRAO,
  type PreferenciasAvisos,
} from '@graoraiz/clima';
import { useSyncExternalStore } from 'react';

import { apagar, chaves, gravar, ler } from '@/lib/armazenamento';
import { PERMITE_SIMULAR_PRO } from '@/lib/config';

export type Cultura = 'soja' | 'milho' | 'trigo' | 'feijao' | 'cafe' | 'outra';

export const CULTURAS: { valor: Cultura; rotulo: string }[] = [
  { valor: 'soja', rotulo: 'Soja' },
  { valor: 'milho', rotulo: 'Milho' },
  { valor: 'trigo', rotulo: 'Trigo' },
  { valor: 'feijao', rotulo: 'Feijão' },
  { valor: 'cafe', rotulo: 'Café' },
  { valor: 'outra', rotulo: 'Outra' },
];

export interface Talhao {
  id: string;
  nome: string;
  lat: number;
  lon: number;
  cultura: Cultura | null;
  /** "2026-10-05" ou null. */
  dataPlantio: string | null;
  criadoEm: string;
}

export interface AnotacaoChuva {
  talhaoId: string;
  data: string;
  mm: number;
}

export interface EventoRegistrado extends EventoSafra {
  id: string;
  talhaoId: string;
}

export interface AvisoAgendado {
  id: string;
  quando: string;
}

export interface Estado {
  versao: 1;
  talhoes: Talhao[];
  talhaoSelecionado: string | null;
  chuvas: AnotacaoChuva[];
  eventos: EventoRegistrado[];
  preferencias: PreferenciasAvisos;
  limiares: LimiaresPulverizacao;
  avisosAgendados: AvisoAgendado[];
  /** Ids de avisos que já passaram do horário: nunca reagendar. */
  avisosEntregues: string[];
  /** Assinatura ativa (vem da loja via RevenueCat). */
  pro: boolean;
  /** Só em desenvolvimento: libera o Pro para testar sem loja. */
  proSimulado: boolean;
}

const CHAVE = 'graoraiz:estado:v1';
export const LIMITE_TALHOES_GRATIS = 1;

function inicial(): Estado {
  return {
    versao: 1,
    talhoes: [],
    talhaoSelecionado: null,
    chuvas: [],
    eventos: [],
    preferencias: PREFERENCIAS_AVISOS_PADRAO,
    limiares: LIMIARES_PULVERIZACAO_PADRAO,
    avisosAgendados: [],
    avisosEntregues: [],
    pro: false,
    proSimulado: false,
  };
}

function carregar(): Estado {
  const salvo = ler<Partial<Estado>>(CHAVE);
  // Campos novos entram com o padrão; o que o usuário salvou prevalece.
  return salvo ? { ...inicial(), ...salvo, versao: 1 } : inicial();
}

let estado: Estado = carregar();
const ouvintes = new Set<() => void>();

export function obterEstado(): Estado {
  return estado;
}

export function atualizar(alterar: (atual: Estado) => Estado): void {
  estado = alterar(estado);
  gravar(CHAVE, estado);
  ouvintes.forEach((ouvinte) => ouvinte());
}

function assinar(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

/** Estado inteiro; a referência só muda quando algo é alterado. */
export function useEstado(): Estado {
  return useSyncExternalStore(assinar, obterEstado, obterEstado);
}

export function temPro(e: Estado): boolean {
  return e.pro || (PERMITE_SIMULAR_PRO && e.proSimulado);
}

export function usePro(): boolean {
  return temPro(useEstado());
}

/** Talhões em uso: todos no Pro; no grátis, só os mais antigos até o limite (o resto fica bloqueado). */
export function talhoesLiberados(e: Estado): Talhao[] {
  if (temPro(e)) return e.talhoes;
  return [...e.talhoes].sort((a, b) => a.criadoEm.localeCompare(b.criadoEm)).slice(0, LIMITE_TALHOES_GRATIS);
}

export function talhaoAtual(e: Estado): Talhao | null {
  const liberados = talhoesLiberados(e);
  return liberados.find((t) => t.id === e.talhaoSelecionado) ?? liberados[0] ?? null;
}

export function novoId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

// Ações -----------------------------------------------------------------

export function salvarTalhao(talhao: Omit<Talhao, 'id' | 'criadoEm'> & { id?: string }): Talhao {
  const existente = talhao.id ? estado.talhoes.find((t) => t.id === talhao.id) : undefined;
  const salvo: Talhao = {
    ...talhao,
    id: existente?.id ?? novoId(),
    criadoEm: existente?.criadoEm ?? new Date().toISOString(),
  };
  atualizar((e) => ({
    ...e,
    talhoes: existente ? e.talhoes.map((t) => (t.id === salvo.id ? salvo : t)) : [...e.talhoes, salvo],
    talhaoSelecionado: e.talhaoSelecionado ?? salvo.id,
  }));
  return salvo;
}

export function removerTalhao(id: string): void {
  atualizar((e) => {
    const talhoes = e.talhoes.filter((t) => t.id !== id);
    return {
      ...e,
      talhoes,
      chuvas: e.chuvas.filter((c) => c.talhaoId !== id),
      eventos: e.eventos.filter((ev) => ev.talhaoId !== id),
      talhaoSelecionado: e.talhaoSelecionado === id ? (talhoes[0]?.id ?? null) : e.talhaoSelecionado,
    };
  });
}

export function selecionarTalhao(id: string): void {
  atualizar((e) => ({ ...e, talhaoSelecionado: id }));
}

/** Anota (ou corrige) a chuva de um dia; mm null apaga a anotação. */
export function anotarChuva(talhaoId: string, data: string, mm: number | null): void {
  atualizar((e) => {
    const outras = e.chuvas.filter((c) => !(c.talhaoId === talhaoId && c.data === data));
    return { ...e, chuvas: mm === null ? outras : [...outras, { talhaoId, data, mm }] };
  });
}

export function registrarEvento(evento: Omit<EventoRegistrado, 'id'>): void {
  atualizar((e) => ({ ...e, eventos: [...e.eventos, { ...evento, id: novoId() }] }));
}

export function removerEvento(id: string): void {
  atualizar((e) => ({ ...e, eventos: e.eventos.filter((ev) => ev.id !== id) }));
}

export function salvarPreferencias(preferencias: PreferenciasAvisos): void {
  atualizar((e) => ({ ...e, preferencias }));
}

export function salvarLimiares(limiares: LimiaresPulverizacao): void {
  atualizar((e) => ({ ...e, limiares }));
}

export function definirPro(pro: boolean): void {
  if (estado.pro !== pro) atualizar((e) => ({ ...e, pro }));
}

export function definirProSimulado(proSimulado: boolean): void {
  atualizar((e) => ({ ...e, proSimulado }));
}

/** Apaga tudo o que o app guardou no aparelho (estado e caches). */
export function apagarTudo(): void {
  for (const chave of chaves()) if (chave.startsWith('graoraiz:')) apagar(chave);
  estado = inicial();
  ouvintes.forEach((ouvinte) => ouvinte());
}
