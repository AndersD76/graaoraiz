import { NativeTabs } from 'expo-router/native-tabs';

import { ABAS } from '@/components/abas';
import { useTheme } from '@/hooks/use-theme';

/** Barra de abas nativa (iOS/Android). A versão web fica em app-tabs.web.tsx, com a mesma ordem de components/abas.ts. */
export default function AppTabs() {
  const tema = useTheme();

  return (
    <NativeTabs backgroundColor={tema.backgroundElement} indicatorColor={tema.marcaSuave} labelStyle={{ selected: { color: tema.marca } }}>
      {ABAS.map((aba) => (
        <NativeTabs.Trigger key={aba.nome} name={aba.nome}>
          <NativeTabs.Trigger.Label>{aba.rotulo}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={aba.sf as never} md={aba.md as never} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
