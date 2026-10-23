import { describe, expect, it } from 'vitest';

import { condicoesNaHora, protecaoAtual, verificarLavagem, type Aplicacao } from './aplicacoes';
import { avaliarColheita, chuvaChegando, diasDeSecagem, janelasColheita } from './colheita';
import { somarHoras } from './datas';
import { horaMolhada, resumoDoencas, riscoPorDia } from './doencas';
import { detectarEventos, prazoComunicacao } from './eventos';
import { geadasPrevistas } from './geada';
import { aguaDisponivel, decidirPlantio, situacaoZarc } from './plantio';
import type { Dia, Hora } from './tipos';
import { boletimFalado, vigiar } from './vigia';

/** Série horária a partir de `inicio`; cada hora pode ser alterada. */
function serie(inicio: string, n: number, alterar: (h: Hora, i: number) => Partial<Hora> = () => ({})): Hora[] {
  return Array.from({ length: n }, (_, i) => {
    const hora = somarHoras(inicio, i);
    const hh = Number(hora.slice(11, 13));
    const base: Hora = {
      hora,
      temperatura: 24,
      umidade: 65,
      vento10m: hh >= 6 && hh < 11 ? 8 : 25,
      rajada10m: hh >= 6 && hh < 11 ? 12 : 40,
      chuva: 0,
      probChuva: 5,
      nuvens: 40,
      molhamento: 0,
      umidadeSolo: 0.22,
      tSolo: 24,
    };
    return { ...base, ...alterar(base, i) };
  });
}

function dia(data: string, alteracoes: Partial<Dia> = {}): Dia {
  return { data, chuva: 0, probChuva: 10, tMax: 30, tMin: 18, rajadaMax10m: 30, ...alteracoes };
}

function aplicacao(alteracoes: Partial<Aplicacao> = {}): Aplicacao {
  return { id: 'a1', talhaoId: 't1', quando: '2026-10-22T07:00', tipo: 'fungicida', produto: 'Fungicida', horasSemChuva: 2, residualDias: 14, condicoes: null, ...alteracoes };
}

describe('caderno de aplicações', () => {
  it('guarda as condições da hora cheia da aplicação', () => {
    const horas = serie('2026-10-22T00:00', 24);
    const c = condicoesNaHora(horas, '2026-10-22T07:40');
    expect(c?.status).toBe('bom');
    expect(c?.vento2m).toBeCloseTo(6, 0);
    expect(condicoesNaHora(horas, '2026-10-25T07:00')).toBeNull();
  });

  it('chuva dentro do prazo lava o produto; pouca chuva é risco; seco é seguro', () => {
    const lavou = serie('2026-10-22T00:00', 24, (_, i) => (i === 8 ? { chuva: 3 } : {}));
    expect(verificarLavagem(aplicacao(), lavou, '2026-10-22T12:00').situacao).toBe('lavou');
    const pouca = serie('2026-10-22T00:00', 24, (_, i) => (i === 8 ? { chuva: 0.8 } : {}));
    expect(verificarLavagem(aplicacao(), pouca, '2026-10-22T12:00').situacao).toBe('risco');
    expect(verificarLavagem(aplicacao(), serie('2026-10-22T00:00', 24), '2026-10-22T12:00').situacao).toBe('segura');
  });

  it('antes do fim do prazo, chuva prevista vira risco', () => {
    const horas = serie('2026-10-22T00:00', 24, (_, i) => (i === 8 ? { chuva: 2 } : {}));
    expect(verificarLavagem(aplicacao(), horas, '2026-10-22T07:20').situacao).toBe('risco');
    expect(verificarLavagem(aplicacao(), serie('2026-10-22T00:00', 24), '2026-10-22T07:20').situacao).toBe('aguardando');
  });

  it('proteção do fungicida conta os dias a partir da última aplicação', () => {
    const p = protecaoAtual([aplicacao({ id: 'velha', quando: '2026-10-01T07:00' }), aplicacao({ id: 'nova', quando: '2026-10-15T07:00' })], '2026-10-22');
    expect(p?.aplicacaoId).toBe('nova');
    expect(p?.vence).toBe('2026-10-29');
    expect(p?.diasRestantes).toBe(7);
    expect(protecaoAtual([aplicacao({ tipo: 'herbicida', residualDias: null })], '2026-10-22')).toBeNull();
  });
});

describe('doenças', () => {
  it('usa a probabilidade de molhamento do modelo e, sem ela, a umidade', () => {
    expect(horaMolhada({ ...serie('2026-10-22T00:00', 1)[0]!, molhamento: 80 })).toBe(true);
    const { molhamento: _ignorado, ...semModelo } = serie('2026-10-22T00:00', 1)[0]!;
    expect(horaMolhada({ ...semModelo, umidade: 95 })).toBe(true);
    expect(horaMolhada({ ...semModelo, umidade: 70 })).toBe(false);
  });

  it('noite longa e molhada a 20 °C dá risco alto de ferrugem-asiática', () => {
    const horas = serie('2026-10-22T00:00', 48, (h) => {
      const hh = Number(h.hora.slice(11, 13));
      return h.hora.startsWith('2026-10-23') && (hh < 9 || hh >= 20) ? { molhamento: 90, temperatura: 20 } : {};
    });
    const dias = riscoPorDia(horas, 'ferrugemSoja');
    expect(dias.find((d) => d.data === '2026-10-22')?.nivel).toBe('baixo');
    expect(dias.find((d) => d.data === '2026-10-23')).toMatchObject({ nivel: 'alto', horas: 13 });
    const resumo = resumoDoencas(horas, ['ferrugemSoja', 'mofoBranco'], '2026-10-22');
    expect(resumo[0]).toMatchObject({ doenca: 'ferrugemSoja', nivel: 'alto', quando: '2026-10-23' });
  });

  it('molhamento frio demais não conta para a ferrugem', () => {
    const horas = serie('2026-10-22T00:00', 24, () => ({ molhamento: 90, temperatura: 8 }));
    expect(riscoPorDia(horas, 'ferrugemSoja')[0]?.nivel).toBe('baixo');
  });
});

describe('eventos para o dossiê', () => {
  const datas = (n: number, inicio = '2026-11-01') => Array.from({ length: n }, (_, i) => somarHoras(`${inicio}T00:00`, i * 24).slice(0, 10));

  it('encontra veranico, excesso de chuva, geada e vendaval', () => {
    const dias = datas(30).map((data, i) => ({
      data,
      chuva: i < 12 ? 0.5 : i === 20 ? 75 : 5,
      tMin: i === 25 ? -0.5 : 15,
      tMax: 30,
      rajada: i === 27 ? 80 : 30,
    }));
    const eventos = detectarEventos(dias);
    expect(eventos.map((e) => e.tipo)).toEqual(['veranico', 'excessoChuva', 'geada', 'vendaval']);
    expect(eventos[0]).toMatchObject({ inicio: '2026-11-01', fim: '2026-11-12', titulo: 'Veranico de 12 dias', gravidade: 'moderado' });
    expect(eventos[2]?.gravidade).toBe('severo');
  });

  it('dia sem dado quebra o veranico', () => {
    const dias = datas(12).filter((_, i) => i !== 6).map((data) => ({ data, chuva: 0 }));
    expect(detectarEventos(dias).filter((e) => e.tipo === 'veranico')).toEqual([]);
  });

  it('calcula o prazo de comunicação só quando o produtor informou o prazo', () => {
    expect(prazoComunicacao({ fim: '2026-11-12' }, 5, '2026-11-14')).toEqual({ ate: '2026-11-17', diasRestantes: 3 });
    expect(prazoComunicacao({ fim: '2026-11-12' }, null, '2026-11-14')).toBeNull();
  });
});

describe('plantio', () => {
  it('converte umidade do solo em água disponível conforme o solo', () => {
    expect(aguaDisponivel(0.27, 'medio')).toBe(1);
    expect(aguaDisponivel(0.12, 'medio')).toBe(0);
    expect(aguaDisponivel(0.195, 'medio')).toBeCloseTo(0.5, 2);
  });

  it('janela do ZARC: antes, aberta e fechada', () => {
    const j = { inicio: '2026-10-01', fim: '2026-11-30' };
    expect(situacaoZarc(j, '2026-09-25')).toEqual({ situacao: 'antes', dias: 6 });
    expect(situacaoZarc(j, '2026-11-25')).toEqual({ situacao: 'aberta', dias: 5 });
    expect(situacaoZarc(j, '2026-12-01').situacao).toBe('fechada');
  });

  it('solo úmido e chuva na previsão: pode plantar', () => {
    const horas = serie('2026-10-22T00:00', 24);
    const dias = ['2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26'].map((d, i) => dia(d, { chuva: i % 2 ? 12 : 3, probChuva: 70 }));
    const d = decidirPlantio({ horas, dias, hoje: '2026-10-22', solo: 'medio', zarc: { inicio: '2026-10-01', fim: '2026-12-31' }, tSoloMinima: 18 });
    expect(d.status).toBe('bom');
    expect(d.titulo).toBe('Pode plantar');
  });

  it('solo seco com veranico previsto: espere; fora do ZARC: fora da janela', () => {
    const horas = serie('2026-10-22T00:00', 24, () => ({ umidadeSolo: 0.13 }));
    const dias = Array.from({ length: 15 }, (_, i) => dia(somarHoras('2026-10-22T00:00', i * 24).slice(0, 10)));
    const seco = decidirPlantio({ horas, dias, hoje: '2026-10-22', solo: 'medio', zarc: null, tSoloMinima: null });
    expect(seco.status).toBe('ruim');
    expect(seco.titulo).toBe('Espere: veranico à vista');
    expect(seco.motivos.map((m) => m.texto).join(' ')).toMatch(/veranico/);
    const fora = decidirPlantio({ horas, dias, hoje: '2026-10-22', solo: 'medio', zarc: { inicio: '2026-09-01', fim: '2026-10-10' }, tSoloMinima: null });
    expect(fora.titulo).toBe('Fora da janela');
  });
});

describe('colheita e secagem', () => {
  it('hora úmida ou logo depois da chuva não serve para colher', () => {
    const horas = serie('2026-10-22T00:00', 24, (_, i) => (i === 10 ? { chuva: 2 } : i >= 14 ? { umidade: 60 } : {}));
    expect(avaliarColheita(horas, 11).status).toBe('ruim');
    expect(avaliarColheita(horas, 15).status).toBe('bom');
    expect(janelasColheita(horas, '2026-10-22').at(-1)).toMatchObject({ inicio: '2026-10-22T14:00', fim: '2026-10-23T00:00' });
  });

  it('avisa chuva chegando nas próximas horas, mas não a que já está caindo', () => {
    const horas = serie('2026-10-22T00:00', 24, (_, i) => (i === 15 ? { chuva: 4, probChuva: 90 } : {}));
    expect(chuvaChegando(horas, '2026-10-22T13:10')).toMatchObject({ hora: '2026-10-22T15:00', mm: 4 });
    expect(chuvaChegando(horas, '2026-10-22T15:10')).toBeNull();
  });

  it('marca os dias secos para o terreiro', () => {
    const horas = serie('2026-10-22T00:00', 48, (h) => (h.hora.startsWith('2026-10-23T12') ? { chuva: 3 } : {}));
    expect(diasDeSecagem(horas)).toEqual([
      { data: '2026-10-22', seco: true },
      { data: '2026-10-23', seco: false },
    ]);
  });
});

describe('geada', () => {
  it('noite limpa e calma a 3 °C vira geada provável na folha', () => {
    const horas = serie('2026-06-10T12:00', 24, (h) => {
      const hh = Number(h.hora.slice(11, 13));
      return hh >= 22 || hh <= 7 ? { temperatura: 3, nuvens: 5, vento10m: 3, tSolo: 1 } : { temperatura: 14 };
    });
    const [g] = geadasPrevistas(horas);
    expect(g).toMatchObject({ data: '2026-06-11', nivel: 'moderada', tMinAr: 3, noiteLimpaCalma: true });
    expect(g!.tMinRelva).toBeLessThanOrEqual(0);
  });

  it('noite nublada e ventosa a 5 °C não gera geada', () => {
    const horas = serie('2026-06-10T12:00', 24, () => ({ temperatura: 5, nuvens: 90, vento10m: 20, tSolo: 6 }));
    expect(geadasPrevistas(horas)).toEqual([]);
  });
});

describe('vigia', () => {
  const talhao = { id: 't1', nome: 'Talhão Norte', cultura: 'soja' as const, solo: 'medio' as const, zarc: null, plantado: true };

  it('põe temporal e lavagem no topo e sempre diz a janela de pulverização', () => {
    const horas = serie('2026-10-22T00:00', 48, (_, i) => (i === 8 ? { chuva: 3 } : i === 18 ? { codigoTempo: 95 } : {}));
    const itens = vigiar({ talhao, horas, dias: [dia('2026-10-22'), dia('2026-10-23')], agora: '2026-10-22T12:00', aplicacoes: [aplicacao()] });
    expect(itens[0]?.categoria).toBe('temporal');
    expect(itens.map((i) => i.categoria)).toContain('lavagem');
    expect(itens.find((i) => i.categoria === 'pulverizacao')).toBeDefined();
    expect(itens.find((i) => i.categoria === 'lavagem')?.pro).toBe(true);
  });

  it('risco de doença sem proteção sugere a janela para proteger', () => {
    const horas = serie('2026-10-22T00:00', 72, (h) => {
      const hh = Number(h.hora.slice(11, 13));
      return h.hora.startsWith('2026-10-24') && (hh < 9 || hh >= 20) ? { molhamento: 95, temperatura: 21, vento10m: 25, rajada10m: 40 } : {};
    });
    const itens = vigiar({ talhao, horas, dias: [], agora: '2026-10-22T05:00' });
    const doenca = itens.find((i) => i.categoria === 'doenca');
    expect(doenca?.titulo).toMatch(/Ferrugem-asiática: risco alto/);
    expect(doenca?.texto).toMatch(/Melhor janela para proteger: hoje das 6h/);
  });

  it('boletim falado troca abreviações por palavras', () => {
    const texto = boletimFalado(
      [{ id: 'x', categoria: 'pulverizacao', prioridade: 3, status: 'bom', titulo: 'Pulverize hoje das 6h às 9h30', texto: 'Vento de 8 km/h e 2 mm.', pro: false }],
      'Talhão Norte',
      '2026-10-22T06:00',
      'Daniel',
    );
    expect(texto).toBe('Bom dia, Daniel. Resumo do Talhão Norte. Pulverize hoje das 6 horas às 9 e 30. Vento de 8 quilômetros por hora e 2 milímetros. Bom trabalho.');
  });
});

describe('geometria do talhão', async () => {
  const { areaHa, quadradoEmVolta, centro } = await import('./geo');
  it('quadrado em volta do ponto tem a área pedida', () => {
    const q = quadradoEmVolta(-17.79, -50.92, 25);
    expect(areaHa(q)).toBeCloseTo(25, 0);
    expect(centro(q).lat).toBeCloseTo(-17.79, 6);
  });
  it('polígono com menos de 3 pontos não tem área', () => {
    expect(areaHa([[-17.79, -50.92], [-17.8, -50.92]])).toBe(0);
  });
});
