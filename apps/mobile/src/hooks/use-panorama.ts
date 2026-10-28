import { type DiaDiarioBruto, type DiaObservado, mesclarChuva, somarDias } from '@graoraiz/clima';
import { useEffect, useMemo, useState } from 'react';

import { buscarDiario, buscarNormal } from '@/lib/dados-clima';
import { type Talhao, useEstado } from '@/lib/estado';

export interface Panorama {
  inicio: string;
  fim: string;
  /** Um dia por linha: chuva (o pluviômetro vence a estimativa), mínima, máxima e rajada. */
  diario: DiaObservado[];
  /** Dias com chuva medida pelo produtor. */
  anotados: number;
  /** Chuva média do mesmo período em 1991–2020; null enquanto carrega ou se indisponível. */
  normal: number | null;
  carregando: boolean;
  erro: string | null;
  /** true se a estimativa não pôde ser atualizada (sem internet). */
  semInternet: boolean;
}

interface Bruto {
  chave: string;
  dados: DiaDiarioBruto[];
  semInternet: boolean;
  erro: string | null;
}

/** Os últimos `dias` do talhão (até ontem) numa série só, para o painel de 3 meses. */
export function usePanorama(talhao: Talhao | null, hoje: string, dias = 90): Panorama {
  const estado = useEstado();
  const inicio = somarDias(hoje, -dias);
  const fim = somarDias(hoje, -1);
  const lat = talhao?.lat;
  const lon = talhao?.lon;
  const chave = lat !== undefined && lon !== undefined ? `${lat}:${lon}:${inicio}` : null;
  const [bruto, setBruto] = useState<Bruto | null>(null);
  const [normal, setNormal] = useState<{ chave: string; valor: number | null } | null>(null);

  useEffect(() => {
    if (lat === undefined || lon === undefined || chave === null) return;
    let ativo = true;
    buscarDiario({ lat, lon }, inicio).then(
      (r) => ativo && setBruto({ chave, dados: r.dados, semInternet: r.desatualizado, erro: null }),
      (e) => ativo && setBruto({ chave, dados: [], semInternet: true, erro: e instanceof Error ? e.message : 'Sem conexão para buscar o diário.' }),
    );
    void buscarNormal({ lat, lon }, inicio, fim).then((valor) => ativo && setNormal({ chave, valor }));
    return () => {
      ativo = false;
    };
  }, [chave, lat, lon, inicio, fim]);

  const atual = bruto?.chave === chave ? bruto : null;

  const { diario, anotados } = useMemo(() => {
    if (!talhao) return { diario: [], anotados: 0 };
    const anotadas = estado.chuvas.filter((c) => c.talhaoId === talhao.id && c.data >= inicio && c.data <= fim);
    const estimados = (atual?.dados ?? []).filter((d) => d.data >= inicio && d.data <= fim);
    const porData = new Map(estimados.map((d) => [d.data, d]));
    const registros = mesclarChuva(
      anotadas,
      estimados.map(({ data, mm }) => ({ data, mm })),
    );
    return {
      diario: registros.map((r): DiaObservado => {
        const d = porData.get(r.data);
        return { data: r.data, chuva: r.mm, tMin: d?.tMin, tMax: d?.tMax, rajada: d?.rajada };
      }),
      anotados: registros.filter((r) => r.origem === 'manual').length,
    };
  }, [estado.chuvas, atual, talhao, inicio, fim]);

  return {
    inicio,
    fim,
    diario,
    anotados,
    normal: normal?.chave === chave ? normal.valor : null,
    carregando: chave !== null && atual === null,
    erro: atual?.erro ?? null,
    semInternet: atual?.semInternet ?? false,
  };
}