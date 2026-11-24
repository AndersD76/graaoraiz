import { formatarReais, horaMensagem } from '@graoraiz/clima';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { CartaoAvisosMensagem } from '@/components/avisos-mensagem';
import { Aviso, Botao, Cartao, Carregando, T, Tela } from '@/components/ui';
import { Raio, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useConta } from '@/lib/conta';
import { useConversas } from '@/lib/conversas';
import { urlFoto } from '@/lib/maquinas';

/** Conversas dos classificados: as dos anúncios da pessoa e as que ela abriu com vendedores. */
export default function ConversasScreen() {
  const router = useRouter();
  const tema = useTheme();
  const conta = useConta();
  const { conversas, erro, carregando, atualizando, atualizar } = useConversas();

  if (!conta || conta.demo) {
    return (
      <Tela comAbas={false} cabecalhoNativo>
        <Cartao tom="destaque">
          <T variante="forte">Entre para conversar</T>
          <T variante="pequeno">As conversas com vendedores e compradores ficam na sua conta. Criar a conta é grátis.</T>
          <Botao titulo="Entrar ou criar conta" icone="usuario" aoTocar={() => router.push('/entrar')} />
        </Cartao>
      </Tela>
    );
  }

  return (
    <Tela comAbas={false} cabecalhoNativo aoAtualizar={() => void atualizar()} atualizando={atualizando}>
      <CartaoAvisosMensagem />
      {carregando ? <Carregando texto="Buscando as conversas…" /> : null}
      {erro && !conversas ? <Aviso tipo="atencao">{erro}</Aviso> : null}

      {conversas && conversas.length === 0 ? (
        <Cartao>
          <T variante="subtitulo">Nenhuma conversa ainda</T>
          <T variante="pequeno" cor={tema.textSecondary}>
            Quando você falar com um vendedor, ou alguém perguntar sobre um anúncio seu, a conversa aparece aqui.
          </T>
          <Botao titulo="Ver máquinas" tipo="secundario" icone="trator" aoTocar={() => router.navigate('/maquinas')} />
        </Cartao>
      ) : null}

      {conversas && conversas.length > 0 ? (
        <Cartao style={estilos.lista}>
          {conversas.map((c, n) => (
            <Pressable
              key={c.id}
              onPress={() => router.push({ pathname: '/conversa/[id]', params: { id: c.id } })}
              accessibilityRole="button"
              accessibilityLabel={`Conversa com ${c.com} sobre ${c.anuncio.titulo}${c.naoLidas ? `, ${c.naoLidas} não lidas` : ''}`}
              style={({ pressed }) => [estilos.item, n > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: tema.borda }, { opacity: pressed ? 0.8 : 1 }]}
              testID={`conversa-${c.id}`}>
              <View style={[estilos.foto, { backgroundColor: tema.backgroundSelected }]}>
                {c.anuncio.foto ? <Image source={{ uri: urlFoto(c.anuncio.foto) }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="" /> : null}
              </View>
              <View style={estilos.meio}>
                <View style={estilos.linha}>
                  <T variante="forte" numberOfLines={1} style={estilos.flex}>
                    {c.com}
                  </T>
                  {c.ultima ? (
                    <T variante="pequeno" cor={c.naoLidas ? tema.marca : tema.textSecondary}>
                      {horaMensagem(c.ultima.em)}
                    </T>
                  ) : null}
                </View>
                <T variante="pequeno" numberOfLines={1} cor={tema.textSecondary}>
                  {c.papel === 'vendedor' ? 'Seu anúncio' : 'Vendedor'} · {c.anuncio.titulo} · {formatarReais(c.anuncio.preco)}
                </T>
                <View style={estilos.linha}>
                  <T variante="pequeno" numberOfLines={1} style={estilos.flex} cor={c.naoLidas ? tema.text : tema.textSecondary}>
                    {c.ultima ? `${c.ultima.minha ? 'Você: ' : ''}${c.ultima.texto}` : 'Ainda sem mensagens'}
                  </T>
                  {c.naoLidas ? (
                    <View style={[estilos.selo, { backgroundColor: tema.marca }]}>
                      <T variante="pequeno" cor={tema.sobreMarca} style={estilos.textoSelo}>
                        {c.naoLidas}
                      </T>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          ))}
        </Cartao>
      ) : null}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  lista: { paddingVertical: 4, gap: 0 },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 12 },
  foto: { width: 56, height: 56, borderRadius: Raio.medio, overflow: 'hidden' },
  meio: { flex: 1, gap: 2, minWidth: 0 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
  selo: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  textoSelo: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
});
