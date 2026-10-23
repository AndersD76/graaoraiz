import type { Cultura } from '@graoraiz/clima';

import type { NomeIlustracao } from '@/components/icone';

/** Ilustração 3D de cada cultura (Fluent Emoji). */
export const ILUSTRACAO_CULTURA: Record<Cultura, NomeIlustracao> = {
  soja: 'beans',
  milho: 'ear_of_corn',
  trigo: 'sheaf_of_rice',
  feijao: 'beans',
  algodao: 'herb',
  cafe: 'hot_beverage',
  uva: 'grapes',
  maca: 'red_apple',
  tomate: 'tomato',
  batata: 'potato',
  hortalicas: 'carrot',
  citros: 'tangerine',
  cana: 'herb',
  pastagem: 'cow',
  outra: 'seedling',
};
