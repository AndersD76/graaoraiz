import { useEffect, useState } from 'react';

import { gravar, ler } from '@/lib/armazenamento';
import { SERVIDOR_URL } from '@/lib/config';

/**
 * Município do talhão pela malha do IBGE, consultado pelo servidor (apps/web: /api/municipio).
 * Fica salvo no aparelho para sempre: a cidade de um ponto não muda.
 */
export interface Municipio {
  nome: string;
  uf: string;
  codigo: string;
}

function chave(lat: number, lon: number): string {
  return `graoraiz:municipio:${lat.toFixed(3)},${lon.toFixed(3)}`;
}

export function useMunicipio(lat: number | undefined, lon: number | undefined): Municipio | null {
  const k = lat !== undefined && lon !== undefined ? chave(lat, lon) : null;
  const [buscado, setBuscado] = useState<{ k: string; municipio: Municipio } | null>(null);
  const salvo = k ? ler<Municipio>(k) : null;

  useEffect(() => {
    if (!k || lat === undefined || lon === undefined || !SERVIDOR_URL || ler<Municipio>(k)) return;
    let ativo = true;
    fetch(`${SERVIDOR_URL}/api/municipio?lat=${lat.toFixed(3)}&lon=${lon.toFixed(3)}`)
      .then((r) => (r.ok ? (r.json() as Promise<Municipio>) : null))
      .then((municipio) => {
        if (!municipio?.nome) return;
        gravar(k, municipio);
        if (ativo) setBuscado({ k, municipio });
      })
      .catch(() => {}); // sem internet: aparece só o nome do talhão, e tenta de novo na próxima vez
    return () => {
      ativo = false;
    };
  }, [k, lat, lon]);

  return salvo ?? (buscado?.k === k ? buscado.municipio : null);
}
