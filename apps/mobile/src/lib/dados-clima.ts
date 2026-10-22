import {
  arredondarCoordenada,
  type Dia,
  dataDe,
  type Hora,
  isoLocal,
  lerChuvaDiaria,
  lerDias,
  lerHoras,
  normalAcumulada,
  type RespostaOpenMeteo,
  somarDias,
  urlChuvaRecente,
  urlHistoricoChuva,
  urlPrevisao,
} from '@graoraiz/clima';

import { gravar, ler } from '@/lib/armazenamento';
import { API_URL } from '@/lib/config';

/** Coordenadas mínimas para buscar dados (um talhão serve). */
export interface Ponto {
  lat: number;
  lon: number;
}

interface EmCache<T> {
  dados: T;
  /** Date.now() da busca. */
  em: number;
}

const HORA = 60 * 60 * 1000;
/** Sinal rural fraco: sem limite, o Android espera para sempre (o OkHttp do RN não tem timeout). */
const LIMITE_REDE_MS = 20_000;

/** Fuso do aparelho: as horas da previsão e dos avisos ficam no mesmo relógio do celular. */
const FUSO = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
})();

function celula(p: Ponto): string {
  return `${arredondarCoordenada(p.lat)}:${arredondarCoordenada(p.lon)}`;
}

/** Parâmetros para o servidor próprio: coordenada arredondada (~1 km), como prometido na privacidade. */
function consulta(p: Ponto, extra: Record<string, string | number>): string {
  const q = new URLSearchParams({
    lat: String(arredondarCoordenada(p.lat)),
    lon: String(arredondarCoordenada(p.lon)),
    ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, String(v)])),
    ...(FUSO ? { fuso: FUSO } : {}),
  });
  return q.toString();
}

async function buscarJson(url: string): Promise<RespostaOpenMeteo> {
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), LIMITE_REDE_MS);
  try {
    const resposta = await fetch(url, { signal: controle.signal });
    if (!resposta.ok) throw new Error(`Falha ao buscar dados (${resposta.status})`);
    const json = (await resposta.json()) as RespostaOpenMeteo;
    if (json.error) throw new Error(json.reason ?? 'Resposta inválida do serviço de previsão');
    return json;
  } catch (e) {
    if (controle.signal.aborted) throw new Error('A conexão demorou demais. Tente de novo com sinal melhor.');
    throw e;
  } finally {
    clearTimeout(limite);
  }
}

/**
 * Busca com cache local: devolve o cache se ainda for recente; se a rede falhar,
 * devolve o cache antigo (e marca como desatualizado) em vez de inventar dado.
 */
async function comCache<T>(chave: string, validade: number, buscar: () => Promise<T>, forcar = false): Promise<{ dados: T; em: number; desatualizado: boolean }> {
  const cache = ler<EmCache<T>>(chave);
  if (cache && !forcar && Date.now() - cache.em < validade) return { ...cache, desatualizado: false };
  try {
    const dados = await buscar();
    const novo = { dados, em: Date.now() };
    gravar(chave, novo);
    return { ...novo, desatualizado: false };
  } catch (erro) {
    if (cache) return { ...cache, desatualizado: true };
    throw erro;
  }
}

export interface Previsao {
  horas: Hora[];
  dias: Dia[];
}

export interface Resultado<T> {
  dados: T;
  /** Date.now() de quando os dados foram obtidos. */
  em: number;
  /** true quando a rede falhou e estamos mostrando o último dado salvo. */
  desatualizado: boolean;
}

export function previsaoEmCache(p: Ponto): Resultado<Previsao> | null {
  const cache = ler<EmCache<Previsao>>(`graoraiz:previsao:${celula(p)}`);
  return cache ? { ...cache, desatualizado: Date.now() - cache.em > 6 * HORA } : null;
}

export function buscarPrevisao(p: Ponto, forcar = false): Promise<Resultado<Previsao>> {
  return comCache(
    `graoraiz:previsao:${celula(p)}`,
    HORA,
    async () => {
      const url = API_URL ? `${API_URL}/api/previsao?${consulta(p, { dias: 7 })}` : urlPrevisao(p.lat, p.lon, { diasPrevisao: 7, fuso: FUSO });
      const json = await buscarJson(url);
      // Guarda só de ontem em diante: menos espaço e nada que a tela não use.
      const desde = somarDias(dataDe(isoLocal(new Date())), -1);
      return {
        horas: lerHoras(json).filter((h) => h.hora >= desde),
        dias: lerDias(json).filter((d) => d.data >= desde),
      };
    },
    forcar,
  );
}

/** Chuva estimada diária desde `inicio` até ontem: recente pela previsão, antiga pela reanálise. */
export function buscarChuvaEstimada(p: Ponto, inicio: string, forcar = false): Promise<Resultado<{ data: string; mm: number }[]>> {
  const hoje = dataDe(isoLocal(new Date()));
  return comCache(
    `graoraiz:chuva-estimada:${celula(p)}:${inicio}`,
    6 * HORA,
    async () => {
      const limiteRecente = somarDias(hoje, -92);
      const recenteUrl = API_URL
        ? `${API_URL}/api/previsao?${consulta(p, { dias: 1, passados: 92 })}`
        : urlChuvaRecente(p.lat, p.lon, 92, { fuso: FUSO });
      const pedidos: Promise<{ data: string; mm: number }[]>[] = [buscarJson(recenteUrl).then(lerChuvaDiaria)];
      if (inicio < limiteRecente) {
        const fimAntigo = somarDias(limiteRecente, -1);
        const antigoUrl = API_URL
          ? `${API_URL}/api/historico?${consulta(p, { inicio, fim: fimAntigo })}`
          : urlHistoricoChuva(p.lat, p.lon, inicio, fimAntigo, { fuso: FUSO });
        pedidos.push(buscarJson(antigoUrl).then(lerChuvaDiaria));
      }
      const [recente = [], antigo = []] = await Promise.all(pedidos);
      const porData = new Map<string, number>();
      for (const r of antigo) porData.set(r.data, r.mm);
      for (const r of recente) porData.set(r.data, r.mm);
      return [...porData.entries()]
        .filter(([data]) => data >= inicio && data < hoje)
        .map(([data, mm]) => ({ data, mm }))
        .sort((a, b) => a.data.localeCompare(b.data));
    },
    forcar,
  );
}

/** Série diária 1991–2020 do ponto, guardada para sempre (o passado não muda). */
async function serieHistorica(p: Ponto): Promise<{ data: string; mm: number }[]> {
  const resultado = await comCache(`graoraiz:normal:${celula(p)}`, Number.POSITIVE_INFINITY, async () => {
    const url = API_URL
      ? `${API_URL}/api/historico?${consulta(p, { inicio: '1991-01-01', fim: '2020-12-31' })}`
      : urlHistoricoChuva(p.lat, p.lon, '1991-01-01', '2020-12-31', { fuso: FUSO });
    return lerChuvaDiaria(await buscarJson(url));
  });
  return resultado.dados;
}

/** Média histórica da chuva acumulada entre dois dias ("AAAA-MM-DD"); null se não der para calcular. */
export async function buscarNormal(p: Ponto, inicio: string, fim: string): Promise<number | null> {
  // No primeiro dia da safra o período até ontem é vazio (não é "o ano inteiro").
  if (fim < inicio) return null;
  try {
    const serie = await serieHistorica(p);
    return normalAcumulada(serie, inicio.slice(5), fim.slice(5));
  } catch {
    return null;
  }
}
