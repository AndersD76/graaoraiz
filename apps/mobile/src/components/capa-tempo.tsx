import { type Dia, descreverTempo, formatarMm, type Hora } from '@graoraiz/clima';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icone, IconeTempo, nomeTempo, type NomeIcone } from '@/components/icone';
import { T } from '@/components/ui';
import { Raio, Spacing } from '@/constants/theme';

type Ceu = 'limpo' | 'nublado' | 'chuva' | 'trovoada' | 'noite' | 'amanhecer' | 'entardecer';

const GRADIENTES: Record<Ceu, readonly [string, string, string]> = {
  limpo: ['#1F6FD1', '#4B9BEA', '#8CC8F7'],
  nublado: ['#4F6A82', '#728CA3', '#A3B6C6'],
  chuva: ['#273A4F', '#3F5870', '#6B8499'],
  trovoada: ['#1D2136', '#363D5C', '#5A6283'],
  noite: ['#08122A', '#15264D', '#2C4377'],
  amanhecer: ['#3B5BA8', '#D9786A', '#F5B66E'],
  entardecer: ['#2D3E80', '#B5577A', '#F09A5E'],
};

/** Hora "de dia" pelo nascer e pôr do sol do dia, ou 6h–18h quando não houver. */
export function ehDia(hora: string, dia?: Pick<Dia, 'nascerSol' | 'porSol'>): boolean {
  const hh = hora.slice(11, 16);
  const nascer = dia?.nascerSol?.slice(11, 16) ?? '06:00';
  const por = dia?.porSol?.slice(11, 16) ?? '18:00';
  return hh >= nascer && hh < por;
}

function ceuDe(h: Hora, dia?: Dia): Ceu {
  const codigo = h.codigoTempo ?? 0;
  if (codigo >= 95) return 'trovoada';
  if (h.chuva >= 0.3 || (codigo >= 51 && codigo <= 82)) return 'chuva';
  const hh = h.hora.slice(11, 16);
  const nascer = dia?.nascerSol?.slice(11, 16) ?? '06:00';
  const por = dia?.porSol?.slice(11, 16) ?? '18:00';
  if (!ehDia(h.hora, dia)) return 'noite';
  const minutos = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
  if (minutos(hh) - minutos(nascer) < 75) return 'amanhecer';
  if (minutos(por) - minutos(hh) < 75) return 'entardecer';
  return codigo >= 3 ? 'nublado' : 'limpo';
}

function Indicador({ icone, valor, rotulo }: { icone: NomeIcone; valor: string; rotulo: string }) {
  return (
    <View style={estilos.indicador} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      <Icone nome={icone} tamanho={18} cor="rgba(255,255,255,0.9)" />
      <View>
        <T variante="forte" cor="#ffffff" style={estilos.valorIndicador}>
          {valor}
        </T>
        <T variante="pequeno" cor="rgba(255,255,255,0.75)" style={estilos.rotuloIndicador}>
          {rotulo}
        </T>
      </View>
    </View>
  );
}

/** Capa da tela Hoje: céu do momento no talhão, temperatura e condições principais. */
export function CapaTempo({
  hora,
  dia,
  topo,
  rodape,
}: {
  hora: Hora;
  dia?: Dia;
  /** Linha acima da temperatura (talhão, troca de talhão). */
  topo?: ReactNode;
  /** Conteúdo sobre o gradiente, embaixo (ex.: frase do dia). */
  rodape?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const ceu = ceuDe(hora, dia);
  const diurno = ehDia(hora.hora, dia);
  return (
    <LinearGradient colors={GRADIENTES[ceu]} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={[estilos.capa, { paddingTop: insets.top + Spacing.three }]} testID="capa-tempo">
      {topo}
      <View style={estilos.principal}>
        <View style={estilos.flex}>
          <T variante="display" cor="#ffffff" accessibilityLabel={`${Math.round(hora.temperatura)} graus`}>
            {Math.round(hora.temperatura)}°
          </T>
          <T variante="subtitulo" cor="#ffffff">
            {descreverTempo(hora.codigoTempo) || (diurno ? 'Tempo aberto' : 'Noite')}
          </T>
          {dia ? (
            <T variante="forte" cor="rgba(255,255,255,0.85)">
              Máx. {Math.round(dia.tMax)}° · Mín. {Math.round(dia.tMin)}°
            </T>
          ) : null}
        </View>
        <IconeTempo nome={nomeTempo(hora.codigoTempo, diurno)} tamanho={132} />
      </View>
      <View style={estilos.indicadores}>
        <Indicador icone="vento" valor={`${Math.round(hora.vento10m)} km/h`} rotulo="vento" />
        <Indicador icone="gotaMeia" valor={`${Math.round(hora.umidade)}%`} rotulo="umidade" />
        <Indicador icone="guardaChuva" valor={dia ? formatarMm(dia.chuva) : formatarMm(hora.chuva)} rotulo="chuva hoje" />
      </View>
      {rodape}
    </LinearGradient>
  );
}

const estilos = StyleSheet.create({
  capa: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
    borderBottomLeftRadius: Raio.grande + 8,
    borderBottomRightRadius: Raio.grande + 8,
    marginHorizontal: -Spacing.three,
  },
  principal: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1, gap: 2 },
  indicadores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: Raio.medio,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  indicador: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  valorIndicador: { fontSize: 15, lineHeight: 19 },
  rotuloIndicador: { fontSize: 12, lineHeight: 15 },
});
