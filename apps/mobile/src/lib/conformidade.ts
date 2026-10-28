import type { Anel, ResultadoConformidade } from '@graoraiz/clima';
import { useCallback, useEffect, useState } from 'react';

import { gravar, ler } from '@/lib/armazenamento';
import { SERVIDOR_URL } from '@/lib/config';

/**
 * Checagem da EUDR e do crédito rural do talhão, feita pelo servidor (apps/web: /api/conformidade)
 * com o PRODES/INPE e o CAR. A última consulta fica salva, com a data, para abrir sem internet.
 */

const VALIDADE_MS = 24 * 60 * 60 * 1000;
const LIMITE_REDE_MS = 60_000;

function chave(texto: string): string {
  let h = 5381;
  for (const c of texto) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0;
  return `graoraiz:conformidade:${h.toString(36)}`;
}

async function buscar(contorno: Anel): Promise<ResultadoConformidade> {
  if (!SERVIDOR_URL) throw new Error('A checagem precisa do servidor do Grão Raiz.');
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), LIMITE_REDE_MS);
  try {
    const resposta = await fetch(`${SERVIDOR_URL}/api/conformidade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contorno }),
      signal: controle.signal,
    });
    const json = (await resposta.json().catch(() => null)) as (ResultadoConformidade & { erro?: string }) | null;
    if (!resposta.ok || !json) throw new Error(json?.erro ?? 'A checagem não pôde ser feita agora.');
    return json;
  } catch (e) {
    if (controle.signal.aborted) throw new Error('Os serviços do INPE e do CAR demoraram demais. Tente de novo.');
    throw e instanceof Error ? e : new Error('Sem conexão para fazer a checagem.');
  } finally {
    clearTimeout(limite);
  }
}

export interface EstadoConformidade {
  resultado: ResultadoConformidade | null;
  carregando: boolean;
  erro: string | null;
  /** Mostrando a última consulta salva porque a rede falhou. */
  desatualizado: boolean;
  atualizar: () => void;
}

type Interno = Omit<EstadoConformidade, 'atualizar'> & { chave: string | null };

function fresco(k: string): boolean {
  const salvo = ler<{ em: number }>(k);
  return salvo !== null && Date.now() - salvo.em < VALIDADE_MS;
}

function inicial(k: string | null): Interno {
  return {
    chave: k,
    resultado: k ? (ler<{ resultado: ResultadoConformidade }>(k)?.resultado ?? null) : null,
    carregando: k !== null && !fresco(k),
    erro: null,
    desatualizado: false,
  };
}

/** Mostra a última checagem do contorno na hora e consulta de novo se ela tiver mais de um dia. */
export function useConformidade(contorno: Anel | null): EstadoConformidade {
  // O contorno entra como texto: outro array com os mesmos pontos não repete a consulta.
  const texto = contorno && contorno.length >= 3 ? JSON.stringify(contorno) : null;
  const k = texto ? chave(texto) : null;
  const [interno, setInterno] = useState<Interno>(() => inicial(k));
  const atual = interno.chave === k ? interno : inicial(k);

  const aplicar = useCallback(
    (pedidoK: string, pedido: Promise<ResultadoConformidade>, ativo: () => boolean = () => true) =>
      pedido.then(
        (resultado) => {
          // Com alguma fonte fora do ar o resultado vale para ver, mas não para guardar como definitivo.
          if (!resultado.falhas.length) gravar(pedidoK, { resultado, em: Date.now() });
          if (ativo()) setInterno({ chave: pedidoK, resultado, carregando: false, erro: null, desatualizado: false });
        },
        (e: unknown) => {
          const erro = e instanceof Error ? e.message : 'Sem conexão para fazer a checagem.';
          if (ativo()) setInterno((s) => ({ ...(s.chave === pedidoK ? s : inicial(pedidoK)), carregando: false, erro, desatualizado: (s.chave === pedidoK ? s : inicial(pedidoK)).resultado !== null }));
        },
      ),
    [],
  );

  useEffect(() => {
    if (!k || !texto || fresco(k)) return;
    let ativo = true;
    void aplicar(k, buscar(JSON.parse(texto) as Anel), () => ativo);
    return () => {
      ativo = false;
    };
  }, [k, texto, aplicar]);

  const atualizar = useCallback(() => {
    if (!k || !texto) return;
    setInterno((s) => ({ ...(s.chave === k ? s : inicial(k)), carregando: true, erro: null }));
    void aplicar(k, buscar(JSON.parse(texto) as Anel));
  }, [k, texto, aplicar]);

  const { chave: _k, ...resto } = atual;
  return { ...resto, atualizar };
}
