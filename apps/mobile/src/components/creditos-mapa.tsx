import { StyleSheet } from 'react-native';

import { T } from '@/components/ui';
import { ATRIBUICAO_MAPA } from '@/lib/pagina-mapa';

/** Créditos embaixo do mapa, em letra miúda: fora da imagem, mas sempre visíveis (exigência das licenças). */
export function CreditosMapa({ extra }: { extra?: string | null }) {
  return (
    <T variante="pequeno" style={estilos.creditos}>
      {extra ? `${extra} · ${ATRIBUICAO_MAPA}` : ATRIBUICAO_MAPA}
    </T>
  );
}

const estilos = StyleSheet.create({
  creditos: { fontSize: 11, lineHeight: 15 },
});
