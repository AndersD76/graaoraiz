import type { Dia, Hora } from './tipos';

/**
 * Cliente puro (sem fetch) da API do Open-Meteo: monta URLs e converte as respostas.
 * Os dados do Open-Meteo são licenciados sob CC BY 4.0 — o app e o site exibem a atribuição.
 */

export const ATRIBUICAO_OPEN_METEO = 'Dados meteorológicos: Open-Meteo.com (CC BY 4.0)';

export const VARIAVEIS_HORARIAS = [
  'temperature_2m',
  'relative_humidity_2m',
  'precipitation',
  'precipitation_probability',
  'wind_speed_10m',
  'wind_gusts_10m',
  'weather_code',
] as const;

export const VARIAVEIS_DIARIAS = [
  'precipitation_sum',
  'precipitation_probability_max',
  'temperature_2m_max',
  'temperature_2m_min',
  'wind_gusts_10m_max',
  'weather_code',
] as const;

export interface OpcoesUrl {
  /** Chave comercial; quando presente usa o servidor customer-. */
  apiKey?: string;
  /**
   * Fuso das horas da resposta (ex.: "America/Cuiaba"). O app passa o fuso do aparelho para que
   * "6h" na tela e o horário dos avisos sejam o mesmo relógio do celular. Padrão: fuso do ponto.
   */
  fuso?: string;
}

export interface OpcoesPrevisao extends OpcoesUrl {
  /** Dias de previsão (1–16). */
  diasPrevisao?: number;
  /** Dias passados incluídos na resposta (0–92), usados como chuva estimada recente. */
  diasPassados?: number;
}

/** Arredonda coordenadas para ~1 km: protege a localização exata e melhora o cache. */
export function arredondarCoordenada(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export function coordenadaValida(lat: number, lon: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

/** Aceita só nomes de fuso da IANA ("America/Sao_Paulo", "UTC"); qualquer outra coisa vira "auto". */
export function fusoValido(fuso: string | undefined): string {
  return fuso && /^[A-Za-z]+(?:\/[A-Za-z0-9_+-]+){0,2}$/.test(fuso) ? fuso : 'auto';
}

function limitar(n: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(n), min), max);
}

function servidor(base: 'api' | 'archive-api', apiKey?: string): string {
  return apiKey ? `https://customer-${base}.open-meteo.com` : `https://${base}.open-meteo.com`;
}

export function urlPrevisao(lat: number, lon: number, opcoes: OpcoesPrevisao = {}): string {
  const p = new URLSearchParams({
    latitude: String(arredondarCoordenada(lat)),
    longitude: String(arredondarCoordenada(lon)),
    hourly: VARIAVEIS_HORARIAS.join(','),
    daily: VARIAVEIS_DIARIAS.join(','),
    timezone: fusoValido(opcoes.fuso),
    forecast_days: String(limitar(opcoes.diasPrevisao ?? 7, 1, 16)),
    past_days: String(limitar(opcoes.diasPassados ?? 0, 0, 92)),
  });
  if (opcoes.apiKey) p.set('apikey', opcoes.apiKey);
  return `${servidor('api', opcoes.apiKey)}/v1/forecast?${p.toString()}`;
}

/** Só a chuva diária dos últimos dias (até 92), resposta leve para a estimativa recente. */
export function urlChuvaRecente(lat: number, lon: number, diasPassados: number, opcoes: OpcoesUrl = {}): string {
  const p = new URLSearchParams({
    latitude: String(arredondarCoordenada(lat)),
    longitude: String(arredondarCoordenada(lon)),
    daily: 'precipitation_sum',
    timezone: fusoValido(opcoes.fuso),
    forecast_days: '1',
    past_days: String(limitar(diasPassados, 0, 92)),
  });
  if (opcoes.apiKey) p.set('apikey', opcoes.apiKey);
  return `${servidor('api', opcoes.apiKey)}/v1/forecast?${p.toString()}`;
}

/** Chuva diária observada/reanálise (ERA5) entre duas datas, para estimativa antiga e média histórica. */
export function urlHistoricoChuva(lat: number, lon: number, inicio: string, fim: string, opcoes: OpcoesUrl = {}): string {
  const p = new URLSearchParams({
    latitude: String(arredondarCoordenada(lat)),
    longitude: String(arredondarCoordenada(lon)),
    start_date: inicio,
    end_date: fim,
    daily: 'precipitation_sum',
    timezone: fusoValido(opcoes.fuso),
  });
  if (opcoes.apiKey) p.set('apikey', opcoes.apiKey);
  return `${servidor('archive-api', opcoes.apiKey)}/v1/archive?${p.toString()}`;
}

type Serie = (number | null)[] | undefined;

export interface RespostaOpenMeteo {
  timezone?: string;
  hourly?: {
    time?: string[];
    temperature_2m?: Serie;
    relative_humidity_2m?: Serie;
    precipitation?: Serie;
    precipitation_probability?: Serie;
    wind_speed_10m?: Serie;
    wind_gusts_10m?: Serie;
    weather_code?: Serie;
  };
  daily?: {
    time?: string[];
    precipitation_sum?: Serie;
    precipitation_probability_max?: Serie;
    temperature_2m_max?: Serie;
    temperature_2m_min?: Serie;
    wind_gusts_10m_max?: Serie;
    weather_code?: Serie;
  };
  error?: boolean;
  reason?: string;
}

function valor(serie: Serie, i: number): number | null {
  const v = serie?.[i];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** Converte a parte horária. Horas sem os dados essenciais são descartadas, nunca inventadas. */
export function lerHoras(resposta: RespostaOpenMeteo): Hora[] {
  const h = resposta.hourly;
  if (!h?.time) return [];
  const horas: Hora[] = [];
  h.time.forEach((hora, i) => {
    const temperatura = valor(h.temperature_2m, i);
    const umidade = valor(h.relative_humidity_2m, i);
    const vento10m = valor(h.wind_speed_10m, i);
    const rajada10m = valor(h.wind_gusts_10m, i);
    const chuva = valor(h.precipitation, i);
    if (temperatura === null || umidade === null || vento10m === null || rajada10m === null || chuva === null) return;
    const codigo = valor(h.weather_code, i);
    horas.push({
      hora,
      temperatura,
      umidade,
      vento10m,
      rajada10m,
      chuva,
      probChuva: valor(h.precipitation_probability, i),
      ...(codigo !== null ? { codigoTempo: codigo } : {}),
    });
  });
  return horas;
}

export function lerDias(resposta: RespostaOpenMeteo): Dia[] {
  const d = resposta.daily;
  if (!d?.time) return [];
  const dias: Dia[] = [];
  d.time.forEach((data, i) => {
    const chuva = valor(d.precipitation_sum, i);
    const tMax = valor(d.temperature_2m_max, i);
    const tMin = valor(d.temperature_2m_min, i);
    const rajadaMax10m = valor(d.wind_gusts_10m_max, i);
    if (chuva === null || tMax === null || tMin === null || rajadaMax10m === null) return;
    const codigo = valor(d.weather_code, i);
    dias.push({
      data,
      chuva,
      probChuva: valor(d.precipitation_probability_max, i),
      tMax,
      tMin,
      rajadaMax10m,
      ...(codigo !== null ? { codigoTempo: codigo } : {}),
    });
  });
  return dias;
}

/** Chuva diária de uma resposta (previsão com past_days ou histórico). Dias sem valor ficam de fora. */
export function lerChuvaDiaria(resposta: RespostaOpenMeteo): { data: string; mm: number }[] {
  const d = resposta.daily;
  if (!d?.time) return [];
  const saida: { data: string; mm: number }[] = [];
  d.time.forEach((data, i) => {
    const mm = valor(d.precipitation_sum, i);
    if (mm !== null) saida.push({ data, mm });
  });
  return saida;
}

/** Descrição curta do código de tempo da OMM, em português. */
export function descreverTempo(codigo: number | undefined): string {
  if (codigo === undefined) return '';
  if (codigo === 0) return 'Céu limpo';
  if (codigo <= 2) return 'Poucas nuvens';
  if (codigo === 3) return 'Nublado';
  if (codigo === 45 || codigo === 48) return 'Neblina';
  if (codigo >= 51 && codigo <= 57) return 'Garoa';
  if (codigo >= 61 && codigo <= 67) return 'Chuva';
  if (codigo >= 71 && codigo <= 77) return 'Neve';
  if (codigo >= 80 && codigo <= 82) return 'Pancadas de chuva';
  if (codigo === 85 || codigo === 86) return 'Pancadas de neve';
  if (codigo === 95) return 'Trovoada';
  if (codigo === 96 || codigo === 99) return 'Trovoada com granizo';
  return '';
}
