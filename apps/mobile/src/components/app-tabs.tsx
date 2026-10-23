import { NativeTabs } from 'expo-router/native-tabs';

import { useTheme } from '@/hooks/use-theme';

/** Barra de abas nativa (iOS/Android). A versão web fica em app-tabs.web.tsx, com a mesma ordem de components/abas.ts. */
export default function AppTabs() {
  const tema = useTheme();

  return (
    <NativeTabs backgroundColor={tema.backgroundElement} indicatorColor={tema.marcaSuave} labelStyle={{ selected: { color: tema.marca } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Hoje</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sun.max.fill" md="wb_sunny" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="lavoura">
        <NativeTabs.Trigger.Label>Lavoura</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="leaf.fill" md="grass" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="caderno">
        <NativeTabs.Trigger.Label>Caderno</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="book.closed.fill" md="menu_book" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chuva">
        <NativeTabs.Trigger.Label>Chuva</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="cloud.rain.fill" md="water_drop" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="ajustes">
        <NativeTabs.Trigger.Label>Ajustes</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
