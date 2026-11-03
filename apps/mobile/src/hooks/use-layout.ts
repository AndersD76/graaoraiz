import { Platform, useWindowDimensions } from 'react-native';

import { Spacing } from '@/constants/theme';

export type Formato = 'celular' | 'tablet' | 'computador';

/** Largura máxima do conteúdo em cada formato de tela. */
const LARGURA_CONTEUDO: Record<Formato, number> = { celular: 480, tablet: 760, computador: 1080 };

/** Menu lateral da web no computador (no celular e no tablet o menu fica embaixo). */
export const LARGURA_MENU_LATERAL = 240;

/**
 * Formato da tela para o app se ajustar: celular, tablet ou computador.
 * `larguraUtil` é a largura do conteúdo já sem as margens laterais (para gráficos e grades).
 */
export function useLayout() {
  const { width } = useWindowDimensions();
  const formato: Formato = width >= 1024 ? 'computador' : width >= 700 ? 'tablet' : 'celular';
  const menuLateral = Platform.OS === 'web' && formato === 'computador';
  const disponivel = width - (menuLateral ? LARGURA_MENU_LATERAL : 0);
  const larguraConteudo = Math.min(disponivel, LARGURA_CONTEUDO[formato]);
  return { formato, menuLateral, larguraConteudo, larguraUtil: larguraConteudo - Spacing.three * 2 };
}
