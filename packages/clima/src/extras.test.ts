import { describe, expect, it } from 'vitest';

import { chuvaPorMes, maiorSequenciaSeca, mesclarChuva } from './chuva';
import { dateLocal, diasEntre, isoLocal, somarMinutos } from './datas';
import { formatarHora, formatarJanela, formatarMm, formatarMes, rotuloDia, rotuloMomento } from './formatos';
import { descreverTempo, lerChuvaDiaria, lerDias, lerHoras, urlHistoricoChuva, urlPrevisao } from './open-meteo';
import { montarRelatorioHtml } from './relatorio';
import { normalAcumulada, safraDe } from './safra';

describe('open-meteo', () => {
  it('monta a URL de previsão com coordenada arredondada e servidor público', () => {
    const url = new URL(urlPrevisao(-25.43219, -49.27155, { diasPassados: 3 }));
    expect(url.origin).toBe('https://api.open-meteo.com');
    expect(url.searchParams.get('latitude')).toBe('-25.43');
    expect(url.searchParams.get('longitude')).toBe('-49.27');
    expect(url.searchParams.get('past_days')).toBe('3');
    expect(url.searchParams.get('forecast_days')).toBe('7');
    expect(url.searchParams.get('hourly')).toContain('wind_gusts_10m');
  });

  it('usa o fuso do aparelho quando informado e recusa valores estranhos', () => {
    expect(new URL(urlPrevisao(-15.6, -56.1, { fuso: 'America/Cuiaba' })).searchParams.get('timezone')).toBe('America/Cuiaba');
    expect(new URL(urlPrevisao(-15.6, -56.1)).searchParams.get('timezone')).toBe('auto');
    expect(new URL(urlPrevisao(-15.6, -56.1, { fuso: 'x&y=1' })).searchParams.get('timezone')).toBe('auto');
  });

  it('usa o servidor comercial quando há chave', () => {
    const url = new URL(urlPrevisao(-25, -49, { apiKey: 'abc', diasPrevisao: 40 }));
    expect(url.origin).toBe('https://customer-api.open-meteo.com');
    expect(url.searchParams.get('apikey')).toBe('abc');
    expect(url.searchParams.get('forecast_days')).toBe('16');
    expect(new URL(urlHistoricoChuva(-25, -49, '2026-07-01', '2026-07-31', { apiKey: 'abc' })).origin).toBe(
      'https://customer-archive-api.open-meteo.com',
    );
  });

  it('converte a resposta e descarta horas sem dados essenciais', () => {
    const resposta = {
      hourly: {
        time: ['2026-10-22T06:00', '2026-10-22T07:00', '2026-10-22T08:00'],
        temperature_2m: [18.2, 19.1, null],
        relative_humidity_2m: [80, 75, 70],
        precipitation: [0, 0.4, 0],
        precipitation_probability: [10, null, 20],
        wind_speed_10m: [6, 8, 9],
        wind_gusts_10m: [12, 15, 16],
        weather_code: [1, 61, 2],
      },
      daily: {
        time: ['2026-10-22', '2026-10-23'],
        precipitation_sum: [3.2, null],
        precipitation_probability_max: [60, 10],
        temperature_2m_max: [27, 29],
        temperature_2m_min: [15, 16],
        wind_gusts_10m_max: [30, 25],
        weather_code: [61, 1],
      },
    };
    const horas = lerHoras(resposta);
    expect(horas).toHaveLength(2);
    expect(horas[1]).toEqual({
      hora: '2026-10-22T07:00', temperatura: 19.1, umidade: 75, vento10m: 8, rajada10m: 15, chuva: 0.4, probChuva: null, codigoTempo: 61,
    });
    expect(lerDias(resposta)).toHaveLength(1);
    expect(lerChuvaDiaria(resposta)).toEqual([{ data: '2026-10-22', mm: 3.2 }]);
    expect(lerHoras({})).toEqual([]);
  });

  it('descreve os códigos de tempo', () => {
    expect(descreverTempo(0)).toBe('Céu limpo');
    expect(descreverTempo(81)).toBe('Pancadas de chuva');
    expect(descreverTempo(99)).toBe('Trovoada com granizo');
  });
});

describe('formatos', () => {
  it('formata horas, janelas e milímetros em português', () => {
    expect(formatarHora('2026-10-22T06:00')).toBe('6h');
    expect(formatarHora('2026-10-22T06:30')).toBe('6h30');
    expect(formatarJanela({ inicio: '2026-10-22T06:00', fim: '2026-10-22T10:00' })).toBe('das 6h às 10h');
    expect(formatarMm(2.5)).toBe('2,5 mm');
    expect(formatarMm(37.4)).toBe('37 mm');
    expect(formatarMes('2026-10')).toBe('out/26');
  });

  it('dá nome aos dias relativos a hoje', () => {
    expect(rotuloDia('2026-10-22', '2026-10-22')).toBe('hoje');
    expect(rotuloDia('2026-10-23', '2026-10-22')).toBe('amanhã');
    expect(rotuloDia('2026-10-24', '2026-10-22')).toBe('sáb, 24/10');
    expect(rotuloMomento('2026-10-23T06:00', '2026-10-22T20:00')).toBe('amanhã às 6h');
  });
});

describe('datas', () => {
  it('conta dias, soma minutos e converte para hora local', () => {
    expect(diasEntre('2026-07-01', '2026-10-22')).toBe(113);
    expect(somarMinutos('2026-10-22T23:59', 1)).toBe('2026-10-23T00:00');
    expect(isoLocal(dateLocal('2026-10-22T06:30'))).toBe('2026-10-22T06:30');
  });
});

describe('safra', () => {
  it('conta o ano agrícola de julho a junho', () => {
    expect(safraDe('2026-10-22')).toEqual({ rotulo: '2026/27', inicio: '2026-07-01', fim: '2027-06-30' });
    expect(safraDe('2027-03-10').rotulo).toBe('2026/27');
    expect(safraDe('2027-07-01').rotulo).toBe('2027/28');
  });

  it('calcula a média histórica atravessando a virada do ano e ignora anos incompletos', () => {
    const serie: { data: string; mm: number }[] = [];
    // 2001/02 completo com 1 mm/dia de 30/12 a 02/01 (4 dias) e 2002/03 com 3 mm/dia.
    for (const [ano, mm] of [[2001, 1], [2002, 3]] as const) {
      for (const data of [`${ano}-12-30`, `${ano}-12-31`, `${ano + 1}-01-01`, `${ano + 1}-01-02`]) serie.push({ data, mm });
    }
    serie.push({ data: '2003-12-30', mm: 50 }); // ano incompleto: fora da média
    expect(normalAcumulada(serie, '12-30', '01-02')).toBeCloseTo(8); // (4 + 12) / 2
    expect(normalAcumulada([], '07-01', '10-22')).toBeNull();
  });
});

describe('chuva', () => {
  const registros = mesclarChuva(
    [{ data: '2026-10-02', mm: 30 }],
    [
      { data: '2026-09-29', mm: 0 },
      { data: '2026-09-30', mm: 0.5 },
      { data: '2026-10-01', mm: 0 },
      { data: '2026-10-02', mm: 12 },
      { data: '2026-10-03', mm: 0 },
    ],
  );

  it('resume por mês separando anotado de estimado', () => {
    expect(chuvaPorMes(registros)).toEqual([
      { mes: '2026-09', mm: 0.5, diasAnotados: 0, diasEstimados: 2 },
      { mes: '2026-10', mm: 30, diasAnotados: 1, diasEstimados: 2 },
    ]);
  });

  it('acha a maior sequência sem chuva', () => {
    expect(maiorSequenciaSeca(registros)).toEqual({ inicio: '2026-09-29', fim: '2026-10-01', dias: 3 });
    expect(maiorSequenciaSeca([])).toBeNull();
  });
});

describe('relatório', () => {
  it('gera HTML com resumo, escapa texto do usuário e cita as fontes', () => {
    const html = montarRelatorioHtml({
      talhao: { nome: 'Talhão <Norte>', lat: -25.4321, lon: -49.2715, cultura: 'Soja', dataPlantio: '2026-10-05' },
      safra: safraDe('2026-10-22'),
      ate: '2026-10-03',
      geradoEm: '2026-10-22T14:35',
      chuva: mesclarChuva([{ data: '2026-10-02', mm: 30 }], [{ data: '2026-10-01', mm: 0 }, { data: '2026-10-03', mm: 1.5 }]),
      normal: 20,
      eventos: [{ data: '2026-10-02', tipo: 'granizo', nota: 'pedras pequenas' }],
    });
    expect(html).toContain('Relatório da safra 2026/27');
    expect(html).toContain('Talhão &lt;Norte&gt;');
    expect(html).not.toContain('<Norte>');
    expect(html).toContain('32 mm'); // 30 + 1,5 arredondado
    expect(html).toContain('+58%');
    expect(html).toContain('Granizo');
    expect(html).toContain('Open-Meteo');
    expect(html).toContain('Não substitui laudo');
  });
});
