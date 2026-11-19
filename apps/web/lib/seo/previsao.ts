// Previsão das janelas de pulverização num ponto, com as mesmas regras do app (pacote @graoraiz/clima).
import {
  type AvaliacaoHora,
  avaliarSerie,
  dataDe,
  type GeadaNoite,
  geadasPrevistas,
  lerDias,
  lerHoras,
  type RespostaOpenMeteo,
  resumoPulverizacaoDia,
  type ResumoPulverizacaoDia,
  urlPrevisao,
} from '@graoraiz/clima';
import { cacheLife } from 'next/cache';

export interface DiaPrevisto extends ResumoPulverizacaoDia {
  chuvaMm: number;
  probChuva: number | null;
  tMin: number;
  tMax: number;
}

export interface HoraPrevista extends AvaliacaoHora {
  umidade: number;
  temperatura: number;
  probChuva: number | null;
}

export interface PrevisaoPulverizacao {
  /** Quando a previsão foi buscada (ISO, UTC). */
  buscadaEm: string;
  /** Fuso do ponto (ex.: America/Sao_Paulo), vindo do Open-Meteo. */
  fuso: string;
  hoje: string;
  dias: DiaPrevisto[];
  /** Horas de hoje das 5h às 20h (fora disso a aplicação costuma não acontecer). */
  horasHoje: HoraPrevista[];
  geadas: GeadaNoite[];
}

/**
 * Busca a previsão de 7 dias e calcula as janelas. Fica em cache por algumas horas por ponto:
 * a página responde rápido e o Open-Meteo recebe poucas chamadas mesmo com muitos municípios.
 */
export async function previsaoPulverizacao(lat: number, lon: number): Promise<PrevisaoPulverizacao | null> {
  'use cache';
  cacheLife('hours');
  return calcularPrevisao(lat, lon);
}

/** Sem cache: usada pela publicação em ondas (fora de uma página) para conferir que há dado. */
export async function calcularPrevisao(lat: number, lon: number): Promise<PrevisaoPulverizacao | null> {
  try {
    const url = urlPrevisao(lat, lon, { diasPrevisao: 7, apiKey: process.env.OPEN_METEO_API_KEY || undefined });
    const r = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!r.ok) return null;
    const json = (await r.json()) as RespostaOpenMeteo & { timezone?: string };
    const horas = lerHoras(json);
    const dias = lerDias(json);
    if (horas.length < 24 || dias.length === 0) return null;
    const avaliacoes = avaliarSerie(horas);
    const hoje = dias[0].data;
    const porHora = new Map(horas.map((h) => [h.hora, h]));
    return {
      buscadaEm: new Date().toISOString(),
      fuso: json.timezone ?? 'America/Sao_Paulo',
      hoje,
      dias: dias.slice(0, 7).map((d) => ({
        ...resumoPulverizacaoDia(avaliacoes, d.data),
        chuvaMm: d.chuva,
        probChuva: d.probChuva,
        tMin: d.tMin,
        tMax: d.tMax,
      })),
      horasHoje: avaliacoes
        .filter((a) => dataDe(a.hora) === hoje)
        .filter((a) => {
          const hh = Number(a.hora.slice(11, 13));
          return hh >= 5 && hh <= 20;
        })
        .map((a) => {
          const h = porHora.get(a.hora);
          return { ...a, umidade: h?.umidade ?? 0, temperatura: h?.temperatura ?? 0, probChuva: h?.probChuva ?? null };
        }),
      geadas: geadasPrevistas(horas),
    };
  } catch {
    return null;
  }
}
