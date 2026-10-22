import { describe, expect, it } from 'vitest';

import {
  avaliarHora,
  avaliarSerie,
  janelasPulverizacao,
  resumoPulverizacaoDia,
} from './pulverizacao';
import type { Hora } from './tipos';

/** Hora com condições boas para pulverizar; cada teste altera só o que interessa. */
function hora(hh: number, alteracoes: Partial<Hora> = {}, data = '2026-10-22'): Hora {
  return {
    hora: `${data}T${String(hh).padStart(2, '0')}:00`,
    temperatura: 24,
    umidade: 70,
    vento10m: 8,
    rajada10m: 12,
    chuva: 0,
    probChuva: 10,
    ...alteracoes,
  };
}

function dia(alterar: (hh: number) => Partial<Hora> = () => ({}), data = '2026-10-22'): Hora[] {
  return Array.from({ length: 24 }, (_, hh) => hora(hh, alterar(hh), data));
}

describe('avaliarHora', () => {
  it('hora com condições boas fica verde e sem motivos', () => {
    const r = avaliarHora([hora(6), hora(7), hora(8)], 0);
    expect(r.status).toBe('bom');
    expect(r.motivos).toEqual([]);
    expect(r.deltaT).toBeCloseTo(4.0, 1);
  });

  it('vento forte na barra impede a aplicação', () => {
    const r = avaliarHora([hora(6, { vento10m: 25 }), hora(7), hora(8)], 0);
    expect(r.status).toBe('ruim');
    expect(r.motivos.map((m) => m.criterio)).toContain('vento');
  });

  it('vento fraco pede atenção por risco de inversão térmica', () => {
    const r = avaliarHora([hora(6, { vento10m: 2, rajada10m: 3 }), hora(7), hora(8)], 0);
    expect(r.status).toBe('atencao');
    expect(r.motivos[0]?.texto).toMatch(/inversão térmica/);
  });

  it('chuva nas horas seguintes torna a hora ruim', () => {
    const r = avaliarHora([hora(6), hora(7, { chuva: 1.2 }), hora(8)], 0);
    expect(r.status).toBe('ruim');
    expect(r.motivos.some((m) => m.criterio === 'chuva')).toBe(true);
  });

  it('probabilidade de chuva moderada pede atenção e alta impede', () => {
    expect(avaliarHora([hora(6), hora(7, { probChuva: 50 }), hora(8)], 0).status).toBe('atencao');
    expect(avaliarHora([hora(6), hora(7, { probChuva: 70 }), hora(8)], 0).status).toBe('ruim');
  });

  it('ar quente e seco faz as gotas evaporarem', () => {
    const r = avaliarHora([hora(14, { temperatura: 34, umidade: 25 }), hora(15), hora(16)], 0);
    expect(r.status).toBe('ruim');
    expect(r.deltaT).toBeGreaterThan(10);
    expect(r.motivos.map((m) => m.criterio)).toEqual(expect.arrayContaining(['deltaT', 'umidade', 'temperatura']));
  });

  it('última hora da série não é dada como boa sem ver as horas seguintes', () => {
    const r = avaliarHora([hora(22), hora(23)], 1);
    expect(r.status).toBe('atencao');
    expect(r.motivos.some((m) => m.criterio === 'dados')).toBe(true);
  });
});

describe('janelasPulverizacao', () => {
  const serie = dia((hh) => {
    if (hh < 6) return { vento10m: 2, rajada10m: 3 }; // madrugada sem vento
    if (hh >= 10 && hh < 16) return { vento10m: 25, rajada10m: 35 }; // ventania à tarde
    if (hh >= 20) return { chuva: 3, probChuva: 90 }; // chuva à noite
    return {};
  });

  it('agrupa horas boas consecutivas e respeita a chuva depois da aplicação', () => {
    const janelas = janelasPulverizacao(avaliarSerie(serie));
    expect(janelas).toEqual([
      { inicio: '2026-10-22T06:00', fim: '2026-10-22T10:00', horas: 4, status: 'bom' },
      { inicio: '2026-10-22T16:00', fim: '2026-10-22T18:00', horas: 2, status: 'bom' },
    ]);
  });

  it('descarta janelas mais curtas que a duração mínima', () => {
    const janelas = janelasPulverizacao(avaliarSerie(serie), { duracaoMinima: 3 });
    expect(janelas).toHaveLength(1);
    expect(janelas[0]?.horas).toBe(4);
  });

  it('não junta horas separadas por um buraco na série', () => {
    const comBuraco = [hora(6), hora(7), hora(9), hora(10), hora(11), hora(12)];
    const janelas = janelasPulverizacao(avaliarSerie(comBuraco));
    expect(janelas.map((j) => j.inicio)).toEqual(['2026-10-22T06:00', '2026-10-22T09:00']);
  });
});

describe('resumoPulverizacaoDia', () => {
  it('dia com janela boa fica verde e indica a maior janela', () => {
    const serie = dia((hh) => (hh >= 10 && hh < 16 ? { vento10m: 25, rajada10m: 35 } : {}));
    const r = resumoPulverizacaoDia(avaliarSerie(serie), '2026-10-22');
    expect(r.status).toBe('bom');
    expect(r.melhorJanela?.inicio).toBe('2026-10-22T00:00');
    expect(r.motivoPrincipal).toBeNull();
  });

  it('dia de ventania fica vermelho e explica o motivo', () => {
    const serie = dia(() => ({ vento10m: 30, rajada10m: 45 }));
    const r = resumoPulverizacaoDia(avaliarSerie(serie), '2026-10-22');
    expect(r.status).toBe('ruim');
    expect(r.melhorJanela).toBeNull();
    expect(r.motivoPrincipal).toMatch(/vento forte|rajadas fortes/);
  });

  it('dia só com horas de cuidado fica amarelo', () => {
    const serie = dia(() => ({ vento10m: 2, rajada10m: 3 }));
    const r = resumoPulverizacaoDia(avaliarSerie(serie), '2026-10-22');
    expect(r.status).toBe('atencao');
    expect(r.motivoPrincipal).toMatch(/inversão térmica/);
  });
});
