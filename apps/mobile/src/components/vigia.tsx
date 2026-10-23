import type { CategoriaVigia, ItemVigia } from '@graoraiz/clima';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icone, type NomeIcone } from '@/components/icone';
import { Medalha, T, useCorStatus, useFundoStatus } from '@/components/ui';
import { Raio, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export const ICONE_CATEGORIA: Record<CategoriaVigia, NomeIcone> = {
  temporal: 'raio',
  chuva: 'chuva',
  geada: 'geada',
  lavagem: 'gota',
  protecao: 'escudo',
  doenca: 'praga',
  pulverizacao: 'pulverizador',
  plantio: 'planta',
  secagem: 'sol',
  veranico: 'semChuva',
};

/** Um alerta do vigia. No grátis, os itens do Pro mostram o título e escondem o resto (prévia). */
export function CartaoVigia({ item, bloqueado, aoTocar }: { item: ItemVigia; bloqueado: boolean; aoTocar?: () => void }) {
  const tema = useTheme();
  const cor = useCorStatus(item.status);
  const fundo = useFundoStatus(item.status);
  const urgente = item.prioridade === 1 && !bloqueado;
  return (
    <Pressable
      onPress={aoTocar}
      disabled={!aoTocar}
      accessibilityRole={aoTocar ? 'button' : undefined}
      testID={`vigia-${item.categoria}`}
      style={({ pressed }) => [
        estilos.cartao,
        { backgroundColor: urgente ? fundo : tema.backgroundElement, borderColor: urgente ? 'transparent' : tema.borda, opacity: pressed ? 0.9 : 1 },
      ]}>
      <Medalha icone={ICONE_CATEGORIA[item.categoria]} cor={bloqueado ? tema.textSecondary : cor} fundo={bloqueado ? tema.backgroundSelected : urgente ? tema.backgroundElement : fundo} />
      <View style={estilos.texto}>
        <T variante="forte" style={estilos.titulo}>
          {item.titulo}
        </T>
        {bloqueado ? (
          <View style={estilos.bloqueio}>
            <Icone nome="cadeado" tamanho={14} cor={tema.destaque} />
            <T variante="pequeno" cor={tema.destaque}>
              Detalhes e aviso no celular com o Pro
            </T>
          </View>
        ) : (
          <T variante="pequeno" cor={urgente ? tema.text : tema.textSecondary}>
            {item.texto}
          </T>
        )}
      </View>
      {aoTocar ? <Icone nome="direita" tamanho={18} cor={tema.textSecondary} /> : null}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: 14,
    borderRadius: Raio.grande - 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  texto: { flex: 1, gap: 2 },
  titulo: { lineHeight: 21 },
  bloqueio: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
