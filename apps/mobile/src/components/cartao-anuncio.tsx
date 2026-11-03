import { type AnuncioResumo, formatarReais, resumoUso } from '@graoraiz/clima';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icone } from '@/components/icone';
import { T } from '@/components/ui';
import { Raio, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { urlFoto } from '@/lib/maquinas';

/** Cartão da vitrine de máquinas: foto, preço, título, ano e horas, cidade. */
export function CartaoAnuncio({ anuncio, aoTocar }: { anuncio: AnuncioResumo; aoTocar: () => void }) {
  const tema = useTheme();
  const uso = resumoUso(anuncio);
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="link"
      accessibilityLabel={`${anuncio.titulo}, ${formatarReais(anuncio.preco)}, ${anuncio.municipio}`}
      testID={`anuncio-${anuncio.id}`}
      style={({ pressed, hovered }) => [
        estilos.cartao,
        { backgroundColor: tema.backgroundElement, borderColor: tema.borda, opacity: pressed ? 0.88 : 1, boxShadow: hovered ? `0px 8px 24px ${tema.sombra}` : undefined },
      ]}>
      <View style={[estilos.foto, { backgroundColor: tema.backgroundSelected }]}>
        {anuncio.foto ? (
          <Image source={{ uri: urlFoto(anuncio.foto) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />
        ) : (
          <Icone nome="trator" tamanho={40} cor={tema.textSecondary} />
        )}
      </View>
      <View style={estilos.corpo}>
        <T variante="subtitulo" cor={tema.marca} numberOfLines={1}>
          {formatarReais(anuncio.preco)}
        </T>
        <T variante="forte" numberOfLines={2} style={estilos.titulo}>
          {anuncio.titulo}
        </T>
        {uso ? (
          <T variante="pequeno" numberOfLines={1}>
            {uso}
          </T>
        ) : null}
        <View style={estilos.local}>
          <Icone nome="pino" tamanho={14} cor={tema.textSecondary} />
          <T variante="pequeno" numberOfLines={1} style={estilos.flex}>
            {anuncio.municipio}/{anuncio.uf}
          </T>
        </View>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  cartao: { borderRadius: Raio.grande, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', height: '100%' },
  foto: { aspectRatio: 4 / 3, alignItems: 'center', justifyContent: 'center' },
  corpo: { padding: Spacing.three, gap: 2 },
  titulo: { minHeight: 44 },
  local: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  flex: { flex: 1 },
});
