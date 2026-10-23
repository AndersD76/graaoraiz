import { Colors, type Tema } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEstado } from '@/lib/estado';

/** Esquema em uso: a escolha do usuário em Ajustes ou, no automático, o do celular. */
export function useEsquema(): 'light' | 'dark' {
  const sistema = useColorScheme();
  const { tema } = useEstado();
  if (tema === 'claro') return 'light';
  if (tema === 'escuro') return 'dark';
  return sistema === 'dark' ? 'dark' : 'light';
}

export function useTheme(): Tema {
  return Colors[useEsquema()];
}
