import type { Cultura } from '@graoraiz/clima';

import type { NomeIlustracao } from '@/components/icone';

/** Ilustração 3D de cada cultura (Fluent Emoji; soja, cana, café e algodão próprias). */
export const ILUSTRACAO_CULTURA: Record<Cultura, NomeIlustracao> = {
  soja: 'soja',
  milho: 'ear_of_corn',
  trigo: 'sheaf_of_rice',
  feijao: 'beans',
  algodao: 'algodao',
  cafe: 'cafe',
  uva: 'grapes',
  maca: 'red_apple',
  tomate: 'tomato',
  batata: 'potato',
  hortalicas: 'carrot',
  citros: 'tangerine',
  cana: 'cana',
  pastagem: 'cow',
  outra: 'seedling',
};
