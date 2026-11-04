import { Redirect } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { COM_CONTAS, useConta } from '@/lib/conta';
import { useEstado } from '@/lib/estado';

export default function TabsLayout() {
  const { talhoes } = useEstado();
  const conta = useConta();
  if (COM_CONTAS) {
    // Sem conta o app abre do mesmo jeito: Máquinas e, nas outras abas, o convite para cadastrar o talhão.
    // Sem conta mas com talhão no aparelho, a sessão venceu: pede para entrar de novo.
    if (!conta && talhoes.length > 0) return <Redirect href="/entrar" />;
    return <AppTabs />;
  }
  // Sem servidor de contas (desenvolvimento, testes automáticos): direto para o primeiro talhão.
  if (talhoes.length === 0) return <Redirect href="/onboarding" />;
  return <AppTabs />;
}
