import { somarDias } from './datas';

export type OrigemChuva = 'manual' | 'estimada';

export interface RegistroChuva {
  data: string;
  mm: number;
  origem: OrigemChuva;
}

/**
 * Junta a chuva anotada pelo produtor com a estimada pelos dados meteorológicos.
 * A anotação sempre vence; a estimativa só preenche os dias sem anotação.
 */
export function mesclarChuva(manual: Omit<RegistroChuva, 'origem'>[], estimada: Omit<RegistroChuva, 'origem'>[]): RegistroChuva[] {
  const porData = new Map<string, RegistroChuva>();
  for (const r of estimada) porData.set(r.data, { ...r, origem: 'estimada' });
  for (const r of manual) porData.set(r.data, { ...r, origem: 'manual' });
  return [...porData.values()].sort((a, b) => a.data.localeCompare(b.data));
}

/** Soma da chuva entre duas datas, inclusive. */
export function acumulado(registros: Pick<RegistroChuva, 'data' | 'mm'>[], inicio: string, fim: string): number {
  return registros.filter((r) => r.data >= inicio && r.data <= fim).reduce((soma, r) => soma + r.mm, 0);
}

export interface ResumoMes {
  /** "2026-10". */
  mes: string;
  mm: number;
  diasAnotados: number;
  diasEstimados: number;
}

export function chuvaPorMes(registros: RegistroChuva[]): ResumoMes[] {
  const meses = new Map<string, ResumoMes>();
  for (const r of registros) {
    const mes = r.data.slice(0, 7);
    const m = meses.get(mes) ?? { mes, mm: 0, diasAnotados: 0, diasEstimados: 0 };
    m.mm += r.mm;
    if (r.origem === 'manual') m.diasAnotados += 1;
    else m.diasEstimados += 1;
    meses.set(mes, m);
  }
  return [...meses.values()].sort((a, b) => a.mes.localeCompare(b.mes));
}

export interface SequenciaSeca {
  inicio: string;
  fim: string;
  dias: number;
}

/** Maior sequência de dias consecutivos abaixo do limiar; dia sem registro quebra a sequência. */
export function maiorSequenciaSeca(registros: Pick<RegistroChuva, 'data' | 'mm'>[], limiarMm = 2): SequenciaSeca | null {
  const ordenados = [...registros].sort((a, b) => a.data.localeCompare(b.data));
  let melhor: SequenciaSeca | null = null;
  let atual: SequenciaSeca | null = null;
  let anterior: string | null = null;
  for (const r of ordenados) {
    const seguido = anterior !== null && somarDias(anterior, 1) === r.data;
    if (r.mm < limiarMm) {
      const continua: SequenciaSeca | null = seguido ? atual : null;
      const nova: SequenciaSeca = continua
        ? { inicio: continua.inicio, fim: r.data, dias: continua.dias + 1 }
        : { inicio: r.data, fim: r.data, dias: 1 };
      atual = nova;
      if (!melhor || nova.dias > melhor.dias) melhor = nova;
    } else {
      atual = null;
    }
    anterior = r.data;
  }
  return melhor;
}

/**
 * Dias seguidos sem chuva relevante terminando em `ateData`.
 * Um dia sem registro interrompe a contagem: sem dado, não afirmamos que não choveu.
 */
export function diasSemChuva(registros: Pick<RegistroChuva, 'data' | 'mm'>[], ateData: string, limiarMm = 2): number {
  const porData = new Map(registros.map((r) => [r.data, r.mm]));
  let dias = 0;
  let data = ateData;
  for (;;) {
    const mm = porData.get(data);
    if (mm === undefined || mm >= limiarMm) return dias;
    dias += 1;
    data = somarDias(data, -1);
  }
}
