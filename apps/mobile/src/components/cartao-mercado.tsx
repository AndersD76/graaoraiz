import type { Cultura } from '@graoraiz/clima';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icone } from '@/components/icone';
import { Linha, Secao, T } from '@/components/ui';
import { Raio, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SERVIDOR_URL } from '@/lib/config';
import { formatarDataPreco, formatarPreco, usePrecos } from '@/lib/precos';

/** "Mercado hoje" na tela Hoje: o preço da cultura do talhão e o dólar. Toque abre todos os preços. */
export function CartaoMercado({ cultura }: { cultura: Cultura | null }) {
  if (!SERVIDOR_URL) return null; // sem servidor não há preço (e nada é inventado)
  return <Mercado cultura={cultura} />;
}

function Mercado({ cultura }: { cultura: Cultura | null }) {
  const router = useRouter();
  const tema = useTheme();
  const { precos } = usePrecos();
  if (!precos) return null;
  const principal = (cultura && precos.indicadores.find((i) => i.culturas.includes(cultura))) ?? null;

  return (
    <>
      <Secao titulo="Mercado hoje" acao="Ver preços" aoTocarAcao={() => router.push('/precos')} />
      <Pressable
        onPress={() => router.push('/precos')}
        accessibilityRole="button"
        accessibilityLabel="Ver os preços do dia"
        testID="cartao-mercado"
        style={({ pressed }) => [estilos.cartao, { backgroundColor: tema.backgroundElement, borderColor: tema.borda, opacity: pressed ? 0.85 : 1 }]}>
        <Linha style={estilos.linha}>
          <View style={[estilos.icone, { backgroundColor: tema.marcaSuave }]}>
            <Icone nome="tendencia" tamanho={22} cor={tema.marca} />
          </View>
          <View style={estilos.flex}>
            {principal ? (
              <>
                <T variante="pequeno">
                  {principal.produto} · {principal.praca}
                </T>
                <T variante="subtitulo">
                  {formatarPreco(principal)} <T variante="pequeno">{principal.unidade.replace('R$/', '/')}</T>
                </T>
              </>
            ) : (
              <T variante="forte">Preços do dia: soja, milho, trigo, café, boi e mais</T>
            )}
            <T variante="pequeno">
              {precos.dolar ? `Dólar R$ ${precos.dolar.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · ` : ''}
              Cepea/Esalq{principal ? `, ${formatarDataPreco(principal.data)}` : ''}
            </T>
          </View>
          <Icone nome="direita" tamanho={20} cor={tema.textSecondary} />
        </Linha>
      </Pressable>
    </>
  );
}

const estilos = StyleSheet.create({
  cartao: { borderRadius: Raio.grande, borderWidth: 1, padding: Spacing.three },
  linha: { alignItems: 'center', flexWrap: 'nowrap' },
  icone: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 2 },
});
