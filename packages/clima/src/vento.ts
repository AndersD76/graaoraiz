/**
 * Fator do perfil logarítmico de vento da FAO-56 (eq. 47) para converter de 10 m para 2 m:
 * u2 = uz · 4,87 / ln(67,8·z − 5,42), com z = 10 m → fator ≈ 0,748.
 * Os modelos de previsão informam vento a 10 m; a recomendação de pulverização vale para a altura da barra.
 */
export const FATOR_10M_PARA_2M = 4.87 / Math.log(67.8 * 10 - 5.42);

export function ventoA2m(vento10m: number): number {
  return vento10m * FATOR_10M_PARA_2M;
}
