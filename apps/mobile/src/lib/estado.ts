import {
  type Aplicacao,
  type Cultura,
  type JanelaZarc,
  LIMIARES_PULVERIZACAO_PADRAO,
  type LimiaresPulverizacao,
  PREFERENCIAS_AVISOS_PADRAO,
  type PreferenciasAvisos,
  type Solo,
} from '@graoraiz/clima';
import { useSyncExternalStore } from 'react';

import { apagar, chaves, gravar, ler } from '@/lib/armazenamento';
import { PERMITE_SIMULAR_PRO } from '@/lib/config';

export type { Cultura };

export interface Talhao {
  id: string;
  nome: string;
  lat: number;
  lon: number;
  cultura: Cultura | null;
  /** "2026-10-05" ou null. */
  dataPlantio: string | null;
  criadoEm: string;
  solo: Solo;
  /** Janela de plantio do ZARC informada pelo produtor (município, solo e ciclo). */
  zarc: JanelaZarc | null;
  areaHa: number | null;
  /** Contorno do talhão desenhado no mapa: pares [lat, lon]. */
  contorno: [number, number][] | null;
  /** Talhão em baixada: o ar frio escorre e acumula, a geada pega mais. */
  baixada: boolean;
}

export interface AnotacaoChuva {
  talhaoId: string;
  data: string;
  mm: number;
}

export type TipoOcorrencia = 'granizo' | 'geada' | 'seca' | 'excessoChuva' | 'vendaval' | 'praga' | 'doenca' | 'outro';

export const TIPOS_OCORRENCIA: { valor: TipoOcorrencia; rotulo: string }[] = [
  { valor: 'granizo', rotulo: 'Granizo' },
  { valor: 'geada', rotulo: 'Geada' },
  { valor: 'seca', rotulo: 'Seca' },
  { valor: 'excessoChuva', rotulo: 'Excesso de chuva' },
  { valor: 'vendaval', rotulo: 'Vendaval' },
  { valor: 'praga', rotulo: 'Praga' },
  { valor: 'doenca', rotulo: 'Doença' },
  { valor: 'outro', rotulo: 'Outro' },
];

/** Ocorrência registrada pelo produtor, com fotos e local: prova para banco e seguradora. */
export interface EventoRegistrado {
  id: string;
  talhaoId: string;
  data: string;
  tipo: TipoOcorrencia;
  nota?: string;
  /** Endereços das fotos no aparelho (ou data URI na web). */
  fotos: string[];
  /** Onde o produtor estava ao registrar, quando permitiu. */
  local?: { lat: number; lon: number };
  /** Momento exato do registro: "2026-10-22T14:35". */
  registradaEm?: string;
  /** Data em que comunicou o banco ou a seguradora. */
  comunicadoEm?: string;
}

export type TipoSeguro = 'nenhum' | 'proagro' | 'psr' | 'privado';

export const TIPOS_SEGURO: { valor: TipoSeguro; rotulo: string }[] = [
  { valor: 'proagro', rotulo: 'Proagro' },
  { valor: 'psr', rotulo: 'Seguro com subsídio (PSR)' },
  { valor: 'privado', rotulo: 'Seguro privado' },
  { valor: 'nenhum', rotulo: 'Não tenho' },
];

export interface Seguro {
  tipo: TipoSeguro;
  /** Banco, cooperativa ou seguradora. */
  agente: string;
  /** Prazo do contrato para comunicar perda, em dias; null = não informado. */
  prazoDias: number | null;
}

export interface AvisoAgendado {
  id: string;
  quando: string;
}

export type PreferenciaTema = 'auto' | 'claro' | 'escuro';

export interface Estado {
  versao: 2;
  talhoes: Talhao[];
  talhaoSelecionado: string | null;
  chuvas: AnotacaoChuva[];
  eventos: EventoRegistrado[];
  aplicacoes: Aplicacao[];
  seguro: Seguro;
  /** Nome do produtor, para o boletim e o dossiê. */
  produtor: string;
  preferencias: PreferenciasAvisos;
  limiares: LimiaresPulverizacao;
  avisosAgendados: AvisoAgendado[];
  /** Ids de avisos que já passaram do horário: nunca reagendar. */
  avisosEntregues: string[];
  /** Assinatura ativa (vem da loja via RevenueCat). */
  pro: boolean;
  /** Só em desenvolvimento: libera o Pro para testar sem loja. */
  proSimulado: boolean;
  /** Aparência: segue o celular, sempre clara ou sempre escura. */
  tema: PreferenciaTema;
}

const CHAVE = 'graoraiz:estado:v1';
export const LIMITE_TALHOES_GRATIS = 1;

function inicial(): Estado {
  return {
    versao: 2,
    talhoes: [],
    talhaoSelecionado: null,
    chuvas: [],
    eventos: [],
    aplicacoes: [],
    seguro: { tipo: 'nenhum', agente: '', prazoDias: null },
    produtor: '',
    preferencias: PREFERENCIAS_AVISOS_PADRAO,
    limiares: LIMIARES_PULVERIZACAO_PADRAO,
    avisosAgendados: [],
    avisosEntregues: [],
    pro: false,
    proSimulado: false,
    tema: 'auto',
  };
}

/** Completa dados gravados por versões anteriores: campos novos entram com o padrão, o que o usuário salvou prevalece. */
function normalizar(salvo: Omit<Partial<Estado>, 'talhoes' | 'eventos'> & { talhoes?: Partial<Talhao>[]; eventos?: Partial<EventoRegistrado>[] }): Estado {
  const base = inicial();
  return {
    ...base,
    ...salvo,
    versao: 2,
    talhoes: (salvo.talhoes ?? []).map((t) => ({
      solo: 'medio' as Solo,
      zarc: null,
      areaHa: null,
      contorno: null,
      baixada: false,
      dataPlantio: null,
      ...t,
      cultura: t.cultura ?? null,
    })) as Talhao[],
    eventos: (salvo.eventos ?? []).map((ev) => ({ fotos: [], ...ev })) as EventoRegistrado[],
    aplicacoes: salvo.aplicacoes ?? [],
    seguro: { ...base.seguro, ...salvo.seguro },
    preferencias: { ...PREFERENCIAS_AVISOS_PADRAO, ...salvo.preferencias },
    limiares: { ...LIMIARES_PULVERIZACAO_PADRAO, ...salvo.limiares },
  };
}

function carregar(): Estado {
  const salvo = ler<Partial<Estado>>(CHAVE);
  return salvo ? normalizar(salvo) : inicial();
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

export type DadosNovoTalhao = Omit<Talhao, 'id' | 'criadoEm' | 'solo' | 'zarc' | 'areaHa' | 'contorno' | 'baixada'> &
  Partial<Pick<Talhao, 'solo' | 'zarc' | 'areaHa' | 'contorno' | 'baixada'>> & { id?: string };

export function salvarTalhao(talhao: DadosNovoTalhao): Talhao {
  const existente = talhao.id ? estado.talhoes.find((t) => t.id === talhao.id) : undefined;
  const salvo: Talhao = {
    solo: 'medio',
    zarc: null,
    areaHa: null,
    contorno: null,
    baixada: false,
    ...existente,
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
      aplicacoes: e.aplicacoes.filter((a) => a.talhaoId !== id),
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

export function registrarEvento(evento: Omit<EventoRegistrado, 'id' | 'fotos'> & { fotos?: string[] }): EventoRegistrado {
  const novo: EventoRegistrado = { fotos: [], ...evento, id: novoId() };
  atualizar((e) => ({ ...e, eventos: [...e.eventos, novo] }));
  return novo;
}

export function atualizarEvento(id: string, alteracoes: Partial<Omit<EventoRegistrado, 'id'>>): void {
  atualizar((e) => ({ ...e, eventos: e.eventos.map((ev) => (ev.id === id ? { ...ev, ...alteracoes } : ev)) }));
}

export function removerEvento(id: string): void {
  atualizar((e) => ({ ...e, eventos: e.eventos.filter((ev) => ev.id !== id) }));
}

export function registrarAplicacao(aplicacao: Omit<Aplicacao, 'id'>): Aplicacao {
  const nova: Aplicacao = { ...aplicacao, id: novoId() };
  atualizar((e) => ({ ...e, aplicacoes: [...e.aplicacoes, nova] }));
  return nova;
}

export function removerAplicacao(id: string): void {
  atualizar((e) => ({ ...e, aplicacoes: e.aplicacoes.filter((a) => a.id !== id) }));
}

export function salvarSeguro(seguro: Seguro): void {
  atualizar((e) => ({ ...e, seguro }));
}

export function salvarProdutor(produtor: string): void {
  atualizar((e) => ({ ...e, produtor }));
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

export function definirTema(tema: PreferenciaTema): void {
  atualizar((e) => ({ ...e, tema }));
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
