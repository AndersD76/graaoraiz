import { useState } from 'react';

import { Campo } from '@/components/ui';
import type { Coordenada } from '@/lib/localizacao';

function ler(texto: string): number {
  return Number(texto.replace(',', '.'));
}

/** GPS e mapa dão 15 casas; 6 bastam (cerca de 10 cm). */
function mostrar(n: number): string {
  return String(Number(n.toFixed(6)));
}

function chaveDe(c: Coordenada | null): string | null {
  return c ? `${c.lat},${c.lon}` : null;
}

interface Digitado {
  lat: string;
  lon: string;
  /** Coordenada vigente depois da última tecla; se mudar por fora (mapa, GPS), os campos mostram a nova. */
  chave: string | null;
}

/** Latitude e longitude digitadas: alternativa ao mapa (sem internet ou sem GPS). */
export function CamposCoordenada({ coordenada, aoMudar }: { coordenada: Coordenada | null; aoMudar: (c: Coordenada) => void }) {
  const [digitado, setDigitado] = useState<Digitado | null>(null);
  const chaveAtual = chaveDe(coordenada);
  const usarDigitado = digitado !== null && digitado.chave === chaveAtual;
  const latTexto = usarDigitado ? digitado.lat : coordenada ? mostrar(coordenada.lat) : '';
  const lonTexto = usarDigitado ? digitado.lon : coordenada ? mostrar(coordenada.lon) : '';

  const mudar = (lat: string, lon: string) => {
    const la = ler(lat);
    const lo = ler(lon);
    const valida = lat !== '' && lon !== '' && Number.isFinite(la) && Number.isFinite(lo) && Math.abs(la) <= 90 && Math.abs(lo) <= 180;
    if (valida) aoMudar({ lat: la, lon: lo });
    setDigitado({ lat, lon, chave: valida ? chaveDe({ lat: la, lon: lo }) : chaveAtual });
  };

  return (
    <>
      <Campo
        rotulo="Latitude"
        value={latTexto}
        onChangeText={(v) => mudar(v, lonTexto)}
        keyboardType="numbers-and-punctuation"
        placeholder="-25.43"
        testID="campo-latitude"
      />
      <Campo
        rotulo="Longitude"
        value={lonTexto}
        onChangeText={(v) => mudar(latTexto, v)}
        keyboardType="numbers-and-punctuation"
        placeholder="-49.27"
        testID="campo-longitude"
      />
    </>
  );
}
