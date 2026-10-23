import {
  type AvaliacaoHora,
  type Dia,
  diaDaSemana,
  formatarData,
  formatarHora,
  formatarMm,
  formatarNumero,
  type Hora,
  type Status,
} from '@graoraiz/clima';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient as GradienteSvg, Path, Stop, Text as TextoSvg } from 'react-native-svg';

import { ehDia } from '@/components/capa-tempo';
import { IconeTempo, nomeTempo } from '@/components/icone';
import { T } from '@/components/ui';
import { Fontes, Raio } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Próximas horas lado a lado: ícone, temperatura, chuva e o semáforo da pulverização embaixo. */
export function FaixaHoras({ horas, avaliacoes, dias }: { horas: Hora[]; avaliacoes: AvaliacaoHora[]; dias: Dia[] }) {
  const tema = useTheme();
  const status = new Map(avaliacoes.map((a) => [a.hora, a.status]));
  const cor: Record<Status, string> = { bom: tema.bom, atencao: tema.atencao, ruim: tema.ruim };
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.faixa} testID="faixa-horas">
      {horas.map((h, i) => {
        const dia = dias.find((d) => d.data === h.hora.slice(0, 10));
        const s = status.get(h.hora);
        return (
          <View key={h.hora} style={estilos.coluna} accessible accessibilityLabel={`${formatarHora(h.hora)}: ${Math.round(h.temperatura)} graus, chuva ${formatarMm(h.chuva)}`}>
            <T variante="pequeno" cor={i === 0 ? tema.marca : tema.textSecondary} style={estilos.horaTexto}>
              {i === 0 ? 'Agora' : formatarHora(h.hora)}
            </T>
            <IconeTempo nome={nomeTempo(h.codigoTempo, ehDia(h.hora, dia))} tamanho={36} />
            <T variante="forte">{Math.round(h.temperatura)}°</T>
            <T variante="pequeno" cor={h.chuva >= 0.1 ? tema.chuva : tema.textSecondary} style={estilos.chuvaTexto}>
              {h.chuva >= 0.1 ? formatarMm(h.chuva) : `${h.probChuva ?? 0}%`}
            </T>
            <View style={[estilos.barraStatus, { backgroundColor: s ? cor[s] : tema.backgroundSelected }]} />
          </View>
        );
      })}
    </ScrollView>
  );
}

/** Dias com faixa de temperatura (mínima → máxima na escala do período), como no tempo do celular. */
export function ListaDias({ dias, hoje }: { dias: Dia[]; hoje: string }) {
  const tema = useTheme();
  const menor = Math.min(...dias.map((d) => d.tMin));
  const maior = Math.max(...dias.map((d) => d.tMax));
  const escala = Math.max(maior - menor, 1);
  return (
    <View testID="lista-dias">
      {dias.map((d, i) => {
        const inicio = ((d.tMin - menor) / escala) * 100;
        const largura = Math.max(((d.tMax - d.tMin) / escala) * 100, 6);
        return (
          <View
            key={d.data}
            style={[estilos.dia, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: tema.borda }]}
            accessible
            accessibilityLabel={`${d.data === hoje ? 'Hoje' : diaDaSemana(d.data, true)}: chuva ${formatarMm(d.chuva)}, máxima ${Math.round(d.tMax)}, mínima ${Math.round(d.tMin)} graus`}>
            <View style={estilos.diaNome}>
              <T variante="forte">{d.data === hoje ? 'Hoje' : diaDaSemana(d.data)}</T>
              <T variante="pequeno">{formatarData(d.data)}</T>
            </View>
            <IconeTempo nome={nomeTempo(d.codigoTempo, true)} tamanho={34} />
            <View style={estilos.diaChuva}>
              <T variante="forte" cor={d.chuva >= 1 ? tema.chuva : tema.textSecondary} style={estilos.textoChuva}>
                {d.chuva >= 0.5 ? formatarMm(d.chuva) : '—'}
              </T>
              {d.probChuva !== null ? (
                <T variante="pequeno" cor={tema.textSecondary} style={estilos.textoProb}>
                  {d.probChuva}%
                </T>
              ) : null}
            </View>
            <T variante="pequeno" style={estilos.tMin}>
              {Math.round(d.tMin)}°
            </T>
            <View style={[estilos.trilha, { backgroundColor: tema.backgroundSelected }]}>
              <LinearGradient
                colors={['#5AA2FF', '#7BC67E', '#F2B33D', '#F2733D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[estilos.faixaTemp, { left: `${inicio}%`, width: `${largura}%` }]}
              />
            </View>
            <T variante="forte" style={estilos.tMax}>
              {Math.round(d.tMax)}°
            </T>
          </View>
        );
      })}
    </View>
  );
}

/** Anel de progresso (água no solo, dias da janela). */
export function Anel({ fracao, cor, tamanho = 84, espessura = 9, children }: { fracao: number; cor: string; tamanho?: number; espessura?: number; children?: React.ReactNode }) {
  const tema = useTheme();
  const r = (tamanho - espessura) / 2;
  const volta = 2 * Math.PI * r;
  const f = Math.min(Math.max(fracao, 0), 1);
  return (
    <View style={{ width: tamanho, height: tamanho, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={tamanho} height={tamanho} style={StyleSheet.absoluteFill}>
        <Circle cx={tamanho / 2} cy={tamanho / 2} r={r} stroke={tema.backgroundSelected} strokeWidth={espessura} fill="none" />
        <Circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          stroke={cor}
          strokeWidth={espessura}
          fill="none"
          strokeDasharray={`${volta * f} ${volta}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

/** Linha do vigor (NDVI) do talhão ao longo das passagens do satélite. */
export function GraficoVigor({ pontos, largura = 320, altura = 150 }: { pontos: { data: string; valor: number }[]; largura?: number; altura?: number }) {
  const tema = useTheme();
  if (pontos.length === 0) return null;
  const margem = { esq: 30, dir: 10, topo: 10, base: 22 };
  const w = largura - margem.esq - margem.dir;
  const h = altura - margem.topo - margem.base;
  const min = Math.min(0.1, ...pontos.map((p) => p.valor));
  const max = Math.max(0.9, ...pontos.map((p) => p.valor));
  const x = (i: number) => margem.esq + (pontos.length === 1 ? w / 2 : (i / (pontos.length - 1)) * w);
  const y = (v: number) => margem.topo + h - ((v - min) / (max - min)) * h;
  const linha = pontos.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.valor).toFixed(1)}`).join(' ');
  const area = `${linha} L${x(pontos.length - 1).toFixed(1)},${margem.topo + h} L${x(0).toFixed(1)},${margem.topo + h} Z`;
  const marcas = [0.2, 0.5, 0.8].filter((v) => v >= min && v <= max);
  return (
    <Svg width={largura} height={altura} accessibilityLabel="Gráfico do vigor do talhão">
      <Defs>
        <GradienteSvg id="vigor" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={tema.bom} stopOpacity="0.35" />
          <Stop offset="1" stopColor={tema.bom} stopOpacity="0" />
        </GradienteSvg>
      </Defs>
      {marcas.map((v) => (
        <Line key={v} x1={margem.esq} x2={largura - margem.dir} y1={y(v)} y2={y(v)} stroke={tema.borda} strokeDasharray="4 4" />
      ))}
      {marcas.map((v) => (
        <TextoSvg key={`t${v}`} x={4} y={y(v) + 4} fontSize={10} fill={tema.textSecondary} fontFamily={Fontes.media}>
          {formatarNumero(v, 1)}
        </TextoSvg>
      ))}
      <Path d={area} fill="url(#vigor)" />
      <Path d={linha} stroke={tema.bom} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {pontos.map((p, i) => (
        <Circle key={p.data} cx={x(i)} cy={y(p.valor)} r={i === pontos.length - 1 ? 5 : 3.5} fill={tema.backgroundElement} stroke={tema.bom} strokeWidth={2.5} />
      ))}
      {pontos.map((p, i) =>
        i === 0 || i === pontos.length - 1 || pontos.length <= 5 ? (
          <TextoSvg key={`d${p.data}`} x={x(i)} y={altura - 6} fontSize={10} fill={tema.textSecondary} textAnchor="middle" fontFamily={Fontes.media}>
            {formatarData(p.data)}
          </TextoSvg>
        ) : null,
      )}
    </Svg>
  );
}

const estilos = StyleSheet.create({
  faixa: { gap: 4, paddingVertical: 4 },
  coluna: { width: 58, alignItems: 'center', gap: 4, paddingVertical: 6 },
  horaTexto: { fontSize: 12 },
  chuvaTexto: { fontSize: 12 },
  barraStatus: { width: 30, height: 6, borderRadius: Raio.total, marginTop: 2 },
  dia: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 56 },
  diaNome: { width: 56 },
  diaChuva: { width: 54, alignItems: 'flex-end' },
  textoChuva: { fontSize: 14 },
  textoProb: { fontSize: 12, lineHeight: 15 },
  tMin: { width: 28, textAlign: 'right' },
  trilha: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  faixaTemp: { position: 'absolute', top: 0, bottom: 0, borderRadius: 3 },
  tMax: { width: 32 },
});
