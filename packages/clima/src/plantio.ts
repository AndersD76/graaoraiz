import { dataDe, diasEntre, somarDias } from './datas';
import { formatarData, formatarMm } from './formatos';
import type { Dia, Hora, Status } from './tipos';
import { piorStatus } from './tipos';

/**
 * "Planto ou espero?": cruza a umidade do solo, a chuva dos próximos dias, a temperatura do solo
 * e a janela do ZARC informada pelo produtor. Plantar fora do ZARC tira a cobertura do Proagro e
 * do seguro subsidiado; plantar no seco e pegar veranico obriga a replantar.
 */

export type Solo = 'arenoso' | 'medio' | 'argiloso';

export const SOLOS: Record<Solo, { rotulo: string; capacidadeCampo: number; pontoMurcha: number }> = {
  arenoso: { rotulo: 'Arenoso', capacidadeCampo: 0.15, pontoMurcha: 0.06 },
  medio: { rotulo: 'Médio', capacidadeCampo: 0.27, pontoMurcha: 0.12 },
  argiloso: { rotulo: 'Argiloso', capacidadeCampo: 0.38, pontoMurcha: 0.22 },
};

/** Fração da água disponível (0 = ponto de murcha, 1 = capacidade de campo) para uma umidade volumétrica. */
export function aguaDisponivel(umidadeVolumetrica: number, solo: Solo): number {
  const { capacidadeCampo, pontoMurcha } = SOLOS[solo];
  return Math.min(Math.max((umidadeVolumetrica - pontoMurcha) / (capacidadeCampo - pontoMurcha), 0), 1);
}

export interface JanelaZarc {
  /** "2026-10-01". */
  inicio: string;
  fim: string;
}

export interface SituacaoZarc {
  situacao: 'antes' | 'aberta' | 'fechada';
  /** Dias até abrir (antes) ou até fechar (aberta); 0 na fechada. */
  dias: number;
}

export function situacaoZarc(janela: JanelaZarc, hoje: string): SituacaoZarc {
  if (hoje < janela.inicio) return { situacao: 'antes', dias: diasEntre(hoje, janela.inicio) };
  if (hoje > janela.fim) return { situacao: 'fechada', dias: 0 };
  return { situacao: 'aberta', dias: diasEntre(hoje, janela.fim) };
}

/** Maior sequência de dias secos (< 2 mm e chance < 50%) nos dias da previsão. */
export function maiorSecaPrevista(dias: Dia[]): number {
  let maior = 0;
  let atual = 0;
  for (const d of dias) {
    atual = d.chuva < 2 && (d.probChuva === null || d.probChuva < 50) ? atual + 1 : 0;
    maior = Math.max(maior, atual);
  }
  return maior;
}

export interface DecisaoPlantio {
  status: Status;
  titulo: string;
  motivos: { status: Status; texto: string }[];
  /** Água disponível no solo agora (0–1); null sem dado. */
  agua: number | null;
  chuva7dias: number;
  zarc: SituacaoZarc | null;
}

export interface EntradaPlantio {
  horas: Hora[];
  dias: Dia[];
  hoje: string;
  solo: Solo;
  zarc: JanelaZarc | null;
  /** Temperatura do solo abaixo da qual a germinação atrasa (da cultura); null ignora. */
  tSoloMinima: number | null;
}

export function decidirPlantio(e: EntradaPlantio): DecisaoPlantio {
  const motivos: DecisaoPlantio['motivos'] = [];
  const add = (status: Status, texto: string) => motivos.push({ status, texto });

  const zarc = e.zarc ? situacaoZarc(e.zarc, e.hoje) : null;
  if (zarc?.situacao === 'antes') add('ruim', `a janela do ZARC abre em ${zarc.dias} ${zarc.dias === 1 ? 'dia' : 'dias'} (${formatarData(e.zarc?.inicio ?? '')})`);
  else if (zarc?.situacao === 'fechada') add('ruim', 'a janela do ZARC fechou: plantar agora tira a cobertura do Proagro e do seguro subsidiado');
  else if (zarc && zarc.dias <= 7) add('atencao', `faltam ${zarc.dias} ${zarc.dias === 1 ? 'dia' : 'dias'} para fechar a janela do ZARC`);

  // Umidade do solo: média das horas de hoje (o modelo varia pouco ao longo do dia).
  const deHoje = e.horas.filter((h) => dataDe(h.hora) === e.hoje && h.umidadeSolo !== undefined);
  const agua = deHoje.length ? aguaDisponivel(deHoje.reduce((s, h) => s + (h.umidadeSolo ?? 0), 0) / deHoje.length, e.solo) : null;
  if (agua !== null) {
    if (agua < 0.35) add('ruim', `solo seco (${Math.round(agua * 100)}% da água disponível): semente pode não germinar`);
    else if (agua < 0.6) add('atencao', `umidade do solo média (${Math.round(agua * 100)}%)`);
  }

  const proximos = e.dias.filter((d) => d.data > e.hoje);
  const chuva7dias = proximos.filter((d) => d.data <= somarDias(e.hoje, 7)).reduce((s, d) => s + d.chuva, 0);
  const seca = maiorSecaPrevista(proximos.filter((d) => d.data <= somarDias(e.hoje, 14)));
  if (seca >= 10) add('ruim', `previsão de ${seca} dias seguidos sem chuva: risco de veranico logo após o plantio`);
  else if (seca >= 7) add('atencao', `${seca} dias seguidos sem chuva na previsão`);
  if (chuva7dias < 10 && (agua === null || agua < 0.6)) add('atencao', `pouca chuva prevista para 7 dias (${formatarMm(chuva7dias)})`);

  if (e.tSoloMinima !== null) {
    const temps = e.horas.filter((h) => dataDe(h.hora) === e.hoje && h.tSolo !== undefined).map((h) => h.tSolo ?? 0);
    if (temps.length) {
      const media = temps.reduce((s, t) => s + t, 0) / temps.length;
      if (media < e.tSoloMinima) add('atencao', `solo frio (${Math.round(media)} °C): a germinação fica lenta`);
    }
  }

  const status = motivos.reduce<Status>((s, m) => piorStatus(s, m.status), 'bom');
  return { status, titulo: tituloPlantio(status, zarc, agua, seca), motivos, agua, chuva7dias, zarc };
}

/** O título diz o motivo principal: "espere a chuva" com chuva caindo confundiria. */
function tituloPlantio(status: Status, zarc: SituacaoZarc | null, agua: number | null, seca: number): string {
  if (status === 'bom') return 'Pode plantar';
  if (status === 'atencao') return 'Plante com cuidado';
  if (zarc && zarc.situacao !== 'aberta') return 'Fora da janela';
  if (seca >= 10) return 'Espere: veranico à vista';
  if (agua !== null && agua < 0.35) return 'Espere o solo umedecer';
  return 'Espere';
}
