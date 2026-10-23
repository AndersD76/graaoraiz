import { useEffect, useState } from 'react';

import type { Talhao } from '@/lib/estado';
import { serieVigor, type Vigor } from '@/lib/satelite';

interface EstadoVigor {
  chave: string | null;
  serie: Vigor[] | null;
  erro: string | null;
}

/** Série de vigor (NDVI) das passagens limpas do satélite sobre o talhão. */
export function useVigor(talhao: Talhao | null, maximo = 10): { serie: Vigor[] | null; carregando: boolean; erro: string | null } {
  const chave = talhao ? `${talhao.id}:${talhao.lat}:${talhao.lon}:${JSON.stringify(talhao.contorno)}:${talhao.areaHa}:${maximo}` : null;
  const [estado, setEstado] = useState<EstadoVigor>({ chave: null, serie: null, erro: null });

  useEffect(() => {
    if (!talhao || chave === null) return;
    let ativo = true;
    serieVigor(talhao, maximo).then(
      (serie) => ativo && setEstado({ chave, serie, erro: null }),
      (e) => ativo && setEstado({ chave, serie: null, erro: e instanceof Error ? e.message : 'Não foi possível buscar as imagens.' }),
    );
    return () => {
      ativo = false;
    };
  }, [chave, talhao, maximo]);

  const atual = estado.chave === chave ? estado : null;
  return { serie: atual?.serie ?? null, carregando: chave !== null && atual === null, erro: atual?.erro ?? null };
}
