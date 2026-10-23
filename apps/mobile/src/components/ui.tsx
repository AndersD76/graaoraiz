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
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icone, type NomeIcone } from '@/components/icone';
import { BottomTabInset, Fontes, MaxContentWidth, Raio, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Texto --------------------------------------------------------------------

type Variante = 'display' | 'numero' | 'titulo' | 'subtitulo' | 'corpo' | 'forte' | 'pequeno' | 'rotulo';

export function T({ variante = 'corpo', cor, style, ...resto }: TextProps & { variante?: Variante; cor?: string }) {
  const tema = useTheme();
  const corPadrao = variante === 'pequeno' || variante === 'rotulo' ? tema.textSecondary : tema.text;
  return <Text style={[estilos[variante], { color: cor ?? corPadrao }, style]} {...resto} />;
}

// Estrutura ----------------------------------------------------------------

export function Tela({
  titulo,
  subtitulo,
  acao,
  children,
  aoAtualizar,
  atualizando = false,
  comAbas = true,
  cabecalhoNativo = false,
  semTopo = false,
}: {
  titulo?: string;
  subtitulo?: string;
  /** Botão no canto do cabeçalho (ex.: ajustes). */
  acao?: ReactNode;
  children: ReactNode;
  aoAtualizar?: () => void;
  atualizando?: boolean;
  /** Telas dentro das abas precisam de espaço para a barra inferior. */
  comAbas?: boolean;
  /** Telas empilhadas com cabeçalho do sistema: o cabeçalho já respeita a área segura do topo. */
  cabecalhoNativo?: boolean;
  /** Conteúdo encostado no topo (ex.: capa com gradiente que cuida da área segura). */
  semTopo?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const tema = useTheme();
  const topoSeguro = cabecalhoNativo ? 0 : insets.top;
  return (
    <ScrollView
      style={{ backgroundColor: tema.background }}
      contentContainerStyle={[
        estilos.tela,
        {
          paddingTop: semTopo ? 0 : topoSeguro + Spacing.three,
          paddingBottom: insets.bottom + (comAbas ? BottomTabInset : 0) + Spacing.five,
        },
      ]}
      // iPhone: rola o conteúdo para o campo em foco não ficar atrás do teclado.
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      refreshControl={aoAtualizar ? <RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={tema.marca} /> : undefined}>
      {titulo ? (
        <View style={estilos.cabecalho}>
          <View style={estilos.flex}>
            <T variante="titulo" accessibilityRole="header">
              {titulo}
            </T>
            {subtitulo ? <T variante="pequeno">{subtitulo}</T> : null}
          </View>
          {acao}
        </View>
      ) : null}
      {children}
    </ScrollView>
  );
}

export type Tom = 'marca' | 'chuva' | 'destaque' | Status;

export function Cartao({ style, tom, ...resto }: ViewProps & { tom?: Tom }) {
  const tema = useTheme();
  const fundo = tom
    ? { marca: tema.marcaSuave, chuva: tema.chuvaSuave, destaque: tema.destaqueSuave, bom: tema.bomSuave, atencao: tema.atencaoSuave, ruim: tema.ruimSuave }[tom]
    : tema.backgroundElement;
  return (
    <View
      style={[
        estilos.cartao,
        { backgroundColor: fundo, borderColor: tom ? 'transparent' : tema.borda },
        tom ? null : { boxShadow: `0px 6px 18px ${tema.sombra}` },
        style,
      ]}
      {...resto}
    />
  );
}

export function Linha({ style, ...resto }: ViewProps) {
  return <View style={[estilos.linha, style]} {...resto} />;
}

/** Título de seção com ação opcional à direita ("Ver tudo"). */
export function Secao({ titulo, acao, aoTocarAcao }: { titulo: string; acao?: string; aoTocarAcao?: () => void }) {
  const tema = useTheme();
  return (
    <View style={estilos.secao}>
      <T variante="subtitulo" accessibilityRole="header">
        {titulo}
      </T>
      {acao && aoTocarAcao ? (
        <Pressable onPress={aoTocarAcao} accessibilityRole="button" hitSlop={10}>
          <T variante="forte" cor={tema.marca}>
            {acao}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Quadrado arredondado com ícone, usado nos cartões de decisão. */
export function Medalha({ icone, cor, fundo, tamanho = 44 }: { icone: NomeIcone; cor: string; fundo: string; tamanho?: number }) {
  return (
    <View style={[estilos.medalha, { width: tamanho, height: tamanho, borderRadius: tamanho / 2.8, backgroundColor: fundo }]}>
      <Icone nome={icone} tamanho={tamanho * 0.56} cor={cor} />
    </View>
  );
}

/** Ícone + rótulo + valor, para listas de condições. */
export function LinhaInfo({ icone, rotulo, valor, cor }: { icone: NomeIcone; rotulo: string; valor: string; cor?: string }) {
  const tema = useTheme();
  return (
    <View style={estilos.linhaInfo}>
      <Icone nome={icone} tamanho={20} cor={cor ?? tema.textSecondary} />
      <T style={estilos.flex}>{rotulo}</T>
      <T variante="forte">{valor}</T>
    </View>
  );
}

export function Divisor() {
  const tema = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tema.borda }} />;
}

// Controles ----------------------------------------------------------------

type TipoBotao = 'primario' | 'secundario' | 'perigo' | 'texto' | 'claro';

export function Botao({
  titulo,
  aoTocar,
  tipo = 'primario',
  icone,
  desabilitado = false,
  carregando = false,
  compacto = false,
  rotuloAcessivel,
  testID,
}: {
  titulo: string;
  aoTocar: () => void;
  tipo?: TipoBotao;
  icone?: NomeIcone;
  desabilitado?: boolean;
  carregando?: boolean;
  compacto?: boolean;
  /** Nome lido pelo leitor de tela (obrigatório em botão só com ícone). */
  rotuloAcessivel?: string;
  testID?: string;
}) {
  const tema = useTheme();
  const fundo = { primario: tema.marca, secundario: tema.backgroundSelected, perigo: tema.ruim, texto: 'transparent', claro: 'rgba(255,255,255,0.94)' }[tipo];
  const corTexto = { primario: '#ffffff', perigo: '#ffffff', texto: tema.marca, secundario: tema.text, claro: '#0F1A12' }[tipo];
  const inativo = desabilitado || carregando;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel ?? titulo}
      accessibilityState={{ disabled: inativo, busy: carregando }}
      onPress={aoTocar}
      disabled={inativo}
      style={({ pressed }) => [
        estilos.botao,
        compacto && estilos.botaoCompacto,
        { backgroundColor: fundo, opacity: inativo ? 0.45 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}>
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <>
          {icone ? <Icone nome={icone} tamanho={20} cor={corTexto} /> : null}
          {titulo ? (
            <T variante="forte" cor={corTexto}>
              {titulo}
            </T>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

export function Chip({ rotulo, ativo, aoTocar, icone, testID }: { rotulo: string; ativo: boolean; aoTocar: () => void; icone?: NomeIcone; testID?: string }) {
  const tema = useTheme();
  const cor = ativo ? '#ffffff' : tema.text;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      onPress={aoTocar}
      style={[estilos.chip, { backgroundColor: ativo ? tema.marca : tema.backgroundElement, borderColor: ativo ? tema.marca : tema.borda }]}>
      {icone ? <Icone nome={icone} tamanho={18} cor={cor} /> : null}
      <T variante="forte" cor={cor} style={estilos.textoChip}>
        {rotulo}
      </T>
    </Pressable>
  );
}

export function Campo({ rotulo, dica, style, ...resto }: TextInputProps & { rotulo: string; dica?: string }) {
  const tema = useTheme();
  return (
    <View style={estilos.campo}>
      <T variante="rotulo">{rotulo}</T>
      <TextInput
        accessibilityLabel={rotulo}
        placeholderTextColor={tema.textSecondary}
        style={[estilos.entrada, { color: tema.text, backgroundColor: tema.backgroundSelected, borderColor: tema.borda }, style]}
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
  icone,
  testID,
}: {
  rotulo: string;
  descricao?: string;
  valor: boolean;
  aoMudar: (v: boolean) => void;
  bloqueado?: boolean;
  icone?: NomeIcone;
  testID?: string;
}) {
  const tema = useTheme();
  return (
    <View style={estilos.interruptor}>
      {icone ? <Medalha icone={icone} cor={tema.marca} fundo={tema.marcaSuave} tamanho={38} /> : null}
      <View style={estilos.flex}>
        <T variante="forte">
          {rotulo}
          {bloqueado ? <T variante="pequeno" cor={tema.destaque}>  · Pro</T> : null}
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

export function useFundoStatus(status: Status): string {
  const tema = useTheme();
  return { bom: tema.bomSuave, atencao: tema.atencaoSuave, ruim: tema.ruimSuave }[status];
}

/** Pílula suave com ponto colorido. */
export function Selo({ status, texto, estilo }: { status: Status; texto?: string; estilo?: ViewStyle }) {
  const cor = useCorStatus(status);
  const fundo = useFundoStatus(status);
  return (
    <View style={[estilos.selo, { backgroundColor: fundo }, estilo]}>
      <View style={[estilos.ponto, { backgroundColor: cor }]} />
      <T variante="forte" cor={cor} style={estilos.textoSelo}>
        {texto ?? ROTULO_STATUS[status]}
      </T>
    </View>
  );
}

const ICONE_AVISO: Record<'info' | Status, NomeIcone> = { info: 'info', bom: 'ok', atencao: 'alerta', ruim: 'alertaCirculo' };

export function Aviso({ tipo = 'info', titulo, icone, children }: { tipo?: 'info' | Status; titulo?: string; icone?: NomeIcone; children?: ReactNode }) {
  const tema = useTheme();
  const cor = tipo === 'info' ? tema.marca : { bom: tema.bom, atencao: tema.atencao, ruim: tema.ruim }[tipo];
  const fundo = tipo === 'info' ? tema.marcaSuave : { bom: tema.bomSuave, atencao: tema.atencaoSuave, ruim: tema.ruimSuave }[tipo];
  return (
    <View style={[estilos.aviso, { backgroundColor: fundo }]} accessibilityRole="alert">
      <Icone nome={icone ?? ICONE_AVISO[tipo]} tamanho={24} cor={cor} />
      <View style={estilos.flex}>
        {titulo ? (
          <T variante="forte" cor={cor}>
            {titulo}
          </T>
        ) : null}
        {typeof children === 'string' ? <T>{children}</T> : children}
      </View>
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
  display: { fontFamily: Fontes.extra, fontSize: 68, lineHeight: 74, letterSpacing: -2.5 },
  numero: { fontFamily: Fontes.extra, fontSize: 40, lineHeight: 46, letterSpacing: -1 },
  titulo: { fontFamily: Fontes.extra, fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  subtitulo: { fontFamily: Fontes.negrito, fontSize: 19, lineHeight: 25, letterSpacing: -0.2 },
  corpo: { fontFamily: Fontes.regular, fontSize: 16, lineHeight: 23 },
  forte: { fontFamily: Fontes.seminegrito, fontSize: 16, lineHeight: 22 },
  pequeno: { fontFamily: Fontes.media, fontSize: 14, lineHeight: 20 },
  rotulo: { fontFamily: Fontes.negrito, fontSize: 12, lineHeight: 16, letterSpacing: 0.8, textTransform: 'uppercase' },
  tela: { paddingHorizontal: Spacing.three, gap: Spacing.three, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  cartao: { borderRadius: Raio.grande, padding: Spacing.three, gap: Spacing.two, borderWidth: StyleSheet.hairlineWidth },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  secao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.two },
  medalha: { alignItems: 'center', justifyContent: 'center' },
  linhaInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 36 },
  botao: {
    minHeight: 54,
    borderRadius: Raio.medio,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
  botaoCompacto: { minHeight: 42, paddingHorizontal: Spacing.three, borderRadius: 12 },
  chip: {
    minHeight: 42,
    borderRadius: Raio.total,
    paddingHorizontal: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  textoChip: { fontSize: 15 },
  campo: { gap: 6 },
  entrada: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: Raio.medio,
    paddingHorizontal: Spacing.three,
    fontSize: 18,
    fontFamily: Fontes.seminegrito,
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}),
  },
  interruptor: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: 56 },
  flex: { flex: 1, gap: 2 },
  selo: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: Raio.total, paddingHorizontal: 10, paddingVertical: 4 },
  ponto: { width: 8, height: 8, borderRadius: 4 },
  textoSelo: { fontSize: 13, lineHeight: 18 },
  aviso: { flexDirection: 'row', gap: Spacing.three, borderRadius: Raio.medio, padding: Spacing.three, alignItems: 'flex-start' },
  carregando: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
});
