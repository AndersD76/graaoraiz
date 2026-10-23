import { ATRIBUICAO_OPEN_METEO, type AvaliacaoHora, dataDe, formatarData, formatarHora, formatarNumero, isoLocal } from '@graoraiz/clima';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Icone } from '@/components/icone';
import { Chip, Selo, T, useCorStatus } from '@/components/ui';
import { Raio, Spacing } from '@/constants/theme';
import { useAgora } from '@/hooks/use-agora';
import { useTheme } from '@/hooks/use-theme';
import { selecionarTalhao, type Talhao, talhoesLiberados, useEstado } from '@/lib/estado';

/** Escolha do talhão. No grátis, os talhões além do limite aparecem com cadeado e levam ao Pro. */
export function SeletorTalhao({ selecionado }: { selecionado: Talhao | null }) {
  const router = useRouter();
  const estado = useEstado();
  const liberados = talhoesLiberados(estado);
  const bloqueados = estado.talhoes.filter((t) => !liberados.includes(t));
  if (estado.talhoes.length <= 1) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.seletor} accessibilityLabel="Escolher talhão">
      {liberados.map((t) => (
        <Chip key={t.id} rotulo={t.nome} icone="pino" ativo={t.id === selecionado?.id} aoTocar={() => selecionarTalhao(t.id)} />
      ))}
      {bloqueados.map((t) => (
        <Chip key={t.id} rotulo={t.nome} icone="cadeado" ativo={false} aoTocar={() => router.push('/assinatura')} />
      ))}
    </ScrollView>
  );
}

/** Uma hora da pulverização, com os números que decidem e o motivo quando não está boa. */
export function FaixaHora({ avaliacao, bloqueada = false }: { avaliacao: AvaliacaoHora; bloqueada?: boolean }) {
  const tema = useTheme();
  const cor = useCorStatus(avaliacao.status);
  return (
    <View
      style={[estilos.hora, { backgroundColor: tema.backgroundElement, borderColor: tema.borda, opacity: bloqueada ? 0.4 : 1 }]}
      testID={`hora-${avaliacao.hora}`}>
      <View style={[estilos.barra, { backgroundColor: cor }]} />
      <View style={estilos.conteudoHora}>
        <View style={estilos.topoHora}>
          <T variante="subtitulo">{formatarHora(avaliacao.hora)}</T>
          <Selo status={avaliacao.status} />
        </View>
        {bloqueada ? null : (
          <>
            <View style={estilos.numeros}>
              <View style={estilos.numero}>
                <Icone nome="vento" tamanho={16} cor={tema.textSecondary} />
                <T variante="pequeno">{Math.round(avaliacao.vento2m)} km/h</T>
              </View>
              <View style={estilos.numero}>
                <Icone nome="onda" tamanho={16} cor={tema.textSecondary} />
                <T variante="pequeno">rajada {Math.round(avaliacao.rajada2m)}</T>
              </View>
              <View style={estilos.numero}>
                <Icone nome="termometro" tamanho={16} cor={tema.textSecondary} />
                <T variante="pequeno">ΔT {formatarNumero(avaliacao.deltaT, 1)} °C</T>
              </View>
            </View>
            {avaliacao.motivos.length > 0 ? <T variante="pequeno" cor={cor}>{avaliacao.motivos.map((m) => m.texto).join('; ')}</T> : null}
          </>
        )}
      </View>
    </View>
  );
}

export function RodapeFonte({ em, desatualizado }: { em?: number; desatualizado?: boolean }) {
  const tema = useTheme();
  const agora = useAgora();
  const quando = em ? isoLocal(new Date(em)) : null;
  // Data só quando não é de hoje: "Atualizado às 07:12" de ontem enganaria.
  const dia = quando && dataDe(quando) !== dataDe(agora) ? ` de ${formatarData(dataDe(quando))}` : '';
  return (
    <View style={estilos.rodape}>
      {quando ? (
        <T variante="pequeno" cor={desatualizado ? tema.atencao : tema.textSecondary}>
          {desatualizado ? 'Sem internet — mostrando a previsão salva às ' : 'Atualizado às '}
          {quando.slice(11, 16)}
          {dia}.
        </T>
      ) : null}
      <T variante="pequeno">Estimativa a partir de modelos meteorológicos. Confira as condições no local.</T>
      <T variante="pequeno">{ATRIBUICAO_OPEN_METEO}</T>
    </View>
  );
}

const estilos = StyleSheet.create({
  seletor: { gap: Spacing.two },
  hora: { flexDirection: 'row', borderRadius: Raio.medio, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  barra: { width: 6 },
  conteudoHora: { flex: 1, padding: 12, gap: 6 },
  topoHora: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  numeros: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  numero: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rodape: { gap: Spacing.one, paddingTop: Spacing.two, alignItems: 'center' },
});
