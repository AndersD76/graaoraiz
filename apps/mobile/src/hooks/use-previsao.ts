import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { buscarPrevisao, type Previsao, previsaoEmCache, type Resultado } from '@/lib/dados-clima';

interface EstadoInterno {
  chave: string | null;
  resultado: Resultado<Previsao> | null;
  carregando: boolean;
  erro: string | null;
}

export interface EstadoPrevisao {
  resultado: Resultado<Previsao> | null;
  carregando: boolean;
  erro: string | null;
  atualizar: () => Promise<void>;
}

function mensagem(e: unknown): string {
  return e instanceof Error ? e.message : 'Não foi possível buscar a previsão.';
}

/**
 * Previsão do talhão: mostra o cache na hora e atualiza pela rede em seguida.
 * Ao voltar para o app, busca de novo (o cache de 1 h evita downloads repetidos).
 */
export function usePrevisao(lat: number | undefined, lon: number | undefined): EstadoPrevisao {
  const chave = lat !== undefined && lon !== undefined ? `${lat}:${lon}` : null;
  const [interno, setInterno] = useState<EstadoInterno>({ chave: null, resultado: null, carregando: false, erro: null });

  // Ao trocar de talhão, mostra o que houver em cache até a rede responder.
  const atual: EstadoInterno =
    interno.chave === chave
      ? interno
      : {
          chave,
          resultado: lat !== undefined && lon !== undefined ? previsaoEmCache({ lat, lon }) : null,
          carregando: chave !== null,
          erro: null,
        };

  useEffect(() => {
    if (lat === undefined || lon === undefined || chave === null) return;
    let ativo = true;
    const buscar = () =>
      buscarPrevisao({ lat, lon }).then(
        (resultado) => ativo && setInterno({ chave, resultado, carregando: false, erro: null }),
        (e) => ativo && setInterno({ chave, resultado: previsaoEmCache({ lat, lon }), carregando: false, erro: mensagem(e) }),
      );
    void buscar();
    const voltaAoApp = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void buscar();
    });
    return () => {
      ativo = false;
      voltaAoApp.remove();
    };
  }, [chave, lat, lon]);

  const atualizar = useCallback(async () => {
    if (lat === undefined || lon === undefined || chave === null) return;
    // Nunca reaproveita o resultado de outro talhão enquanto atualiza.
    setInterno((s) => ({
      chave,
      resultado: s.chave === chave ? s.resultado : previsaoEmCache({ lat, lon }),
      carregando: true,
      erro: null,
    }));
    try {
      const resultado = await buscarPrevisao({ lat, lon }, true);
      setInterno({ chave, resultado, carregando: false, erro: null });
    } catch (e) {
      setInterno((s) => ({ ...s, chave, carregando: false, erro: mensagem(e) }));
    }
  }, [chave, lat, lon]);

  return { resultado: atual.resultado, carregando: atual.carregando, erro: atual.erro, atualizar };
}
