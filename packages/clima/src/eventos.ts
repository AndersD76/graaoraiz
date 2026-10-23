import { diasEntre, somarDias } from './datas';
import { formatarData, formatarMm } from './formatos';

/**
 * Detecção de eventos adversos no diário do talhão, para o produtor não perder prazo nem prova
 * no Proagro e no seguro rural. O app aponta o evento e organiza os dados; quem atesta a perda
 * é o perito. Limiares conservadores: melhor avisar um evento leve do que esquecer um grave.
 */

export interface DiaObservado {
  data: string;
  /** Chuva do dia (anotada pelo produtor ou estimada), mm. */
  chuva: number;
  tMin?: number;
  tMax?: number;
  /** Rajada máxima a 10 m, km/h. */
  rajada?: number;
}

export type TipoEventoDetectado = 'veranico' | 'excessoChuva' | 'geada' | 'vendaval' | 'calor';

export interface EventoDetectado {
  /** Estável: o mesmo evento gera sempre o mesmo id. */
  id: string;
  tipo: TipoEventoDetectado;
  inicio: string;
  fim: string;
  gravidade: 'moderado' | 'severo';
  titulo: string;
  detalhe: string;
}

export interface OpcoesEventos {
  /** Dias secos (< 2 mm) seguidos para veranico. */
  veranicoDias: number;
  /** Chuva em 1 dia ou em 3 dias que conta como excesso, mm. */
  excesso1dia: number;
  excesso3dias: number;
  /** Mínima do ar a 2 m para geada provável na planta, °C. */
  geadaTMin: number;
  /** Rajada para vendaval, km/h. */
  vendavalRajada: number;
  /** Máxima para calor extremo, °C. */
  calorTMax: number;
}

export const OPCOES_EVENTOS_PADRAO: OpcoesEventos = {
  veranicoDias: 10,
  excesso1dia: 60,
  excesso3dias: 120,
  geadaTMin: 2,
  vendavalRajada: 70,
  calorTMax: 36,
};

const NOMES: Record<TipoEventoDetectado, string> = {
  veranico: 'Veranico',
  excessoChuva: 'Excesso de chuva',
  geada: 'Geada',
  vendaval: 'Vendaval',
  calor: 'Calor extremo',
};

export function nomeEvento(tipo: TipoEventoDetectado): string {
  return NOMES[tipo];
}

/** Eventos no período, do mais antigo para o mais recente. Dias faltando quebram sequências (sem dado, sem afirmação). */
export function detectarEventos(dias: DiaObservado[], opcoes: Partial<OpcoesEventos> = {}): EventoDetectado[] {
  const o = { ...OPCOES_EVENTOS_PADRAO, ...opcoes };
  const ordenados = [...dias].sort((a, b) => a.data.localeCompare(b.data));
  const eventos: EventoDetectado[] = [];

  // Veranico: sequência de dias secos.
  let inicioSeca: string | null = null;
  let anterior: string | null = null;
  let contagem = 0;
  const fecharSeca = () => {
    if (inicioSeca && anterior && contagem >= o.veranicoDias) {
      const severo = contagem >= o.veranicoDias + 5;
      eventos.push({
        id: `veranico-${inicioSeca}`,
        tipo: 'veranico',
        inicio: inicioSeca,
        fim: anterior,
        gravidade: severo ? 'severo' : 'moderado',
        titulo: `Veranico de ${contagem} dias`,
        detalhe: `${contagem} dias seguidos com menos de 2 mm (${formatarData(inicioSeca)} a ${formatarData(anterior)}).`,
      });
    }
    inicioSeca = null;
    contagem = 0;
  };
  for (const d of ordenados) {
    const seguido = anterior !== null && somarDias(anterior, 1) === d.data;
    if (!seguido) fecharSeca();
    if (d.chuva < 2) {
      if (inicioSeca === null) inicioSeca = d.data;
      contagem += 1;
    } else {
      fecharSeca();
    }
    anterior = d.data;
  }
  fecharSeca();

  // Excesso de chuva: um dia muito chuvoso ou três dias somando muito.
  const porData = new Map(ordenados.map((d) => [d.data, d]));
  let ultimoExcesso: string | null = null;
  for (const d of ordenados) {
    const tres = [somarDias(d.data, -2), somarDias(d.data, -1), d.data].map((x) => porData.get(x));
    const soma3 = tres.every(Boolean) ? tres.reduce((s, x) => s + (x?.chuva ?? 0), 0) : 0;
    if (d.chuva >= o.excesso1dia || soma3 >= o.excesso3dias) {
      // Dias colados contam como o mesmo evento.
      if (ultimoExcesso && diasEntre(ultimoExcesso, d.data) <= 2) {
        const ev = eventos[eventos.length - 1];
        if (ev?.tipo === 'excessoChuva') {
          ev.fim = d.data;
          ultimoExcesso = d.data;
          continue;
        }
      }
      const total = Math.max(d.chuva, soma3);
      eventos.push({
        id: `excessoChuva-${d.data}`,
        tipo: 'excessoChuva',
        inicio: d.chuva >= o.excesso1dia ? d.data : somarDias(d.data, -2),
        fim: d.data,
        gravidade: total >= o.excesso1dia * 1.5 ? 'severo' : 'moderado',
        titulo: 'Excesso de chuva',
        detalhe: d.chuva >= o.excesso1dia ? `${formatarMm(d.chuva)} em ${formatarData(d.data)}.` : `${formatarMm(soma3)} em 3 dias até ${formatarData(d.data)}.`,
      });
      ultimoExcesso = d.data;
    }
  }

  for (const d of ordenados) {
    if (d.tMin !== undefined && d.tMin <= o.geadaTMin) {
      eventos.push({
        id: `geada-${d.data}`,
        tipo: 'geada',
        inicio: d.data,
        fim: d.data,
        gravidade: d.tMin <= 0 ? 'severo' : 'moderado',
        titulo: d.tMin <= 0 ? 'Geada forte provável' : 'Geada provável',
        detalhe: `Mínima de ${d.tMin.toFixed(1).replace('.', ',')} °C a 2 m em ${formatarData(d.data)}; na planta costuma ser mais frio.`,
      });
    }
    if (d.rajada !== undefined && d.rajada >= o.vendavalRajada) {
      eventos.push({
        id: `vendaval-${d.data}`,
        tipo: 'vendaval',
        inicio: d.data,
        fim: d.data,
        gravidade: d.rajada >= o.vendavalRajada + 20 ? 'severo' : 'moderado',
        titulo: 'Vendaval',
        detalhe: `Rajadas de até ${Math.round(d.rajada)} km/h em ${formatarData(d.data)}.`,
      });
    }
    if (d.tMax !== undefined && d.tMax >= o.calorTMax) {
      eventos.push({
        id: `calor-${d.data}`,
        tipo: 'calor',
        inicio: d.data,
        fim: d.data,
        gravidade: d.tMax >= o.calorTMax + 3 ? 'severo' : 'moderado',
        titulo: 'Calor extremo',
        detalhe: `Máxima de ${Math.round(d.tMax)} °C em ${formatarData(d.data)}.`,
      });
    }
  }

  return eventos.sort((a, b) => a.inicio.localeCompare(b.inicio) || a.tipo.localeCompare(b.tipo));
}

/** Prazo para comunicar a perda, contado do fim do evento, quando o produtor informou o prazo do contrato. */
export function prazoComunicacao(evento: Pick<EventoDetectado, 'fim'>, prazoDias: number | null, hoje: string): { ate: string; diasRestantes: number } | null {
  if (prazoDias === null) return null;
  const ate = somarDias(evento.fim, prazoDias);
  return { ate, diasRestantes: diasEntre(hoje, ate) };
}
