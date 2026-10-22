import { somarDias } from './datas';
import type { Dia } from './tipos';

export interface OpcoesJanelaSeca {
  /** Chuva máxima para o dia contar como seco, mm. */
  chuvaMaxima: number;
  /** Probabilidade máxima de chuva para o dia contar como seco, %. */
  probMaxima: number;
  /** Mínimo de dias seguidos para formar janela. */
  diasMinimos: number;
}

export const OPCOES_JANELA_SECA_PADRAO: OpcoesJanelaSeca = { chuvaMaxima: 1, probMaxima: 40, diasMinimos: 2 };

export interface JanelaSeca {
  inicio: string;
  fim: string;
  dias: number;
}

export function diaSeco(dia: Dia, opcoes: OpcoesJanelaSeca = OPCOES_JANELA_SECA_PADRAO): boolean {
  return dia.chuva < opcoes.chuvaMaxima && (dia.probChuva === null || dia.probChuva < opcoes.probMaxima);
}

/** Dias seguidos de tempo firme, para colher ou entrar com máquina. */
export function janelasSecas(dias: Dia[], opcoes: Partial<OpcoesJanelaSeca> = {}): JanelaSeca[] {
  const o = { ...OPCOES_JANELA_SECA_PADRAO, ...opcoes };
  const janelas: JanelaSeca[] = [];
  let inicio: string | null = null;
  let anterior: string | null = null;
  let contagem = 0;

  const fechar = () => {
    if (inicio !== null && anterior !== null && contagem >= o.diasMinimos) {
      janelas.push({ inicio, fim: anterior, dias: contagem });
    }
    inicio = null;
    contagem = 0;
  };

  for (const dia of dias) {
    const seguido = anterior !== null && somarDias(anterior, 1) === dia.data;
    if (!diaSeco(dia, o) || (inicio !== null && !seguido)) fechar();
    if (diaSeco(dia, o)) {
      if (inicio === null) inicio = dia.data;
      contagem += 1;
    }
    anterior = dia.data;
  }
  fechar();
  return janelas;
}
