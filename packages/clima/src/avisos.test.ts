import { describe, expect, it } from 'vitest';

import { PREFERENCIAS_AVISOS_PADRAO, planejarAvisos } from './avisos';
import { somarHoras } from './datas';
import type { Dia, Hora } from './tipos';

const talhao = { id: 't1', nome: 'Talhão Norte' };

/** 72 horas a partir de 22/10 00h; venta forte fora das 6h–10h, para formar janelas realistas. */
function serie(alterar: (h: Hora) => Partial<Hora> = () => ({})): Hora[] {
  return Array.from({ length: 72 }, (_, i) => {
    const hora = somarHoras('2026-10-22T00:00', i);
    const hh = Number(hora.slice(11, 13));
    const base: Hora = {
      hora, temperatura: 24, umidade: 70, vento10m: hh >= 6 && hh < 10 ? 8 : 30, rajada10m: hh >= 6 && hh < 10 ? 12 : 45, chuva: 0, probChuva: 10,
    };
    return { ...base, ...alterar(base) };
  });
}

function dia(data: string, alteracoes: Partial<Dia> = {}): Dia {
  return { data, chuva: 0, probChuva: 10, tMax: 30, tMin: 15, rajadaMax10m: 30, ...alteracoes };
}

const diasFirmes = ['2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25'].map((d) => dia(d));

describe('planejarAvisos', () => {
  it('avisa geada na tarde anterior e a janela de pulverização na véspera', () => {
    const avisos = planejarAvisos({
      talhao,
      horas: serie(),
      dias: [dia('2026-10-22', { chuva: 5, probChuva: 80 }), dia('2026-10-23', { tMin: 0.5, chuva: 6, probChuva: 70 })],
      agora: '2026-10-22T10:00',
    });
    expect(avisos.map((a) => [a.tipo, a.quando])).toEqual([
      ['geada', '2026-10-22T16:00'],
      ['pulverizacao', '2026-10-22T18:00'],
    ]);
    expect(avisos[0]?.titulo).toBe('Risco alto de geada');
    expect(avisos[0]?.corpo).toContain('mínima de 1 °C');
    expect(avisos[1]?.corpo).toBe('Talhão Norte: melhor janela das 6h às 10h.');
  });

  it('avisa temporal três horas antes', () => {
    const horas = serie((h) => (h.hora === '2026-10-22T16:00' ? { codigoTempo: 95, rajada10m: 70 } : {}));
    const temporal = planejarAvisos({ talhao, horas, dias: [], agora: '2026-10-22T09:00' }).find((a) => a.tipo === 'temporal');
    expect(temporal?.quando).toBe('2026-10-22T13:00');
    expect(temporal?.corpo).toContain('trovoada, rajadas de 70 km/h por volta das 16h de hoje');
  });

  it('empurra aviso não urgente para depois do silêncio', () => {
    const avisos = planejarAvisos({ talhao, horas: [], dias: diasFirmes, agora: '2026-10-22T22:30' });
    const seca = avisos.find((a) => a.tipo === 'janelaSeca');
    expect(seca?.quando).toBe('2026-10-23T06:00');
    expect(seca?.corpo).toContain('tempo firme de sex a dom (3 dias)');
  });

  it('avisa veranico por faixas de 5 dias, só com lavoura plantada', () => {
    const base = { talhao, horas: [], dias: [], agora: '2026-10-22T10:00', diasSemChuva: 12 };
    expect(planejarAvisos({ ...base, plantado: false })).toEqual([]);
    const [veranico] = planejarAvisos({ ...base, plantado: true });
    expect(veranico?.id).toBe('veranico-t1-10');
    expect(veranico?.quando).toBe('2026-10-22T10:01');
  });

  it('respeita as preferências desligadas', () => {
    const desligado = { ...PREFERENCIAS_AVISOS_PADRAO, geada: false, temporal: false, pulverizacao: false, janelaSeca: false, veranico: false };
    const avisos = planejarAvisos({
      talhao, horas: serie(), dias: [dia('2026-10-23', { tMin: 0 })], agora: '2026-10-22T10:00', preferencias: desligado, diasSemChuva: 15, plantado: true,
    });
    expect(avisos).toEqual([]);
  });

  it('não agenda nada no passado', () => {
    const avisos = planejarAvisos({ talhao, horas: serie(), dias: [dia('2026-10-23', { tMin: 0 })], agora: '2026-10-23T08:00' });
    expect(avisos.every((a) => a.quando > '2026-10-23T08:00')).toBe(true);
    expect(avisos.some((a) => a.tipo === 'geada')).toBe(false);
  });
});
