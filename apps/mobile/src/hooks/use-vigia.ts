import { dataDe, diasSemChuva, type ItemVigia, somarDias, vigiar } from '@graoraiz/clima';
import { useMemo } from 'react';

import { useChuvaSafra } from '@/hooks/use-chuva-safra';
import type { Previsao, Resultado } from '@/lib/dados-clima';
import { type Talhao, useEstado } from '@/lib/estado';

/** O que o vigia tem a dizer sobre o talhão agora (alertas em ordem de urgência). */
export function useVigia(talhao: Talhao | null, resultado: Resultado<Previsao> | null, agora: string): ItemVigia[] {
  const estado = useEstado();
  const hoje = dataDe(agora);
  const { registros } = useChuvaSafra(talhao, hoje);

  return useMemo(() => {
    if (!talhao || !resultado) return [];
    const plantado = Boolean(talhao.dataPlantio && talhao.dataPlantio <= hoje);
    return vigiar({
      talhao: { id: talhao.id, nome: talhao.nome, cultura: talhao.cultura, solo: talhao.solo, zarc: talhao.zarc, plantado, baixada: talhao.baixada },
      horas: resultado.dados.horas,
      dias: resultado.dados.dias,
      agora,
      limiares: estado.limiares,
      aplicacoes: estado.aplicacoes.filter((a) => a.talhaoId === talhao.id),
      diasSemChuva: registros.length ? diasSemChuva(registros, somarDias(hoje, -1)) : null,
    });
  }, [talhao, resultado, agora, hoje, estado.limiares, estado.aplicacoes, registros]);
}
