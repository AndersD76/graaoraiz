import { useRouter } from 'expo-router';
import { TabList, type TabListProps, TabSlot, TabTrigger, type TabTriggerSlotProps, Tabs } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { ABAS } from '@/components/abas';
import { Icone, Ilustracao, type NomeIcone } from '@/components/icone';
import { T } from '@/components/ui';
import { Raio, Spacing } from '@/constants/theme';
import { LARGURA_MENU_LATERAL, useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';

/** Na web: menu lateral no computador; no celular e no tablet, a barra fica embaixo, como no app. */
export default function AppTabs() {
  const { menuLateral } = useLayout();
  const lista = (
    <TabList asChild>
      {menuLateral ? (
        <MenuLateral>
          {ABAS.map((aba) => (
            <TabTrigger key={aba.nome} name={aba.nome} href={aba.href} asChild>
              <ItemMenu icone={aba.icone} rotulo={aba.rotulo} />
            </TabTrigger>
          ))}
        </MenuLateral>
      ) : (
        <BarraAbas>
          {ABAS.map((aba) => (
            <TabTrigger key={aba.nome} name={aba.nome} href={aba.href} asChild>
              <BotaoAba icone={aba.icone} rotulo={aba.rotulo} />
            </TabTrigger>
          ))}
        </BarraAbas>
      )}
    </TabList>
  );
  return (
    <Tabs style={menuLateral ? estilos.lado : estilos.empilhado}>
      {menuLateral ? lista : null}
      <TabSlot style={estilos.slot} />
      {menuLateral ? null : lista}
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
  // No tablet a barra acompanha a largura do conteúdo (no celular é a tela toda).
  const { larguraConteudo } = useLayout();
  return (
    <View {...props} style={estilos.externo} pointerEvents="box-none">
      <View style={[estilos.barra, { maxWidth: larguraConteudo, backgroundColor: tema.backgroundElement, borderColor: tema.borda, boxShadow: `0px -4px 24px ${tema.sombra}` }]}>
        {props.children}
      </View>
    </View>
  );
}

function ItemMenu({ isFocused, ref, icone, rotulo, ...props }: TabTriggerSlotProps & { icone: NomeIcone; rotulo: string }) {
  const tema = useTheme();
  const cor = isFocused ? tema.marca : tema.text;
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityLabel={rotulo}
      style={({ hovered }) => [estilos.item, { backgroundColor: isFocused ? tema.marcaSuave : hovered ? tema.backgroundSelected : 'transparent' }]}>
      <Icone nome={icone} tamanho={22} cor={cor} />
      <T variante="forte" cor={cor}>
        {rotulo}
      </T>
    </Pressable>
  );
}

function MenuLateral(props: TabListProps) {
  const tema = useTheme();
  const router = useRouter();
  return (
    <View {...props} style={[estilos.menu, { backgroundColor: tema.backgroundElement, borderColor: tema.borda }]}>
      <View style={estilos.marca}>
        <Ilustracao nome="seedling" tamanho={36} />
        <T variante="subtitulo" cor={tema.marca}>
          Grão Raiz
        </T>
      </View>
      <View style={estilos.itens}>{props.children}</View>
      <Pressable
        onPress={() => router.push('/ajustes')}
        accessibilityRole="link"
        accessibilityLabel="Ajustes"
        testID="menu-ajustes"
        style={({ hovered }) => [estilos.item, { backgroundColor: hovered ? tema.backgroundSelected : 'transparent' }]}>
        <Icone nome="engrenagem" tamanho={22} cor={tema.text} />
        <T variante="forte">Ajustes</T>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  lado: { flexDirection: 'row', height: '100%' },
  empilhado: { flex: 1, height: '100%' },
  slot: { flex: 1, height: '100%' },
  externo: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  barra: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  aba: { alignItems: 'center', gap: 2, minWidth: 60 },
  icone: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 16 },
  rotulo: { fontSize: 12, lineHeight: 16 },
  menu: { width: LARGURA_MENU_LATERAL, height: '100%', borderRightWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, paddingVertical: Spacing.four, gap: Spacing.four },
  marca: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.two },
  itens: { flex: 1, gap: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three, paddingVertical: 12, borderRadius: Raio.medio },
});
