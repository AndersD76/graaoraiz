/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// O app usa tema claro por padrão: tela escura com fundo verde fica ilegível sob sol.
// As cores do semáforo (bom/atencao/ruim) passam de 4,5:1 de contraste sobre o fundo.
export const Colors = {
  light: {
    text: '#0B0F0C',
    background: '#ffffff',
    backgroundElement: '#F0F2EF',
    backgroundSelected: '#DDE3DB',
    textSecondary: '#4A524B',
    marca: '#1F6B2E',
    bom: '#1B7F3B',
    atencao: '#9A5B00',
    ruim: '#C62828',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#1C211D',
    backgroundSelected: '#2A322B',
    textSecondary: '#B4BCB5',
    marca: '#5CC97A',
    bom: '#4CC273',
    atencao: '#F2A93B',
    ruim: '#FF6B6B',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
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

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
