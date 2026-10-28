import { maiorSequenciaSeca, type SequenciaSeca } from './chuva';
import type { DiaObservado } from './eventos';

/** Os últimos meses do talhão num resumo só: chuva, extremos de temperatura e vento, mês a mês. */

export interface Extremo {
  valor: number;
  data: string;
}

export interface MesPanorama {
  /** "2026-10". */
  mes: string;
  mm: number;
  diasComChuva: number;
  tMin: number | null;
  tMax: number | null;
}

export interface ResumoPanorama {
  chuvaTotal: number;
  /** Dias com 1 mm ou mais. */
  diasComChuva: number;
  maiorSeca: SequenciaSeca | null;
  minima: Extremo | null;
  maxima: Extremo | null;
  rajada: Extremo | null;
  /** Madrugadas com mínima de 3 °C ou menos (risco de geada na relva). */
  diasFrios: number;
  meses: MesPanorama[];
}

function extremo(dias: DiaObservado[], campo: 'tMin' | 'tMax' | 'rajada', menor: boolean): Extremo | null {
  let melhor: Extremo | null = null;
  for (const d of dias) {
    const v = d[campo];
    if (v === undefined) continue;
    if (!melhor || (menor ? v < melhor.valor : v > melhor.valor)) melhor = { valor: v, data: d.data };
  }
  return melhor;
}

export function resumirPanorama(dias: DiaObservado[]): ResumoPanorama {
  const ordenados = [...dias].sort((a, b) => a.data.localeCompare(b.data));
  const meses = new Map<string, MesPanorama>();
  for (const d of ordenados) {
    const chave = d.data.slice(0, 7);
    const m = meses.get(chave) ?? { mes: chave, mm: 0, diasComChuva: 0, tMin: null, tMax: null };
    m.mm += d.chuva;
    if (d.chuva >= 1) m.diasComChuva += 1;
    if (d.tMin !== undefined) m.tMin = m.tMin === null ? d.tMin : Math.min(m.tMin, d.tMin);
    if (d.tMax !== undefined) m.tMax = m.tMax === null ? d.tMax : Math.max(m.tMax, d.tMax);
    meses.set(chave, m);
  }
  return {
    chuvaTotal: ordenados.reduce((s, d) => s + d.chuva, 0),
    diasComChuva: ordenados.filter((d) => d.chuva >= 1).length,
    maiorSeca: maiorSequenciaSeca(ordenados.map((d) => ({ data: d.data, mm: d.chuva }))),
    minima: extremo(ordenados, 'tMin', true),
    maxima: extremo(ordenados, 'tMax', false),
    rajada: extremo(ordenados, 'rajada', false),
    diasFrios: ordenados.filter((d) => d.tMin !== undefined && d.tMin <= 3).length,
    meses: [...meses.values()],
  };
}
