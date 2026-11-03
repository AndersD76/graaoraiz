import { describe, expect, it } from 'vitest';

import { CATEGORIAS_MAQUINA, formatarReais, resumoUso, rotuloCategoria, UFS_BRASIL } from './maquinas';

describe('classificados de máquinas', () => {
  it('formata o preço em reais, sem centavos quando redondo', () => {
    expect(formatarReais(285000).replace(/\s/g, ' ')).toBe('R$ 285.000');
    expect(formatarReais(1234.5).replace(/\s/g, ' ')).toBe('R$ 1.234,50');
  });

  it('resume ano e horas com o que houver', () => {
    expect(resumoUso({ ano: 2018, horas: 4200 })).toBe('2018 · 4.200 h');
    expect(resumoUso({ ano: 2018, horas: null })).toBe('2018');
    expect(resumoUso({ ano: null, horas: 0 })).toBe('0 h');
    expect(resumoUso({ ano: null, horas: null })).toBe('');
  });

  it('dá o rótulo da categoria e cai em "Outro" quando não conhece', () => {
    expect(rotuloCategoria('colheitadeira')).toBe('Colheitadeira');
    expect(rotuloCategoria('nave-espacial')).toBe('Outro');
  });

  it('tem as 27 unidades da federação e categorias sem repetição', () => {
    expect(UFS_BRASIL).toHaveLength(27);
    expect(new Set(CATEGORIAS_MAQUINA.map((c) => c.valor)).size).toBe(CATEGORIAS_MAQUINA.length);
  });
});
