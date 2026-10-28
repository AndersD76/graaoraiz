import { useCallback, useEffect, useState } from 'react';

import { gravar, ler } from '@/lib/armazenamento';
import { SERVIDOR_URL } from '@/lib/config';
import type { AlertaPreco } from '@/lib/estado';

/**
 * Preços de referência do dia, vindos do servidor (apps/web: /api/precos): indicadores do
 * Cepea/Esalq-USP e dólar PTAX do Banco Central. Sem rede, mostra a última consulta com a data dela.
 */

export interface Indicador {
  id: number;
  produto: string;
  praca: string;
  unidade: string;
  valor: number;
  /** "2026-10-27" (diário) ou "2026-09" (mensal). */
  data: string;
  culturas: string[];
}

export interface Precos {
  indicadores: Indicador[];
  dolar: { valor: number; data: string } | null;
  buscadoEm: string;
  fontes: string;
}

const CHAVE = 'graoraiz:precos';
const VALIDADE_MS = 30 * 60 * 1000;
const LIMITE_REDE_MS = 20_000;

async function buscar(): Promise<Precos> {
  if (!SERVIDOR_URL) throw new Error('Os preços precisam do servidor do Grão Raiz.');
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), LIMITE_REDE_MS);
  try {
    const resposta = await fetch(`${SERVIDOR_URL}/api/precos`, { signal: controle.signal });
    const json = (await resposta.json().catch(() => null)) as (Precos & { erro?: string }) | null;
    if (!resposta.ok || !json) throw new Error(json?.erro ?? 'Os preços não puderam ser buscados agora.');
    return json;
  } catch (e) {
    if (controle.signal.aborted) throw new Error('A conexão demorou demais. Tente de novo com sinal melhor.');
    throw e instanceof Error ? e : new Error('Sem conexão para buscar os preços.');
  } finally {
    clearTimeout(limite);
  }
}

export interface EstadoPrecos {
  precos: Precos | null;
  carregando: boolean;
  erro: string | null;
  /** Mostrando a última consulta salva porque a rede falhou. */
  desatualizado: boolean;
  atualizar: () => void;
}

type Interno = Omit<EstadoPrecos, 'atualizar'>;

/** Preços para os avisos em segundo plano: a consulta salva se for recente, senão busca (e salva). */
export async function precosParaAvisos(): Promise<Precos | null> {
  const salvo = ler<{ precos: Precos; em: number }>(CHAVE);
  if (salvo && Date.now() - salvo.em < VALIDADE_MS) return salvo.precos;
  try {
    const precos = await buscar();
    gravar(CHAVE, { precos, em: Date.now() });
    return precos;
  } catch {
    return null; // sem rede, nada de aviso com preço velho
  }
}

export interface AvisoDePreco {
  /** Estável por indicador, direção e alvo: cada alvo avisa uma vez só. */
  id: string;
  titulo: string;
  corpo: string;
}

/** Alvos de preço atingidos pelo indicador do dia. */
export function avisosDePreco(alertas: AlertaPreco[], precos: Precos | null): AvisoDePreco[] {
  if (!precos) return [];
  return alertas.flatMap((a) => {
    const i = precos.indicadores.find((x) => x.id === a.indicador);
    if (!i) return [];
    const fonte = `${i.produto} ${i.praca}: ${formatarPreco(i)} (${i.unidade}, Cepea ${formatarDataPreco(i.data)}).`;
    const saida: AvisoDePreco[] = [];
    if (a.acima !== null && i.valor >= a.acima) {
      saida.push({ id: `preco:${i.id}:acima:${a.acima}`, titulo: `${i.produto} passou de ${formatarPreco({ valor: a.acima, unidade: i.unidade })}`, corpo: `${fonte} Seu alvo de venda chegou.` });
    }
    if (a.abaixo !== null && i.valor <= a.abaixo) {
      saida.push({ id: `preco:${i.id}:abaixo:${a.abaixo}`, titulo: `${i.produto} caiu abaixo de ${formatarPreco({ valor: a.abaixo, unidade: i.unidade })}`, corpo: `${fonte} Chegou ao limite que você marcou.` });
    }
    return saida;
  });
}

/** "160", "160,5" ou "1.499,49" → número; null se vazio ou inválido. */
export function lerValorDigitado(texto: string): number | null {
  const limpo = texto.trim().replace(/^R\$\s*/i, '').replace(/\./g, '').replace(',', '.');
  if (!limpo) return null;
  const n = Number(limpo);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function cacheFresco(): boolean {
  const cache = ler<{ em: number }>(CHAVE);
  return cache !== null && Date.now() - cache.em < VALIDADE_MS;
}

/** Mostra a última consulta na hora e busca de novo se ela tiver mais de 30 minutos. */
export function usePrecos(): EstadoPrecos {
  const [interno, setInterno] = useState<Interno>(() => ({
    precos: ler<{ precos: Precos }>(CHAVE)?.precos ?? null,
    carregando: !cacheFresco(),
    erro: null,
    desatualizado: false,
  }));

  const aplicar = useCallback(
    (pedido: Promise<Precos>, ativo: () => boolean = () => true) =>
      pedido.then(
        (precos) => {
          gravar(CHAVE, { precos, em: Date.now() });
          if (ativo()) setInterno({ precos, carregando: false, erro: null, desatualizado: false });
        },
        (e: unknown) => {
          const erro = e instanceof Error ? e.message : 'Sem conexão para buscar os preços.';
          if (ativo()) setInterno((s) => ({ ...s, carregando: false, erro, desatualizado: s.precos !== null }));
        },
      ),
    [],
  );

  useEffect(() => {
    if (cacheFresco()) return;
    let ativo = true;
    void aplicar(buscar(), () => ativo);
    return () => {
      ativo = false;
    };
  }, [aplicar]);

  const atualizar = useCallback(() => {
    setInterno((s) => ({ ...s, carregando: true }));
    void aplicar(buscar());
  }, [aplicar]);

  return { ...interno, atualizar };
}

/** "R$ 1.569,61" (ou "408,60 ¢" no algodão, cotado em centavos). */
export function formatarPreco(i: Pick<Indicador, 'valor' | 'unidade'>): string {
  const n = i.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return i.unidade.startsWith('centavos') ? `${n} ¢` : `R$ ${n}`;
}

/** "27/10" (diário) ou "09/2026" (mensal). */
export function formatarDataPreco(data: string): string {
  const [a, m, d] = data.split('-');
  return d ? `${d}/${m}` : `${m}/${a}`;
}
