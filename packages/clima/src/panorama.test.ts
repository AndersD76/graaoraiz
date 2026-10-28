import { describe, expect, it } from 'vitest';

import { resumirPanorama } from './panorama';

describe('panorama dos últimos meses', () => {
  it('soma chuva, acha extremos e separa por mês', () => {
    const r = resumirPanorama([
      { data: '2026-09-29', chuva: 12, tMin: 2.5, tMax: 18, rajada: 40 },
      { data: '2026-09-30', chuva: 0, tMin: 6, tMax: 22 },
      { data: '2026-10-01', chuva: 0.4, tMin: 9, tMax: 31, rajada: 72 },
      { data: '2026-10-02', chuva: 0, tMin: 1, tMax: 20 },
      { data: '2026-10-03', chuva: 25 },
    ]);
    expect(r.chuvaTotal).toBeCloseTo(37.4);
    expect(r.diasComChuva).toBe(2);
    expect(r.minima).toEqual({ valor: 1, data: '2026-10-02' });
    expect(r.maxima).toEqual({ valor: 31, data: '2026-10-01' });
    expect(r.rajada).toEqual({ valor: 72, data: '2026-10-01' });
    expect(r.diasFrios).toBe(2);
    expect(r.maiorSeca?.dias).toBe(3);
    expect(r.meses).toEqual([
      { mes: '2026-09', mm: 12, diasComChuva: 1, tMin: 2.5, tMax: 22 },
      { mes: '2026-10', mm: 25.4, diasComChuva: 1, tMin: 1, tMax: 31 },
    ]);
  });

  it('sem dias não quebra', () => {
    const r = resumirPanorama([]);
    expect(r.chuvaTotal).toBe(0);
    expect(r.minima).toBeNull();
    expect(r.meses).toEqual([]);
  });
});
