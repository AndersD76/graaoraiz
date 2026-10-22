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

function celula(p: Ponto): string {
  return `${arredondarCoordenada(p.lat)}:${arredondarCoordenada(p.lon)}`;
}

async function buscarJson(url: string): Promise<RespostaOpenMeteo> {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Falha ao buscar dados (${resposta.status})`);
  const json = (await resposta.json()) as RespostaOpenMeteo;
  if (json.error) throw new Error(json.reason ?? 'Resposta inválida do serviço de previsão');
  return json;
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
      const url = API_URL
        ? `${API_URL}/api/previsao?lat=${p.lat}&lon=${p.lon}&dias=7`
        : urlPrevisao(p.lat, p.lon, { diasPrevisao: 7 });
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
        ? `${API_URL}/api/previsao?lat=${p.lat}&lon=${p.lon}&dias=1&passados=92`
        : urlChuvaRecente(p.lat, p.lon, 92);
      const pedidos: Promise<{ data: string; mm: number }[]>[] = [buscarJson(recenteUrl).then(lerChuvaDiaria)];
      if (inicio < limiteRecente) {
        const fimAntigo = somarDias(limiteRecente, -1);
        const antigoUrl = API_URL
          ? `${API_URL}/api/historico?lat=${p.lat}&lon=${p.lon}&inicio=${inicio}&fim=${fimAntigo}`
          : urlHistoricoChuva(p.lat, p.lon, inicio, fimAntigo);
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
      ? `${API_URL}/api/historico?lat=${p.lat}&lon=${p.lon}&inicio=1991-01-01&fim=2020-12-31`
      : urlHistoricoChuva(p.lat, p.lon, '1991-01-01', '2020-12-31');
    return lerChuvaDiaria(await buscarJson(url));
  });
  return resultado.dados;
}

/** Média histórica da chuva acumulada entre dois dias ("AAAA-MM-DD"); null se não der para calcular. */
export async function buscarNormal(p: Ponto, inicio: string, fim: string): Promise<number | null> {
  try {
    const serie = await serieHistorica(p);
    return normalAcumulada(serie, inicio.slice(5), fim.slice(5));
  } catch {
    return null;
  }
}
