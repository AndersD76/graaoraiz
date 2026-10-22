import { describe, expect, it } from 'vitest';

import { riscoGeada, riscoTemporal } from './alertas';
import { acumulado, diasSemChuva, mesclarChuva } from './chuva';
import { somarDias, somarHoras } from './datas';
import { deltaT, temperaturaBulboUmido } from './psicrometria';
import { janelasSecas } from './secas';
import type { Dia, Hora } from './tipos';
import { FATOR_10M_PARA_2M, ventoA2m } from './vento';

describe('psicrometria', () => {
  it('reproduz o exemplo de Stull (2011): 20 °C e 50% → bulbo úmido 13,7 °C', () => {
    expect(temperaturaBulboUmido(20, 50)).toBeCloseTo(13.7, 1);
    expect(deltaT(20, 50)).toBeCloseTo(6.3, 1);
  });

  it('delta T cresce quando o ar seca', () => {
    expect(deltaT(28, 30)).toBeGreaterThan(deltaT(28, 60));
    expect(deltaT(28, 60)).toBeGreaterThan(deltaT(28, 90));
  });
});

describe('vento', () => {
  it('converte 10 m para 2 m pelo fator da FAO-56', () => {
    expect(FATOR_10M_PARA_2M).toBeCloseTo(0.748, 3);
    expect(ventoA2m(10)).toBeCloseTo(7.48, 2);
  });
});

describe('datas', () => {
  it('vira o dia e o mês ao somar horas', () => {
    expect(somarHoras('2026-10-31T23:00', 1)).toBe('2026-11-01T00:00');
    expect(somarDias('2026-03-01', -1)).toBe('2026-02-28');
  });
});

function diaPrev(data: string, chuva: number, probChuva: number | null = 10): Dia {
  return { data, chuva, probChuva, tMax: 30, tMin: 18, rajadaMax10m: 20 };
}

describe('janelasSecas', () => {
  it('encontra dias seguidos de tempo firme', () => {
    const dias = [
      diaPrev('2026-01-10', 0),
      diaPrev('2026-01-11', 0.4),
      diaPrev('2026-01-12', 12),
      diaPrev('2026-01-13', 0),
      diaPrev('2026-01-14', 0),
      diaPrev('2026-01-15', 0),
    ];
    expect(janelasSecas(dias)).toEqual([
      { inicio: '2026-01-10', fim: '2026-01-11', dias: 2 },
      { inicio: '2026-01-13', fim: '2026-01-15', dias: 3 },
    ]);
  });

  it('não considera seco um dia com chance alta de chuva', () => {
    const dias = [diaPrev('2026-01-10', 0), diaPrev('2026-01-11', 0, 60), diaPrev('2026-01-12', 0)];
    expect(janelasSecas(dias)).toEqual([]);
  });

  it('não junta dias com buraco na série', () => {
    const dias = [diaPrev('2026-01-10', 0), diaPrev('2026-01-12', 0)];
    expect(janelasSecas(dias)).toEqual([]);
  });
});

describe('alertas', () => {
  it('classifica o risco de geada pela mínima', () => {
    expect(riscoGeada({ ...diaPrev('2026-06-10', 0), tMin: 0.5 })).toBe('alto');
    expect(riscoGeada({ ...diaPrev('2026-06-10', 0), tMin: 2.5 })).toBe('moderado');
    expect(riscoGeada({ ...diaPrev('2026-06-10', 0), tMin: 5 })).toBeNull();
  });

  it('aponta horas de temporal', () => {
    const base: Hora = {
      hora: '2026-11-03T15:00', temperatura: 30, umidade: 60, vento10m: 15, rajada10m: 25, chuva: 0, probChuva: 30,
    };
    const horas: Hora[] = [
      base,
      { ...base, hora: '2026-11-03T16:00', codigoTempo: 99, rajada10m: 72, chuva: 25 },
    ];
    const r = riscoTemporal(horas);
    expect(r).toHaveLength(1);
    expect(r[0]?.motivos).toEqual(['trovoada com granizo', 'rajadas de 72 km/h', 'chuva forte (25 mm/h)']);
  });
});

describe('chuva', () => {
  const manual = [{ data: '2026-11-02', mm: 18 }];
  const estimada = [
    { data: '2026-11-01', mm: 0 },
    { data: '2026-11-02', mm: 9 },
    { data: '2026-11-03', mm: 0.5 },
  ];

  it('a anotação do produtor vence a estimativa', () => {
    expect(mesclarChuva(manual, estimada)).toEqual([
      { data: '2026-11-01', mm: 0, origem: 'estimada' },
      { data: '2026-11-02', mm: 18, origem: 'manual' },
      { data: '2026-11-03', mm: 0.5, origem: 'estimada' },
    ]);
  });

  it('soma o acumulado do período, inclusive nas pontas', () => {
    expect(acumulado(mesclarChuva(manual, estimada), '2026-11-02', '2026-11-03')).toBeCloseTo(18.5);
  });

  it('conta dias sem chuva e para em dia chuvoso ou sem dado', () => {
    const serie = [
      { data: '2026-11-01', mm: 25 },
      { data: '2026-11-02', mm: 0 },
      { data: '2026-11-03', mm: 1 },
      { data: '2026-11-04', mm: 0 },
    ];
    expect(diasSemChuva(serie, '2026-11-04')).toBe(3);
    expect(diasSemChuva(serie, '2026-11-06')).toBe(0);
  });
});
