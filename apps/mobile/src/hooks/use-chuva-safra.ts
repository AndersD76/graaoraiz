import { type DiaDiarioBruto, type DiaObservado, mesclarChuva, type RegistroChuva, safraDe, somarDias } from '@graoraiz/clima';
import { useEffect, useMemo, useState } from 'react';

import { buscarDiario, buscarNormal } from '@/lib/dados-clima';
import { type Talhao, useEstado } from '@/lib/estado';

export interface ChuvaSafra {
  /** Anotada + estimada, do início da safra até hoje. */
  registros: RegistroChuva[];
  /** Diário do talhão: chuva (anotada vence a estimada), mínima, máxima e rajada. */
  diario: DiaObservado[];
  /** Média histórica acumulada até ontem; null enquanto carrega ou se indisponível. */
  normal: number | null;
  carregando: boolean;
  /** true se a estimativa não pôde ser atualizada (sem internet). */
  semEstimativa: boolean;
}

interface Estimativa {
  chave: string;
  estimado: DiaDiarioBruto[];
  semEstimativa: boolean;
}

interface Normal {
  chave: string;
  valor: number | null;
}

/**
 * Junta as anotações do produtor com o diário estimado (modelos e reanálise) da safra atual.
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

  // Diário e média histórica chegam separados: a série de 30 anos não atrasa o resto.
  useEffect(() => {
    if (lat === undefined || lon === undefined || chave === null) return;
    let ativo = true;
    buscarDiario({ lat, lon }, safra.inicio)
      .then(
        (r) => ({ estimado: r.dados, semEstimativa: r.desatualizado }),
        () => ({ estimado: [], semEstimativa: true }),
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
    return mesclarChuva(
      anotadas,
      (atual?.estimado ?? []).map(({ data, mm }) => ({ data, mm })),
    );
  }, [estado.chuvas, atual, talhao, safra.inicio, hoje]);

  const diario = useMemo(() => {
    const porData = new Map((atual?.estimado ?? []).map((d) => [d.data, d]));
    return registros.map((r): DiaObservado => {
      const d = porData.get(r.data);
      return { data: r.data, chuva: r.mm, tMin: d?.tMin, tMax: d?.tMax, rajada: d?.rajada };
    });
  }, [registros, atual]);

  return {
    registros,
    diario,
    normal: normal?.chave === chave ? normal.valor : null,
    carregando: chave !== null && atual === null,
    semEstimativa: atual?.semEstimativa ?? false,
  };
}
