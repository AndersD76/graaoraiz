import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { useEstado } from '@/lib/estado';

export default function TabsLayout() {
  const { talhoes } = useEstado();
  // Sem talhão não há o que mostrar: começa pela apresentação e pelo primeiro talhão.
  if (talhoes.length === 0) return <Redirect href="/onboarding" />;
  return <AppTabs />;
}
