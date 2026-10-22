import type { Dia, Hora } from './tipos';

export type RiscoGeada = 'alto' | 'moderado' | null;

/**
 * Risco de geada pela mínima do ar a 2 m. Com o ar a 3 °C a superfície das folhas
 * pode chegar a 0 °C em noite limpa e sem vento, por isso o limiar moderado é 3 °C.
 */
export function riscoGeada(dia: Dia, limiares = { moderado: 3, alto: 1 }): RiscoGeada {
  if (dia.tMin <= limiares.alto) return 'alto';
  if (dia.tMin <= limiares.moderado) return 'moderado';
  return null;
}

export interface HoraTemporal {
  hora: string;
  motivos: string[];
}

/** Códigos da OMM para trovoada (com ou sem granizo). */
const CODIGOS_TROVOADA = new Set([95, 96, 99]);

/** Horas com risco de temporal: trovoada, rajada forte ou chuva intensa. */
export function riscoTemporal(horas: Hora[], limiares = { rajada10m: 60, chuvaHora: 20 }): HoraTemporal[] {
  const resultado: HoraTemporal[] = [];
  for (const h of horas) {
    const motivos: string[] = [];
    if (h.codigoTempo !== undefined && CODIGOS_TROVOADA.has(h.codigoTempo)) {
      motivos.push(h.codigoTempo === 95 ? 'trovoada' : 'trovoada com granizo');
    }
    if (h.rajada10m >= limiares.rajada10m) motivos.push(`rajadas de ${Math.round(h.rajada10m)} km/h`);
    if (h.chuva >= limiares.chuvaHora) motivos.push(`chuva forte (${Math.round(h.chuva)} mm/h)`);
    if (motivos.length) resultado.push({ hora: h.hora, motivos });
  }
  return resultado;
}
