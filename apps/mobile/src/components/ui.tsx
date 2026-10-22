import type { Status } from '@graoraiz/clima';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  type TextInputProps,
  type TextProps,
  View,
  type ViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Texto --------------------------------------------------------------------

type Variante = 'titulo' | 'subtitulo' | 'corpo' | 'forte' | 'pequeno' | 'numero';

export function T({ variante = 'corpo', cor, style, ...resto }: TextProps & { variante?: Variante; cor?: string }) {
  const tema = useTheme();
  const corPadrao = variante === 'pequeno' ? tema.textSecondary : tema.text;
  return <Text style={[estilos[variante], { color: cor ?? corPadrao }, style]} {...resto} />;
}

// Estrutura ----------------------------------------------------------------

export function Tela({
  titulo,
  subtitulo,
  children,
  aoAtualizar,
  atualizando = false,
  comAbas = true,
}: {
  titulo?: string;
  subtitulo?: string;
  children: ReactNode;
  aoAtualizar?: () => void;
  atualizando?: boolean;
  /** Telas dentro das abas precisam de espaço para a barra inferior. */
  comAbas?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const tema = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: tema.background }}
      contentContainerStyle={[
        estilos.tela,
        {
          // Na web a barra de abas fica no topo, sobre o conteúdo.
          paddingTop: insets.top + Spacing.three + (comAbas && Platform.OS === 'web' ? 88 : 0),
          paddingBottom: insets.bottom + (comAbas ? BottomTabInset : 0) + Spacing.five,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      refreshControl={aoAtualizar ? <RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={tema.marca} /> : undefined}>
      {titulo ? (
        <View style={estilos.cabecalho}>
          <T variante="titulo" accessibilityRole="header">
            {titulo}
          </T>
          {subtitulo ? <T variante="pequeno">{subtitulo}</T> : null}
        </View>
      ) : null}
      {children}
    </ScrollView>
  );
}

export function Cartao({ style, ...resto }: ViewProps) {
  const tema = useTheme();
  return <View style={[estilos.cartao, { backgroundColor: tema.backgroundElement }, style]} {...resto} />;
}

export function Linha({ style, ...resto }: ViewProps) {
  return <View style={[estilos.linha, style]} {...resto} />;
}

// Controles ----------------------------------------------------------------

type TipoBotao = 'primario' | 'secundario' | 'perigo' | 'texto';

export function Botao({
  titulo,
  aoTocar,
  tipo = 'primario',
  desabilitado = false,
  carregando = false,
  testID,
}: {
  titulo: string;
  aoTocar: () => void;
  tipo?: TipoBotao;
  desabilitado?: boolean;
  carregando?: boolean;
  testID?: string;
}) {
  const tema = useTheme();
  const fundo = { primario: tema.marca, secundario: tema.backgroundSelected, perigo: tema.ruim, texto: 'transparent' }[tipo];
  const corTexto = tipo === 'primario' || tipo === 'perigo' ? '#ffffff' : tipo === 'texto' ? tema.marca : tema.text;
  const inativo = desabilitado || carregando;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo, busy: carregando }}
      onPress={aoTocar}
      disabled={inativo}
      style={({ pressed }) => [estilos.botao, { backgroundColor: fundo, opacity: inativo ? 0.5 : pressed ? 0.8 : 1 }]}>
      {carregando ? <ActivityIndicator color={corTexto} /> : <T variante="forte" cor={corTexto}>{titulo}</T>}
    </Pressable>
  );
}

export function Chip({ rotulo, ativo, aoTocar, testID }: { rotulo: string; ativo: boolean; aoTocar: () => void; testID?: string }) {
  const tema = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      onPress={aoTocar}
      style={[estilos.chip, { backgroundColor: ativo ? tema.marca : tema.backgroundElement, borderColor: ativo ? tema.marca : tema.backgroundSelected }]}>
      <T variante="forte" cor={ativo ? '#ffffff' : tema.text}>
        {rotulo}
      </T>
    </Pressable>
  );
}

export function Campo({ rotulo, dica, style, ...resto }: TextInputProps & { rotulo: string; dica?: string }) {
  const tema = useTheme();
  return (
    <View style={estilos.campo}>
      <T variante="forte">{rotulo}</T>
      <TextInput
        accessibilityLabel={rotulo}
        placeholderTextColor={tema.textSecondary}
        style={[estilos.entrada, { color: tema.text, backgroundColor: tema.background, borderColor: tema.backgroundSelected }, style]}
        {...resto}
      />
      {dica ? <T variante="pequeno">{dica}</T> : null}
    </View>
  );
}

export function Interruptor({
  rotulo,
  descricao,
  valor,
  aoMudar,
  bloqueado = false,
  testID,
}: {
  rotulo: string;
  descricao?: string;
  valor: boolean;
  aoMudar: (v: boolean) => void;
  bloqueado?: boolean;
  testID?: string;
}) {
  const tema = useTheme();
  return (
    <View style={estilos.interruptor}>
      <View style={estilos.flex}>
        <T variante="forte">
          {rotulo}
          {bloqueado ? <T variante="pequeno" cor={tema.marca}>  · Pro</T> : null}
        </T>
        {descricao ? <T variante="pequeno">{descricao}</T> : null}
      </View>
      <Switch
        testID={testID}
        accessibilityLabel={rotulo}
        value={valor && !bloqueado}
        onValueChange={aoMudar}
        disabled={bloqueado}
        trackColor={{ true: tema.marca, false: tema.backgroundSelected }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

// Situação -----------------------------------------------------------------

export const ROTULO_STATUS: Record<Status, string> = { bom: 'Bom', atencao: 'Com cuidado', ruim: 'Não recomendado' };

export function useCorStatus(status: Status): string {
  const tema = useTheme();
  return { bom: tema.bom, atencao: tema.atencao, ruim: tema.ruim }[status];
}

export function Selo({ status, texto }: { status: Status; texto?: string }) {
  const cor = useCorStatus(status);
  return (
    <View style={[estilos.selo, { backgroundColor: cor }]}>
      <T variante="forte" cor="#ffffff">
        {texto ?? ROTULO_STATUS[status]}
      </T>
    </View>
  );
}

export function Aviso({ tipo = 'info', titulo, children }: { tipo?: 'info' | Status; titulo?: string; children?: ReactNode }) {
  const tema = useTheme();
  const cor = tipo === 'info' ? tema.marca : { bom: tema.bom, atencao: tema.atencao, ruim: tema.ruim }[tipo];
  return (
    <View style={[estilos.aviso, { borderLeftColor: cor, backgroundColor: tema.backgroundElement }]} accessibilityRole="alert">
      {titulo ? <T variante="forte" cor={cor}>{titulo}</T> : null}
      {typeof children === 'string' ? <T>{children}</T> : children}
    </View>
  );
}

export function Carregando({ texto }: { texto: string }) {
  const tema = useTheme();
  return (
    <View style={estilos.carregando}>
      <ActivityIndicator color={tema.marca} size="large" />
      <T variante="pequeno">{texto}</T>
    </View>
  );
}

const estilos = StyleSheet.create({
  titulo: { fontSize: 30, lineHeight: 36, fontWeight: '700' },
  subtitulo: { fontSize: 21, lineHeight: 28, fontWeight: '700' },
  corpo: { fontSize: 17, lineHeight: 24 },
  forte: { fontSize: 17, lineHeight: 24, fontWeight: '700' },
  pequeno: { fontSize: 15, lineHeight: 21 },
  numero: { fontSize: 44, lineHeight: 50, fontWeight: '800' },
  tela: { paddingHorizontal: Spacing.three, gap: Spacing.three, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  cabecalho: { gap: Spacing.one },
  cartao: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  botao: { minHeight: 52, borderRadius: 14, paddingHorizontal: Spacing.four, alignItems: 'center', justifyContent: 'center' },
  chip: { minHeight: 44, borderRadius: 22, paddingHorizontal: Spacing.three, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  campo: { gap: Spacing.one },
  entrada: { minHeight: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: Spacing.three, fontSize: 18 },
  interruptor: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: 52 },
  flex: { flex: 1, gap: 2 },
  selo: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 },
  aviso: { borderLeftWidth: 5, borderTopRightRadius: 12, borderBottomRightRadius: 12, padding: Spacing.three, gap: Spacing.one },
  carregando: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
});
