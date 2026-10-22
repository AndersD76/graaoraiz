/**
 * Uma hora de previsão (ou de observação) num ponto.
 * As unidades são fixas para que nenhuma tela precise converter nada.
 */
export interface Hora {
  /** Data e hora locais, ISO sem fuso: "2026-10-22T06:00". */
  hora: string;
  /** Temperatura do ar a 2 m, em °C. */
  temperatura: number;
  /** Umidade relativa a 2 m, em %. */
  umidade: number;
  /** Vento médio a 10 m (altura padrão dos modelos), em km/h. */
  vento10m: number;
  /** Rajada a 10 m, em km/h. */
  rajada10m: number;
  /** Chuva acumulada na hora, em mm. */
  chuva: number;
  /** Probabilidade de chuva, em %; null quando a fonte não informa. */
  probChuva: number | null;
  /** Código de tempo da OMM (95–99 = trovoada), quando disponível. */
  codigoTempo?: number;
}

/** Resumo diário de previsão num ponto. */
export interface Dia {
  /** Data local: "2026-10-22". */
  data: string;
  /** Chuva prevista no dia, em mm. */
  chuva: number;
  /** Probabilidade máxima de chuva no dia, em %; null quando a fonte não informa. */
  probChuva: number | null;
  /** Temperatura máxima a 2 m, em °C. */
  tMax: number;
  /** Temperatura mínima a 2 m, em °C. */
  tMin: number;
  /** Rajada máxima a 10 m, em km/h. */
  rajadaMax10m: number;
  /** Código de tempo da OMM, quando disponível. */
  codigoTempo?: number;
}

/** Semáforo usado em todas as decisões do app. */
export type Status = 'bom' | 'atencao' | 'ruim';

export const ORDEM_STATUS: Record<Status, number> = { bom: 0, atencao: 1, ruim: 2 };

export function piorStatus(a: Status, b: Status): Status {
  return ORDEM_STATUS[a] >= ORDEM_STATUS[b] ? a : b;
}
