// Microsoft Fluent Emoji 3D (MIT) — https://github.com/microsoft/fluentui-emoji.
// Próprias, sem equivalente no Fluent: soja (vagem do Fluent com grãos recoloridos) e cana, café e
// algodão (desenhadas; fontes em assets/ilustracoes/proprias, PNG 256 px com fundo transparente).
export const ILUSTRACOES = {
  algodao: require('@/assets/ilustracoes/algodao_3d.png'),
  beans: require('@/assets/ilustracoes/beans_3d.png'),
  bell: require('@/assets/ilustracoes/bell_3d.png'),
  cafe: require('@/assets/ilustracoes/cafe_3d.png'),
  cana: require('@/assets/ilustracoes/cana_3d.png'),
  carrot: require('@/assets/ilustracoes/carrot_3d.png'),
  clipboard: require('@/assets/ilustracoes/clipboard_3d.png'),
  cow: require('@/assets/ilustracoes/cow_3d.png'),
  ear_of_corn: require('@/assets/ilustracoes/ear_of_corn_3d.png'),
  grapes: require('@/assets/ilustracoes/grapes_3d.png'),
  man_farmer: require('@/assets/ilustracoes/man_farmer_3d_default.png'),
  open_book: require('@/assets/ilustracoes/open_book_3d.png'),
  page_facing_up: require('@/assets/ilustracoes/page_facing_up_3d.png'),
  potato: require('@/assets/ilustracoes/potato_3d.png'),
  red_apple: require('@/assets/ilustracoes/red_apple_3d.png'),
  satellite: require('@/assets/ilustracoes/satellite_3d.png'),
  seedling: require('@/assets/ilustracoes/seedling_3d.png'),
  sheaf_of_rice: require('@/assets/ilustracoes/sheaf_of_rice_3d.png'),
  shield: require('@/assets/ilustracoes/shield_3d.png'),
  soja: require('@/assets/ilustracoes/soja_3d.png'),
  sun_behind_cloud: require('@/assets/ilustracoes/sun_behind_cloud_3d.png'),
  sun_behind_rain_cloud: require('@/assets/ilustracoes/sun_behind_rain_cloud_3d.png'),
  tangerine: require('@/assets/ilustracoes/tangerine_3d.png'),
  tomato: require('@/assets/ilustracoes/tomato_3d.png'),
  tractor: require('@/assets/ilustracoes/tractor_3d.png'),
} as const;

export type NomeIlustracao = keyof typeof ILUSTRACOES;
