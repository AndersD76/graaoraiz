import { useEffect, useSyncExternalStore } from 'react';

import { gravar, ler } from '@/lib/armazenamento';
import { talhaoAtual, type Talhao, useEstado } from '@/lib/estado';
import { type Coordenada, localizacaoAtual } from '@/lib/localizacao';

/**
 * Onde a pessoa está, para mostrar o tempo antes do primeiro talhão (com ou sem conta).
 * Fica só no aparelho; o talhão de verdade continua pedindo conta.
 */

const CHAVE = 'graoraiz:local-consulta';

export type BuscaLocal = 'parado' | 'buscando' | 'negado';

interface EstadoLocal {
  local: Coordenada | null;
  busca: BuscaLocal;
}

let atual: EstadoLocal = { local: ler<Coordenada>(CHAVE), busca: 'parado' };
const ouvintes = new Set<() => void>();

function mudar(novo: Partial<EstadoLocal>): void {
  atual = { ...atual, ...novo };
  ouvintes.forEach((o) => o());
}

function assinarLocal(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

const obterLocal = () => atual;

/** Pede a localização (o navegador ou o celular perguntam na primeira vez). */
export async function buscarLocalConsulta(): Promise<void> {
  if (atual.busca === 'buscando') return;
  mudar({ busca: 'buscando' });
  const c = await localizacaoAtual().catch(() => null);
  if (c) gravar(CHAVE, c);
  mudar(c ? { local: c, busca: 'parado' } : { busca: 'negado' });
}

let consultaPronta: { de: Coordenada; talhao: Talhao } | null = null;

/**
 * Talhão "de consulta" no ponto onde a pessoa está: só para previsão e vigia, nunca é salvo.
 * O mesmo objeto enquanto o ponto não muda (as buscas de previsão dependem dele).
 */
function talhaoDeConsulta(c: Coordenada): Talhao {
  if (consultaPronta?.de !== c) {
    consultaPronta = {
      de: c,
      talhao: { id: 'consulta', nome: 'Onde você está', lat: c.lat, lon: c.lon, cultura: null, dataPlantio: null, criadoEm: '', solo: 'medio', zarc: null, areaHa: null, contorno: null, baixada: false },
    };
  }
  return consultaPronta.talhao;
}

/**
 * Talhão para as telas de tempo (Hoje, pulverização, boletim, últimos 3 meses): o selecionado ou,
 * sem nenhum cadastrado, o ponto onde a pessoa está (pede a localização na primeira vez).
 */
export function useTalhaoDoTempo(): { talhao: Talhao | null; consulta: boolean; busca: BuscaLocal } {
  const salvo = talhaoAtual(useEstado());
  const { local, busca } = useSyncExternalStore(assinarLocal, obterLocal, obterLocal);

  useEffect(() => {
    if (!salvo && !local && atual.busca === 'parado') void buscarLocalConsulta();
  }, [salvo, local]);

  if (salvo) return { talhao: salvo, consulta: false, busca };
  return { talhao: local ? talhaoDeConsulta(local) : null, consulta: local !== null, busca };
}
