import { diasEntre, somarDias } from './datas';

export interface Safra {
  /** "2026/27". */
  rotulo: string;
  /** Primeiro dia do ano agrícola: 1º de julho. */
  inicio: string;
  /** Último dia: 30 de junho do ano seguinte. */
  fim: string;
}

/** Ano agrícola de julho a junho, como é contada a safra de verão no Brasil. */
export function safraDe(data: string): Safra {
  const ano = Number(data.slice(0, 4));
  const mes = Number(data.slice(5, 7));
  const inicioAno = mes >= 7 ? ano : ano - 1;
  return {
    rotulo: `${inicioAno}/${String((inicioAno + 1) % 100).padStart(2, '0')}`,
    inicio: `${inicioAno}-07-01`,
    fim: `${inicioAno + 1}-06-30`,
  };
}

export interface DiaChuva {
  data: string;
  mm: number;
}

/**
 * Média histórica da chuva acumulada entre dois dias do ano ("MM-DD"), atravessando a virada
 * do ano quando o fim vem antes do início. Só entram anos com pelo menos 90% dos dias.
 */
export function normalAcumulada(serie: DiaChuva[], inicioMD: string, fimMD: string): number | null {
  if (serie.length === 0) return null;
  const porData = new Map(serie.map((d) => [d.data, d.mm]));
  const anos = new Set(serie.map((d) => Number(d.data.slice(0, 4))));
  const vira = fimMD < inicioMD;
  const totais: number[] = [];

  for (const ano of anos) {
    const inicio = `${ano}-${inicioMD}`;
    const fim = `${vira ? ano + 1 : ano}-${fimMD}`;
    const dias = diasEntre(inicio, fim) + 1;
    if (dias <= 0) continue;
    let soma = 0;
    let presentes = 0;
    for (let i = 0; i < dias; i++) {
      const mm = porData.get(somarDias(inicio, i));
      if (mm !== undefined) {
        soma += mm;
        presentes += 1;
      }
    }
    if (presentes >= dias * 0.9) totais.push((soma / presentes) * dias);
  }
  if (totais.length === 0) return null;
  return totais.reduce((a, b) => a + b, 0) / totais.length;
}
