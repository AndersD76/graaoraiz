import { dataDe, somarDias } from './datas';
import type { Hora } from './tipos';

/**
 * Geada por noite, olhando além da mínima do ar: em noite limpa e sem vento a folha perde calor
 * para o céu e fica de 2 a 5 °C mais fria que o abrigo a 2 m. O modelo informa também a
 * temperatura da superfície do solo, que já embute esse resfriamento.
 */

export type NivelGeada = 'fraca' | 'moderada' | 'forte';

export interface GeadaNoite {
  /** Data da madrugada (manhã) em que a geada aconteceria. */
  data: string;
  nivel: NivelGeada;
  /** Mínima do ar a 2 m na noite. */
  tMinAr: number;
  /** Estimativa na relva/folha. */
  tMinRelva: number;
  /** Hora da mínima. */
  horaMinima: string;
  /** Céu limpo e vento calmo (favorecem a geada). */
  noiteLimpaCalma: boolean;
}

/** Quanto a folha esfria abaixo do ar, pelas nuvens e pelo vento. */
function resfriamento(h: Hora): number {
  const nuvens = h.nuvens ?? 50;
  const calmo = h.vento10m < 8;
  if (nuvens < 25) return calmo ? 4 : 2.5;
  if (nuvens < 60) return calmo ? 2 : 1;
  return 0.5;
}

/** Noites com risco, das 18h até as 9h da manhã seguinte. `baixada` esfria mais 1,5 °C (ar frio escorre e acumula). */
export function geadasPrevistas(horas: Hora[], opcoes: { baixada?: boolean } = {}): GeadaNoite[] {
  const extra = opcoes.baixada ? 1.5 : 0;
  const noites = new Map<string, Hora[]>();
  for (const h of horas) {
    const hh = Number(h.hora.slice(11, 13));
    if (hh >= 18) {
      const manha = somarDias(dataDe(h.hora), 1);
      noites.set(manha, [...(noites.get(manha) ?? []), h]);
    } else if (hh <= 9) {
      const manha = dataDe(h.hora);
      noites.set(manha, [...(noites.get(manha) ?? []), h]);
    }
  }
  const saida: GeadaNoite[] = [];
  for (const [data, lista] of [...noites.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (lista.length < 8) continue;
    let minimaAr = lista[0] as Hora;
    let relva = Number.POSITIVE_INFINITY;
    for (const h of lista) {
      // Empate fica com a hora mais tarde: a mínima que importa é a do fim da madrugada.
      if (h.temperatura <= minimaAr.temperatura) minimaAr = h;
      const estimada = Math.min(h.temperatura - resfriamento(h), h.tSolo ?? Number.POSITIVE_INFINITY) - extra;
      relva = Math.min(relva, estimada);
    }
    const nivel: NivelGeada | null = relva <= -2 ? 'forte' : relva <= 0 ? 'moderada' : relva <= 2 ? 'fraca' : null;
    if (!nivel) continue;
    saida.push({
      data,
      nivel,
      tMinAr: minimaAr.temperatura,
      tMinRelva: Math.round(relva * 10) / 10,
      horaMinima: minimaAr.hora,
      noiteLimpaCalma: (minimaAr.nuvens ?? 50) < 25 && minimaAr.vento10m < 8,
    });
  }
  return saida;
}

export const ROTULO_GEADA: Record<NivelGeada, string> = {
  fraca: 'Geada fraca possível',
  moderada: 'Geada provável',
  forte: 'Geada forte',
};
