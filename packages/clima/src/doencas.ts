import { dataDe } from './datas';
import type { Hora } from './tipos';

/**
 * Risco de infecção guiado pelo clima: conta as horas de folha molhada dentro da faixa de
 * temperatura em que cada fungo infecta. É um indicador de condição favorável (sem sensor no
 * campo), não um diagnóstico: serve para decidir quando olhar a lavoura e quando proteger.
 *
 * Faixas e horas mínimas seguem a literatura usual de cada patossistema (ex.: ferrugem-asiática
 * com 6 h de molhamento a 15–28 °C, ótimo de 10–12 h; sarna da macieira pela tabela de Mills;
 * giberela com molhamento longo e contínuo na floração).
 */

export type Doenca =
  | 'ferrugemSoja'
  | 'mofoBranco'
  | 'cercosporiose'
  | 'ferrugemCafe'
  | 'brusone'
  | 'giberela'
  | 'requeima'
  | 'mildio'
  | 'sarna';

export interface RegraDoenca {
  nome: string;
  /** Temperatura do ar durante o molhamento, °C. */
  tMin: number;
  tMax: number;
  /** Horas favoráveis no dia para risco moderado e alto. */
  horasModerado: number;
  horasAlto: number;
  /** Conta só horas seguidas (fungos que precisam de molhamento contínuo). */
  continuas?: boolean;
}

export const REGRAS_DOENCA: Record<Doenca, RegraDoenca> = {
  ferrugemSoja: { nome: 'Ferrugem-asiática', tMin: 15, tMax: 28, horasModerado: 6, horasAlto: 10 },
  mofoBranco: { nome: 'Mofo-branco', tMin: 10, tMax: 24, horasModerado: 12, horasAlto: 18 },
  cercosporiose: { nome: 'Cercosporiose', tMin: 22, tMax: 30, horasModerado: 11, horasAlto: 14 },
  ferrugemCafe: { nome: 'Ferrugem do cafeeiro', tMin: 18, tMax: 28, horasModerado: 6, horasAlto: 10 },
  brusone: { nome: 'Brusone', tMin: 20, tMax: 32, horasModerado: 10, horasAlto: 14 },
  giberela: { nome: 'Giberela', tMin: 15, tMax: 30, horasModerado: 24, horasAlto: 40, continuas: true },
  requeima: { nome: 'Requeima', tMin: 10, tMax: 25, horasModerado: 10, horasAlto: 14 },
  mildio: { nome: 'Míldio', tMin: 10, tMax: 30, horasModerado: 4, horasAlto: 8 },
  sarna: { nome: 'Sarna', tMin: 8, tMax: 26, horasModerado: 12, horasAlto: 18 },
};

export type NivelRisco = 'baixo' | 'moderado' | 'alto';

/** Hora com folha molhada: probabilidade do modelo quando houver; senão, chuva ou ar saturado. */
export function horaMolhada(h: Hora): boolean {
  if (h.molhamento !== undefined) return h.molhamento >= 50 || h.chuva >= 0.2;
  return h.chuva >= 0.2 || h.umidade >= 90;
}

export interface RiscoDia {
  data: string;
  nivel: NivelRisco;
  /** Horas favoráveis (molhadas e na faixa de temperatura) no dia. */
  horas: number;
}

function nivelDe(horas: number, regra: RegraDoenca): NivelRisco {
  if (horas >= regra.horasAlto) return 'alto';
  if (horas >= regra.horasModerado) return 'moderado';
  return 'baixo';
}

/** Horas favoráveis por dia. Dias com menos de 20 horas na série ficam de fora (não dá para afirmar nada). */
export function riscoPorDia(horas: Hora[], doenca: Doenca): RiscoDia[] {
  const regra = REGRAS_DOENCA[doenca];
  const porDia = new Map<string, Hora[]>();
  for (const h of horas) {
    const d = dataDe(h.hora);
    const lista = porDia.get(d) ?? [];
    lista.push(h);
    porDia.set(d, lista);
  }
  const saida: RiscoDia[] = [];
  for (const [data, doDia] of [...porDia.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (doDia.length < 20) continue;
    let total = 0;
    let seguidas = 0;
    let maiorSequencia = 0;
    for (const h of doDia) {
      const favoravel = horaMolhada(h) && h.temperatura >= regra.tMin && h.temperatura <= regra.tMax;
      if (favoravel) {
        total += 1;
        seguidas += 1;
        maiorSequencia = Math.max(maiorSequencia, seguidas);
      } else {
        seguidas = 0;
      }
    }
    const conta = regra.continuas ? maiorSequencia : total;
    saida.push({ data, nivel: nivelDe(conta, regra), horas: conta });
  }
  return saida;
}

/**
 * Molhamento contínuo atravessa a meia-noite (giberela): mede a maior sequência na série inteira
 * e atribui ao dia em que ela termina.
 */
export function maiorMolhamentoContinuo(horas: Hora[], doenca: Doenca): { fim: string; horas: number } | null {
  const regra = REGRAS_DOENCA[doenca];
  let melhor: { fim: string; horas: number } | null = null;
  let seguidas = 0;
  for (const h of horas) {
    const favoravel = horaMolhada(h) && h.temperatura >= regra.tMin && h.temperatura <= regra.tMax;
    seguidas = favoravel ? seguidas + 1 : 0;
    if (favoravel && (!melhor || seguidas > melhor.horas)) melhor = { fim: h.hora, horas: seguidas };
  }
  return melhor;
}

export interface ResumoDoenca {
  doenca: Doenca;
  nome: string;
  /** Pior nível nos dias avaliados. */
  nivel: NivelRisco;
  /** Primeiro dia com o pior nível (null se tudo baixo). */
  quando: string | null;
  dias: RiscoDia[];
}

const ORDEM: Record<NivelRisco, number> = { baixo: 0, moderado: 1, alto: 2 };

/** Resumo de cada doença da cultura a partir de `desde` (normalmente hoje), em ordem do mais arriscado. */
export function resumoDoencas(horas: Hora[], doencas: Doenca[], desde: string, ateDias = 7): ResumoDoenca[] {
  return doencas
    .map((doenca) => {
      const regra = REGRAS_DOENCA[doenca];
      let dias = riscoPorDia(horas, doenca).filter((d) => d.data >= desde).slice(0, ateDias);
      if (regra.continuas) {
        const continuo = maiorMolhamentoContinuo(horas.filter((h) => dataDe(h.hora) >= desde), doenca);
        if (continuo) {
          const nivel = nivelDe(continuo.horas, regra);
          dias = dias.map((d) => (d.data === dataDe(continuo.fim) && ORDEM[nivel] > ORDEM[d.nivel] ? { ...d, nivel, horas: continuo.horas } : d));
        }
      }
      const pior = dias.reduce<RiscoDia | null>((p, d) => (!p || ORDEM[d.nivel] > ORDEM[p.nivel] ? d : p), null);
      const nivel = pior?.nivel ?? 'baixo';
      return { doenca, nome: regra.nome, nivel, quando: nivel === 'baixo' ? null : (pior?.data ?? null), dias };
    })
    .sort((a, b) => ORDEM[b.nivel] - ORDEM[a.nivel] || (a.quando ?? '').localeCompare(b.quando ?? ''));
}
