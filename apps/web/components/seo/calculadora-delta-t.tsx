'use client';

import { deltaT, LIMIARES_PULVERIZACAO_PADRAO as L, temperaturaBulboUmido } from '@graoraiz/clima';
import { useMemo, useRef, useState } from 'react';
import { type ContextoPagina, enviarEvento } from './rastreio';

const fmt1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });

function ler(v: string): number | null {
  const n = Number(v.replace(',', '.'));
  return v.trim() !== '' && Number.isFinite(n) ? n : null;
}

/** Calculadora de delta T: resultado na hora, sem cadastro (isca "calculadora-delta-t"). */
export function CalculadoraDeltaT({ contexto }: { contexto: ContextoPagina }) {
  const [temperatura, setTemperatura] = useState('25');
  const [umidade, setUmidade] = useState('60');
  const iniciou = useRef(false);
  const concluiu = useRef(false);

  const t = ler(temperatura);
  const ur = ler(umidade);
  const valido = t !== null && ur !== null && t >= -10 && t <= 50 && ur >= 5 && ur <= 100;
  const resultado = useMemo(() => (valido ? { dt: deltaT(t!, ur!), bu: temperaturaBulboUmido(t!, ur!) } : null), [valido, t, ur]);

  const faixa = !resultado
    ? null
    : resultado.dt > L.deltaT.maximo
      ? { tom: 'text-ruim', texto: 'Ar muito seco: as gotas evaporam antes de chegar à folha. Não aplicar.' }
      : resultado.dt > L.deltaT.idealMaximo
        ? { tom: 'text-atencao', texto: 'Acima do ideal: use gotas maiores e evite as horas mais quentes.' }
        : resultado.dt < L.deltaT.idealMinimo
          ? { tom: 'text-atencao', texto: 'Ar quase saturado: risco de escorrimento e de inversão térmica com vento fraco.' }
          : { tom: 'text-bom', texto: 'Na faixa boa para aplicar (confira também vento e chuva).' };

  const mudou = (f: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    f(e.target.value);
    if (!iniciou.current) {
      iniciou.current = true;
      enviarEvento('isca_iniciada', contexto);
    }
  };
  const aoSair = () => {
    if (resultado && iniciou.current && !concluiu.current) {
      concluiu.current = true;
      enviarEvento('isca_concluida', contexto, { delta_t: Math.round(resultado.dt * 10) / 10 });
    }
  };

  return (
    <div data-isca="calculadora-delta-t" className="rounded-2xl border border-linha p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-semibold">Temperatura do ar (°C)</span>
          <input inputMode="decimal" value={temperatura} onChange={mudou(setTemperatura)} onBlur={aoSair} className="min-h-11 rounded-xl border border-campo px-3 text-lg" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-semibold">Umidade relativa (%)</span>
          <input inputMode="decimal" value={umidade} onChange={mudou(setUmidade)} onBlur={aoSair} className="min-h-11 rounded-xl border border-campo px-3 text-lg" />
        </label>
      </div>
      <div aria-live="polite" className="mt-5 rounded-xl bg-superficie p-4">
        {resultado && faixa ? (
          <>
            <p className="text-3xl font-bold tabular-nums">ΔT = {fmt1.format(resultado.dt)} °C</p>
            <p className={`mt-1 font-semibold ${faixa.tom}`}>{faixa.texto}</p>
            <p className="mt-2 text-sm text-texto-2">Temperatura de bulbo úmido: {fmt1.format(resultado.bu)} °C (fórmula de Stull, 2011).</p>
          </>
        ) : (
          <p className="text-texto-2">Informe a temperatura (−10 a 50 °C) e a umidade (5 a 100%).</p>
        )}
      </div>
    </div>
  );
}
