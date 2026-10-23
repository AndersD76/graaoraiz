import '@/global.css';

import { Platform } from 'react-native';

/**
 * Paleta do Grão Raiz. Claro: papel quente e verde-folha, legível sob sol. Escuro: verde quase preto,
 * para a cabine à noite. As cores do semáforo (bom/atencao/ruim) passam de 4,5:1 sobre o fundo.
 */
export const Colors = {
  light: {
    text: '#0F1A12',
    textSecondary: '#5A675D',
    background: '#F4F5EF',
    /** Superfície dos cartões. */
    backgroundElement: '#FFFFFF',
    /** Superfície secundária (chips, campos, trilhas). */
    backgroundSelected: '#ECEFE6',
    borda: '#E1E5DA',
    marca: '#17663A',
    marcaForte: '#0E4F2B',
    marcaSuave: '#E1F1E5',
    destaque: '#B87D0E',
    destaqueSuave: '#FBF0D9',
    chuva: '#2B78DE',
    chuvaSuave: '#E3EEFC',
    frio: '#3E7FB8',
    bom: '#178A43',
    atencao: '#B26A00',
    ruim: '#CF3128',
    bomSuave: '#E2F4E8',
    atencaoSuave: '#FCEFD9',
    ruimSuave: '#FCE5E3',
    sombra: 'rgba(16, 32, 20, 0.08)',
  },
  dark: {
    text: '#F1F5F0',
    textSecondary: '#9DAAA0',
    background: '#0A0F0B',
    backgroundElement: '#141B16',
    backgroundSelected: '#1D261F',
    borda: '#27322A',
    marca: '#4CC27A',
    marcaForte: '#7AD89E',
    marcaSuave: '#15301F',
    destaque: '#F0B547',
    destaqueSuave: '#33270F',
    chuva: '#5AA2FF',
    chuvaSuave: '#13253D',
    frio: '#7FB6E6',
    bom: '#47C47A',
    atencao: '#F2A93B',
    ruim: '#FF6B61',
    bomSuave: '#13301F',
    atencaoSuave: '#3A2A10',
    ruimSuave: '#3B1815',
    sombra: 'rgba(0, 0, 0, 0.4)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type Tema = { [K in ThemeColor]: string };

/** Plus Jakarta Sans em cada peso: no Android o peso só muda trocando a família. */
export const Fontes = {
  regular: 'PlusJakartaSans_400Regular',
  media: 'PlusJakartaSans_500Medium',
  seminegrito: 'PlusJakartaSans_600SemiBold',
  negrito: 'PlusJakartaSans_700Bold',
  extra: 'PlusJakartaSans_800ExtraBold',
} as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', serif: 'var(--font-serif)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Raio = { pequeno: 10, medio: 16, grande: 24, total: 999 } as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 92 }) ?? 0;
/** Na web o app aparece na largura de um celular, centralizado. */
export const MaxContentWidth = 480;
