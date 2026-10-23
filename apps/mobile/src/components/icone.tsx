import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';

import { FONTES_TEMPO, type NomeTempo } from '@/components/fontes-tempo';
import { ICONES, type NomeIcone } from '@/components/icones-dados';
import { ILUSTRACOES, type NomeIlustracao } from '@/components/ilustracoes-dados';
import { useTheme } from '@/hooks/use-theme';

export type { NomeIcone, NomeIlustracao, NomeTempo };

/** Ícone de interface (Phosphor duotone): traço na cor pedida e fundo a 20%. */
export function Icone({ nome, tamanho = 22, cor, corFundo }: { nome: NomeIcone; tamanho?: number; cor?: string; corFundo?: string }) {
  const tema = useTheme();
  const [fundo, traco] = ICONES[nome];
  const c = cor ?? tema.text;
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 256 256" pointerEvents="none">
      {fundo ? <Path d={fundo} fill={corFundo ?? c} opacity={corFundo ? 1 : 0.2} /> : null}
      <Path d={traco} fill={c} />
    </Svg>
  );
}

/** Ilustração 3D (Fluent Emoji) para capas, telas vazias e destaque. */
export function Ilustracao({ nome, tamanho = 96 }: { nome: NomeIlustracao; tamanho?: number }) {
  return <Image source={ILUSTRACOES[nome]} style={{ width: tamanho, height: tamanho }} contentFit="contain" accessible={false} />;
}

/** Ícone ilustrado de tempo (Meteocons): animado na web, estático no celular. */
export function IconeTempo({ nome, tamanho = 48 }: { nome: NomeTempo; tamanho?: number }) {
  return <Image source={FONTES_TEMPO[nome]} style={{ width: tamanho, height: tamanho }} contentFit="contain" accessible={false} />;
}

/** Ícone de tempo para um código da OMM, de dia ou de noite. */
export function nomeTempo(codigo: number | undefined, dia = true): NomeTempo {
  const p = dia ? 'day' : 'night';
  if (codigo === undefined) return dia ? 'partly-cloudy-day' : 'partly-cloudy-night';
  if (codigo === 0) return `clear-${p}`;
  if (codigo === 1) return `mostly-clear-${p}`;
  if (codigo === 2) return `partly-cloudy-${p}`;
  if (codigo === 3) return `overcast-${p}`;
  if (codigo === 45 || codigo === 48) return `fog-${p}`;
  if (codigo >= 51 && codigo <= 55) return `partly-cloudy-${p}-drizzle`;
  if (codigo === 56 || codigo === 57 || codigo === 66 || codigo === 67) return 'sleet';
  if (codigo === 61 || codigo === 80) return `partly-cloudy-${p}-rain`;
  if (codigo === 63 || codigo === 81) return 'rain';
  if (codigo === 65 || codigo === 82) return `extreme-${p}-rain`;
  if ((codigo >= 71 && codigo <= 77) || codigo === 85 || codigo === 86) return 'snow';
  if (codigo === 95) return `thunderstorms-${p}-rain`;
  if (codigo === 96 || codigo === 99) return `thunderstorms-${p}-hail`;
  return `partly-cloudy-${p}`;
}
