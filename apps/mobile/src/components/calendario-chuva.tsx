import { formatarMes, formatarNumero, type RegistroChuva, somarDias } from '@graoraiz/clima';
import { Pressable, StyleSheet, View } from 'react-native';

import { Botao, Linha, T } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';

const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function diasDoMes(mes: string): string[] {
  const primeiro = `${mes}-01`;
  const dias: string[] = [];
  for (let d = primeiro; d.startsWith(mes); d = somarDias(d, 1)) dias.push(d);
  return dias;
}

function mesVizinho(mes: string, delta: number): string {
  const [a, m] = mes.split('-').map(Number);
  const indice = (a ?? 0) * 12 + (m ?? 1) - 1 + delta;
  return `${Math.floor(indice / 12)}-${String((indice % 12) + 1).padStart(2, '0')}`;
}

/** Mês em grade: anotado em verde forte, estimado em cinza. Toque num dia para anotar. */
export function CalendarioChuva({
  mes,
  aoMudarMes,
  registros,
  hoje,
  inicioSafra,
  selecionado,
  aoSelecionar,
}: {
  mes: string;
  aoMudarMes: (mes: string) => void;
  registros: RegistroChuva[];
  hoje: string;
  inicioSafra: string;
  selecionado: string;
  aoSelecionar: (data: string) => void;
}) {
  const tema = useTheme();
  const porData = new Map(registros.map((r) => [r.data, r]));
  const dias = diasDoMes(mes);
  const deslocamento = new Date(`${mes}-01T12:00:00Z`).getUTCDay();
  const celulas: (string | null)[] = [...Array<null>(deslocamento).fill(null), ...dias];
  const anterior = mesVizinho(mes, -1);
  const proximo = mesVizinho(mes, 1);

  return (
    <View style={estilos.caixa}>
      <Linha style={estilos.topo}>
        <Botao titulo="‹" tipo="secundario" aoTocar={() => aoMudarMes(anterior)} desabilitado={`${anterior}-31` < inicioSafra} testID="mes-anterior" />
        <T variante="subtitulo" style={estilos.titulo}>
          {formatarMes(mes)}
        </T>
        <Botao titulo="›" tipo="secundario" aoTocar={() => aoMudarMes(proximo)} desabilitado={`${proximo}-01` > hoje} testID="mes-proximo" />
      </Linha>
      <View style={estilos.grade}>
        {SEMANA.map((d, i) => (
          <View key={`s${i}`} style={estilos.celula}>
            <T variante="pequeno">{d}</T>
          </View>
        ))}
        {celulas.map((data, i) => {
          if (!data) return <View key={`v${i}`} style={estilos.celula} />;
          const r = porData.get(data);
          const futuro = data > hoje;
          const ativo = data === selecionado;
          return (
            <Pressable
              key={data}
              disabled={futuro}
              onPress={() => aoSelecionar(data)}
              accessibilityRole="button"
              accessibilityLabel={`Dia ${Number(data.slice(8))}: ${r ? `${formatarNumero(r.mm)} milímetros ${r.origem === 'manual' ? 'anotados' : 'estimados'}` : 'sem dado'}`}
              style={[estilos.celula, estilos.dia, ativo && { borderColor: tema.marca, borderWidth: 2 }, futuro && { opacity: 0.3 }]}>
              <T variante="pequeno">{Number(data.slice(8))}</T>
              {r ? (
                <T variante="forte" cor={r.origem === 'manual' ? tema.marca : tema.textSecondary} style={estilos.mm}>
                  {formatarNumero(r.mm, r.mm < 10 ? 1 : 0)}
                </T>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <T variante="pequeno">Verde: anotado por você. Cinza: estimado pelos dados meteorológicos (mm).</T>
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { gap: 8 },
  topo: { justifyContent: 'space-between', flexWrap: 'nowrap' },
  titulo: { flex: 1, textAlign: 'center' },
  grade: { flexDirection: 'row', flexWrap: 'wrap' },
  celula: { width: `${100 / 7}%`, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  dia: { borderRadius: 10, borderWidth: 2, borderColor: 'transparent' },
  mm: { fontSize: 14, lineHeight: 18 },
});
