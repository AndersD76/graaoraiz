import { mesclarChuva, type RegistroChuva, safraDe, somarDias } from '@graoraiz/clima';
import { useEffect, useMemo, useState } from 'react';

import { buscarChuvaEstimada, buscarNormal } from '@/lib/dados-clima';
import { type Talhao, useEstado } from '@/lib/estado';

export interface ChuvaSafra {
  /** Anotada + estimada, do início da safra até hoje. */
  registros: RegistroChuva[];
  /** Média histórica acumulada até ontem; null enquanto carrega ou se indisponível. */
  normal: number | null;
  carregando: boolean;
  /** true se a estimativa não pôde ser atualizada (sem internet). */
  semEstimativa: boolean;
}

interface Estimativa {
  chave: string;
  estimada: { data: string; mm: number }[];
  semEstimativa: boolean;
}

interface Normal {
  chave: string;
  valor: number | null;
}

/**
 * Junta as anotações do produtor com a estimativa automática para a safra atual.
 * `hoje` vem do relógio compartilhado (useAgora), para virar o dia sem reabrir o app.
 */
export function useChuvaSafra(talhao: Talhao | null, hoje: string): ChuvaSafra {
  const estado = useEstado();
  const safra = safraDe(hoje);
  const lat = talhao?.lat;
  const lon = talhao?.lon;
  const chave = lat !== undefined && lon !== undefined ? `${lat}:${lon}:${safra.inicio}:${hoje}` : null;
  const [estimativa, setEstimativa] = useState<Estimativa | null>(null);
  const [normal, setNormal] = useState<Normal | null>(null);

  // Estimativa e média histórica chegam separadas: a série de 30 anos não atrasa o resto.
  useEffect(() => {
    if (lat === undefined || lon === undefined || chave === null) return;
    let ativo = true;
    buscarChuvaEstimada({ lat, lon }, safra.inicio)
      .then(
        (r) => ({ estimada: r.dados, semEstimativa: r.desatualizado }),
        () => ({ estimada: [], semEstimativa: true }),
      )
      .then((r) => ativo && setEstimativa({ chave, ...r }));
    void buscarNormal({ lat, lon }, safra.inicio, somarDias(hoje, -1)).then((valor) => ativo && setNormal({ chave, valor }));
    return () => {
      ativo = false;
    };
  }, [chave, lat, lon, safra.inicio, hoje]);

  const atual = estimativa?.chave === chave ? estimativa : null;

  const registros = useMemo(() => {
    if (!talhao) return [];
    const anotadas = estado.chuvas.filter((c) => c.talhaoId === talhao.id && c.data >= safra.inicio && c.data <= hoje);
    return mesclarChuva(anotadas, atual?.estimada ?? []);
  }, [estado.chuvas, atual, talhao, safra.inicio, hoje]);

  return {
    registros,
    normal: normal?.chave === chave ? normal.valor : null,
    carregando: chave !== null && atual === null,
    semEstimativa: atual?.semEstimativa ?? false,
  };
}
