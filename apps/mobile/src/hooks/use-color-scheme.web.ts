import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const semAssinatura = () => () => {};

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 * useSyncExternalStore returns the server snapshot during hydration and the client one afterwards.
 */
export function useColorScheme() {
  const noCliente = useSyncExternalStore(semAssinatura, () => true, () => false);
  const colorScheme = useRNColorScheme();
  return noCliente ? colorScheme : 'light';
}
