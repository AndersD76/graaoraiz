import { TabList, type TabListProps, TabSlot, TabTrigger, type TabTriggerSlotProps, Tabs } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icone, type NomeIcone } from '@/components/icone';
import { T } from '@/components/ui';
import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ABAS } from '@/components/abas';

/** Na web (teste no computador) a barra fica embaixo, como no celular. */
export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <BarraAbas>
          {ABAS.map((aba) => (
            <TabTrigger key={aba.nome} name={aba.nome} href={aba.href} asChild>
              <BotaoAba icone={aba.icone} rotulo={aba.rotulo} />
            </TabTrigger>
          ))}
        </BarraAbas>
      </TabList>
    </Tabs>
  );
}

// O ref do slot é tipado para outro elemento e não serve ao Pressable; a aba funciona sem ele.
function BotaoAba({ isFocused, ref, icone, rotulo, ...props }: TabTriggerSlotProps & { icone: NomeIcone; rotulo: string }) {
  const tema = useTheme();
  const cor = isFocused ? tema.marca : tema.textSecondary;
  return (
    <Pressable {...props} accessibilityRole="tab" accessibilityLabel={rotulo} style={estilos.aba}>
      <View style={[estilos.icone, isFocused && { backgroundColor: tema.marcaSuave }]}>
        <Icone nome={icone} tamanho={24} cor={cor} />
      </View>
      <T variante="pequeno" cor={cor} style={estilos.rotulo}>
        {rotulo}
      </T>
    </Pressable>
  );
}

function BarraAbas(props: TabListProps) {
  const tema = useTheme();
  return (
    <View {...props} style={estilos.externo} pointerEvents="box-none">
      <View style={[estilos.barra, { backgroundColor: tema.backgroundElement, borderColor: tema.borda, boxShadow: `0px -4px 24px ${tema.sombra}` }]}>
        {props.children}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  externo: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  barra: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  aba: { alignItems: 'center', gap: 2, minWidth: 64 },
  icone: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 16 },
  rotulo: { fontSize: 12, lineHeight: 16 },
});
