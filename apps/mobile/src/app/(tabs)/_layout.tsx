import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { EXIGE_CONTA, useConta } from '@/lib/conta';
import { useEstado } from '@/lib/estado';

export default function TabsLayout() {
  const { talhoes } = useEstado();
  const conta = useConta();
  // Primeiro a conta (os dados vêm dela); depois, sem talhão, a apresentação e o primeiro talhão.
  if (EXIGE_CONTA && !conta) return <Redirect href="/entrar" />;
  if (talhoes.length === 0) return <Redirect href="/onboarding" />;
  return <AppTabs />;
}
