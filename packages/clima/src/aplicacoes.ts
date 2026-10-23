import { dataDe, diasEntre, somarDias, somarHoras } from './datas';
import { avaliarHora, LIMIARES_PULVERIZACAO_PADRAO, type LimiaresPulverizacao } from './pulverizacao';
import type { Hora, Status } from './tipos';

/**
 * Caderno de aplicações: o produtor registra "apliquei agora" e o app guarda as condições do tempo
 * naquela hora (prova para caderno de campo, receituário e regras de deriva), confere se a chuva
 * lavou o produto e acompanha quando vence a proteção dos produtos com efeito residual.
 */

export type TipoProduto = 'herbicida' | 'fungicida' | 'inseticida' | 'foliar' | 'outro';

export interface ParametrosProduto {
  rotulo: string;
  /** Horas sem chuva depois da aplicação para o produto agir (padrão; a bula manda). */
  horasSemChuva: number;
  /** Dias de proteção esperados (fungicida/inseticida); null quando não se aplica. */
  residualDias: number | null;
}

export const PRODUTOS: Record<TipoProduto, ParametrosProduto> = {
  fungicida: { rotulo: 'Fungicida', horasSemChuva: 2, residualDias: 14 },
  inseticida: { rotulo: 'Inseticida', horasSemChuva: 2, residualDias: 10 },
  herbicida: { rotulo: 'Herbicida', horasSemChuva: 4, residualDias: null },
  foliar: { rotulo: 'Adubo foliar', horasSemChuva: 4, residualDias: null },
  outro: { rotulo: 'Outro', horasSemChuva: 2, residualDias: null },
};

/** Fotografia das condições na hora da aplicação, guardada junto com o registro. */
export interface CondicoesAplicacao {
  temperatura: number;
  umidade: number;
  vento2m: number;
  rajada2m: number;
  deltaT: number;
  status: Status;
  motivos: string[];
}

export interface Aplicacao {
  id: string;
  talhaoId: string;
  /** Início da aplicação, hora local: "2026-10-22T07:30". */
  quando: string;
  tipo: TipoProduto;
  produto: string;
  dose?: string;
  areaHa?: number;
  horasSemChuva: number;
  residualDias: number | null;
  condicoes: CondicoesAplicacao | null;
  observacao?: string;
}

/** Condições da hora cheia da aplicação na série (previsão ou dado recente); null se a hora não estiver na série. */
export function condicoesNaHora(
  horas: Hora[],
  quando: string,
  limiares: LimiaresPulverizacao = LIMIARES_PULVERIZACAO_PADRAO,
): CondicoesAplicacao | null {
  const alvo = `${quando.slice(0, 13)}:00`;
  const i = horas.findIndex((h) => h.hora === alvo);
  const h = horas[i];
  if (i < 0 || !h) return null;
  const a = avaliarHora(horas, i, limiares);
  return {
    temperatura: h.temperatura,
    umidade: h.umidade,
    vento2m: a.vento2m,
    rajada2m: a.rajada2m,
    deltaT: a.deltaT,
    status: a.status,
    motivos: a.motivos.map((m) => m.texto),
  };
}

export type SituacaoLavagem = 'aguardando' | 'segura' | 'risco' | 'lavou' | 'semDados';

export interface Lavagem {
  situacao: SituacaoLavagem;
  /** Chuva (observada ou prevista) dentro do prazo sem chuva. */
  mm: number;
  /** Fim do prazo sem chuva. */
  ate: string;
}

/**
 * Confere a chuva no prazo depois da aplicação. Antes do prazo acabar, chuva prevista no restante
 * vira "risco"; depois, 2 mm ou mais contam como "lavou" e de 0,5 a 2 mm como "risco".
 */
export function verificarLavagem(aplicacao: Pick<Aplicacao, 'quando' | 'horasSemChuva'>, horas: Hora[], agora: string): Lavagem {
  const inicio = `${aplicacao.quando.slice(0, 13)}:00`;
  const ate = somarHoras(aplicacao.quando, aplicacao.horasSemChuva);
  const noPrazo = horas.filter((h) => h.hora >= inicio && h.hora < ate);
  if (noPrazo.length === 0) return { situacao: 'semDados', mm: 0, ate };
  const mm = noPrazo.reduce((s, h) => s + h.chuva, 0);
  if (agora < ate) {
    const restante = noPrazo.filter((h) => h.hora >= `${agora.slice(0, 13)}:00`);
    const prevista = restante.reduce((s, h) => s + h.chuva, 0);
    const probMax = Math.max(0, ...restante.map((h) => h.probChuva ?? 0));
    return { situacao: prevista >= 0.5 || probMax >= 60 ? 'risco' : 'aguardando', mm, ate };
  }
  if (mm >= 2) return { situacao: 'lavou', mm, ate };
  if (mm >= 0.5) return { situacao: 'risco', mm, ate };
  return { situacao: 'segura', mm, ate };
}

export interface Protecao {
  aplicacaoId: string;
  tipo: TipoProduto;
  produto: string;
  /** Último dia de proteção esperada. */
  vence: string;
  /** Dias até vencer (0 = vence hoje; negativo = vencida). */
  diasRestantes: number;
}

/** Proteção mais recente de um tipo de produto no talhão (fungicida, por padrão). */
export function protecaoAtual(aplicacoes: Aplicacao[], hoje: string, tipo: TipoProduto = 'fungicida'): Protecao | null {
  const comResidual = aplicacoes
    .filter((a) => a.tipo === tipo && a.residualDias !== null && dataDe(a.quando) <= hoje)
    .sort((a, b) => b.quando.localeCompare(a.quando));
  const ultima = comResidual[0];
  if (!ultima || ultima.residualDias === null) return null;
  const vence = somarDias(dataDe(ultima.quando), ultima.residualDias);
  return { aplicacaoId: ultima.id, tipo, produto: ultima.produto, vence, diasRestantes: diasEntre(hoje, vence) };
}
