import { formatarReais, horaMensagem, MAX_MENSAGEM } from '@graoraiz/clima';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { type ComponentRef, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CartaoAvisosMensagem } from '@/components/avisos-mensagem';
import { Icone } from '@/components/icone';
import { Aviso, Botao, Carregando, T } from '@/components/ui';
import { Fontes, Raio, Spacing } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';
import { useTheme } from '@/hooks/use-theme';
import { ErroConta } from '@/lib/conta';
import { useConversa } from '@/lib/conversas';
import { informar } from '@/lib/dialogo';
import { urlFoto } from '@/lib/maquinas';

/** Uma conversa dos classificados: o anúncio no topo, as mensagens e o campo para responder. */
export default function ConversaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const tema = useTheme();
  const insets = useSafeAreaInsets();
  const { larguraConteudo } = useLayout();
  const { conversa, erro, carregando, enviar } = useConversa(id);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const lista = useRef<ComponentRef<typeof ScrollView>>(null);

  const mandar = async () => {
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    try {
      await enviar(t);
      setTexto('');
    } catch (e) {
      informar('Mensagem', e instanceof ErroConta ? e.message : 'Não deu para mandar agora. Confira a conexão e tente de novo.');
    } finally {
      setEnviando(false);
    }
  };

  if (carregando || !conversa) {
    return (
      <View style={[estilos.tela, { backgroundColor: tema.background }]}>
        <Stack.Screen options={{ title: 'Conversa' }} />
        <View style={estilos.centro}>
          {erro ? (
            <>
              <Aviso tipo="atencao">{erro}</Aviso>
              <Botao titulo="Ver conversas" tipo="secundario" aoTocar={() => router.replace('/conversas')} />
            </>
          ) : (
            <Carregando texto="Abrindo a conversa…" />
          )}
        </View>
      </View>
    );
  }

  const encerrada = conversa.anuncio.situacao === 'removido';
  const ultima = conversa.mensagens[conversa.mensagens.length - 1];
  const vista = ultima?.minha && conversa.outroLeuEm >= ultima.em;
  const largura = { maxWidth: larguraConteudo, width: '100%' as const, alignSelf: 'center' as const };

  return (
    <KeyboardAvoidingView
      style={[estilos.tela, { backgroundColor: tema.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}>
      <Stack.Screen options={{ title: conversa.com }} />
      <ScrollView
        ref={lista}
        contentContainerStyle={[estilos.lista, largura]}
        onContentSizeChange={() => lista.current?.scrollToEnd({ animated: false })}
        keyboardShouldPersistTaps="handled">
        <Pressable
          onPress={() => router.push({ pathname: '/maquina/[id]', params: { id: conversa.anuncio.id } })}
          accessibilityRole="button"
          accessibilityLabel={`Ver o anúncio ${conversa.anuncio.titulo}`}
          style={[estilos.anuncio, { backgroundColor: tema.backgroundElement, borderColor: tema.borda }]}
          testID="conversa-anuncio">
          <View style={[estilos.foto, { backgroundColor: tema.backgroundSelected }]}>
            {conversa.anuncio.foto ? <Image source={{ uri: urlFoto(conversa.anuncio.foto) }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="" /> : null}
          </View>
          <View style={estilos.flex}>
            <T variante="forte" numberOfLines={1}>
              {conversa.anuncio.titulo}
            </T>
            <T variante="pequeno" cor={tema.marca}>
              {formatarReais(conversa.anuncio.preco)}
              {conversa.anuncio.situacao === 'vendido' ? ' · vendida' : conversa.anuncio.situacao === 'pausado' ? ' · anúncio pausado' : ''}
            </T>
            <T variante="pequeno" cor={tema.textSecondary}>
              {conversa.papel === 'vendedor' ? `Seu anúncio · ${conversa.com} tem interesse` : `Vendedor: ${conversa.com}`}
            </T>
          </View>
          <Icone nome="direita" tamanho={16} cor={tema.textSecondary} />
        </Pressable>

        {conversa.papel === 'comprador' ? (
          <T variante="pequeno" cor={tema.textSecondary} style={estilos.dica}>
            Combine tudo por aqui. Veja a máquina funcionando antes de pagar e nunca pague sinal para reservar.
          </T>
        ) : null}

        {conversa.mensagens.length === 0 ? (
          <T variante="pequeno" cor={tema.textSecondary} style={estilos.dica}>
            {conversa.papel === 'comprador' ? `Mande sua pergunta para ${conversa.com}. Ex.: "A máquina ainda está à venda?"` : 'Ainda sem mensagens.'}
          </T>
        ) : null}

        {conversa.mensagens.map((m) => (
          <View
            key={m.id}
            style={[
              estilos.bolha,
              m.minha ? [estilos.minha, { backgroundColor: tema.marca }] : [estilos.dele, { backgroundColor: tema.backgroundElement, borderColor: tema.borda }],
            ]}
            testID={m.minha ? 'mensagem-minha' : 'mensagem-dele'}>
            <T cor={m.minha ? tema.sobreMarca : tema.text} selectable>
              {m.texto}
            </T>
            <T variante="pequeno" cor={m.minha ? tema.sobreMarca : tema.textSecondary} style={estilos.hora}>
              {horaMensagem(m.em)}
            </T>
          </View>
        ))}
        {vista ? (
          <T variante="pequeno" cor={tema.textSecondary} style={estilos.vista}>
            Visto
          </T>
        ) : null}
        {conversa.mensagens.some((m) => m.minha) ? <CartaoAvisosMensagem compacto /> : null}
      </ScrollView>

      {encerrada ? (
        <View style={[estilos.barra, largura, { paddingBottom: insets.bottom + Spacing.two }]}>
          <Aviso tipo="info">O anúncio saiu do ar e a conversa foi encerrada.</Aviso>
        </View>
      ) : (
        <View style={[estilos.barra, largura, { paddingBottom: insets.bottom + Spacing.two, borderTopColor: tema.borda }]}>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Escreva a mensagem"
            placeholderTextColor={tema.textSecondary}
            multiline
            maxLength={MAX_MENSAGEM}
            style={[estilos.campo, { color: tema.text, backgroundColor: tema.backgroundElement, borderColor: tema.borda }]}
            accessibilityLabel="Mensagem"
            testID="campo-mensagem"
            // No computador, Enter manda e Shift+Enter quebra a linha.
            onKeyPress={(e) => {
              const ev = e.nativeEvent as { key: string; shiftKey?: boolean };
              if (Platform.OS === 'web' && ev.key === 'Enter' && !ev.shiftKey) {
                (e as unknown as { preventDefault: () => void }).preventDefault();
                void mandar();
              }
            }}
          />
          <Pressable
            onPress={() => void mandar()}
            disabled={!texto.trim() || enviando}
            accessibilityRole="button"
            accessibilityLabel="Mandar"
            style={({ pressed }) => [estilos.mandar, { backgroundColor: tema.marca, opacity: !texto.trim() || enviando ? 0.45 : pressed ? 0.85 : 1 }]}
            testID="mandar-mensagem">
            <Icone nome="direita" tamanho={22} cor={tema.sobreMarca} />
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  centro: { flex: 1, padding: Spacing.three, gap: Spacing.three, justifyContent: 'center' },
  lista: { padding: Spacing.three, gap: Spacing.two },
  anuncio: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: 12, borderRadius: Raio.grande, borderWidth: StyleSheet.hairlineWidth },
  foto: { width: 52, height: 52, borderRadius: Raio.medio, overflow: 'hidden' },
  flex: { flex: 1, minWidth: 0 },
  dica: { textAlign: 'center', paddingHorizontal: Spacing.three },
  bolha: { maxWidth: '82%', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, gap: 2 },
  minha: { alignSelf: 'flex-end', borderBottomRightRadius: 6 },
  dele: { alignSelf: 'flex-start', borderBottomLeftRadius: 6, borderWidth: StyleSheet.hairlineWidth },
  hora: { fontSize: 11, lineHeight: 14, alignSelf: 'flex-end', opacity: 0.85 },
  vista: { alignSelf: 'flex-end', fontSize: 12, marginTop: -4 },
  barra: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingTop: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  campo: {
    flex: 1,
    minHeight: 48,
    maxHeight: 140,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 13,
    fontSize: 16,
    fontFamily: Fontes.regular,
    // Sem o contorno preto de foco do navegador (a borda do campo já mostra onde escrever).
    ...(Platform.OS === 'web' ? { outlineWidth: 0, outlineColor: 'transparent' } : {}),
  },
  mandar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
