import { describe, expect, it } from 'vitest';

import {
  type Anel,
  arquivoEudr,
  avaliarCredito,
  avaliarEudr,
  contornoCruzado,
  type Desmatamento,
  type ImovelCar,
  inicioChecagemCredito,
  MARCO_CREDITO,
  MARCO_EUDR,
  momentoDoDesmatamento,
  montarFichaConformidadeHtml,
  type ResultadoConformidade,
} from './conformidade';

const TALHAO: Anel = [
  [-28.2, -52.42],
  [-28.2, -52.41],
  [-28.21, -52.41],
  [-28.21, -52.42],
];

function desmat(ano: number, dataImagem: string | null, areaHa = 1.2): Desmatamento {
  return { bioma: 'Mata Atlântica', ano, dataImagem, areaHa, partes: [TALHAO] };
}

function imovel(alteracoes: Partial<ImovelCar> = {}): ImovelCar {
  return {
    codigo: 'RS-4314100-ABC',
    situacao: 'AT',
    condicao: 'Aguardando análise',
    areaHa: 65.6,
    modulosFiscais: 4.1,
    municipio: 'Passo Fundo',
    uf: 'RS',
    sobreposicaoHa: 40,
    contorno: TALHAO,
    desmatamento: [],
    ...alteracoes,
  };
}

function resultado(alteracoes: Partial<ResultadoConformidade> = {}): ResultadoConformidade {
  return { consultadoEm: '2026-10-28T10:00', areaTalhaoHa: 47.3, desmatamentoTalhao: [], imoveis: [imovel()], falhas: [], ...alteracoes };
}

describe('momento do desmatamento', () => {
  it('ano do PRODES inteiro depois do marco é depois', () => {
    expect(momentoDoDesmatamento(desmat(2022, '2022-08-10'), MARCO_EUDR)).toBe('depois');
    expect(momentoDoDesmatamento(desmat(2020, '2020-07-20'), MARCO_CREDITO)).toBe('depois');
  });

  it('imagem de antes do marco prova que foi antes', () => {
    expect(momentoDoDesmatamento(desmat(2021, '2020-11-30'), MARCO_EUDR)).toBe('antes');
    expect(momentoDoDesmatamento(desmat(2017, '2017-11-20'), MARCO_CREDITO)).toBe('antes');
  });

  it('ano que atravessa o marco, ou imagem tardia, fica para conferir', () => {
    expect(momentoDoDesmatamento(desmat(2021, '2021-07-15'), MARCO_EUDR)).toBe('incerto');
    expect(momentoDoDesmatamento(desmat(2021, null), MARCO_EUDR)).toBe('incerto');
    expect(momentoDoDesmatamento(desmat(2019, '2019-08-14'), MARCO_CREDITO)).toBe('incerto');
  });

  it('sem data de imagem, ano que termina antes do marco é antes', () => {
    expect(momentoDoDesmatamento(desmat(2019, null), MARCO_CREDITO)).toBe('antes');
  });
});

describe('EUDR', () => {
  it('sem desmatamento no talhão é livre', () => {
    expect(avaliarEudr(resultado()).veredito).toBe('livre');
  });

  it('desmatamento depois de 2020 pede atenção e soma a área', () => {
    const a = avaliarEudr(resultado({ desmatamentoTalhao: [desmat(2023, '2023-08-01', 2), desmat(2022, '2022-08-01', 0.5), desmat(2018, '2018-08-01', 9)] }));
    expect(a.veredito).toBe('atencao');
    expect(a.areaDepoisHa).toBeCloseTo(2.5);
    expect(a.titulo).toContain('2,5 ha');
  });

  it('só desmatamento antigo continua livre', () => {
    expect(avaliarEudr(resultado({ desmatamentoTalhao: [desmat(2019, '2019-08-01')] })).veredito).toBe('livre');
  });

  it('ano que atravessa o marco manda conferir', () => {
    expect(avaliarEudr(resultado({ desmatamentoTalhao: [desmat(2021, '2021-06-01')] })).veredito).toBe('conferir');
  });

  it('PRODES fora do ar sem achado é inconclusivo, mas um achado vale mesmo assim', () => {
    expect(avaliarEudr(resultado({ falhas: ['PRODES Pampa'] })).veredito).toBe('inconclusivo');
    expect(avaliarEudr(resultado({ falhas: ['PRODES Pampa'], desmatamentoTalhao: [desmat(2024, '2024-08-01')] })).veredito).toBe('atencao');
  });
});

describe('crédito rural', () => {
  it('calendário da Res. CMN 5.303/2026 pelo tamanho do imóvel', () => {
    expect(inicioChecagemCredito(20).data).toBe('2027-01-04');
    expect(inicioChecagemCredito(15).data).toBe('2027-07-01');
    expect(inicioChecagemCredito(4.1).data).toBe('2027-07-01');
    expect(inicioChecagemCredito(4).data).toBe('2028-01-01');
    expect(inicioChecagemCredito(null).data).toBe('2028-01-01');
  });

  it('imóvel ativo sem supressão é livre', () => {
    const a = avaliarCredito(resultado());
    expect(a.veredito).toBe('livre');
    expect(a.inicio?.data).toBe('2027-07-01');
  });

  it('olha o imóvel inteiro: supressão fora do talhão também conta', () => {
    const a = avaliarCredito(resultado({ imoveis: [imovel({ desmatamento: [desmat(2021, '2021-08-01', 3)] })] }));
    expect(a.veredito).toBe('atencao');
    expect(a.areaDepoisHa).toBe(3);
  });

  it('CAR suspenso ou cancelado pede atenção; pendente manda conferir', () => {
    expect(avaliarCredito(resultado({ imoveis: [imovel({ situacao: 'SU' })] })).veredito).toBe('atencao');
    expect(avaliarCredito(resultado({ imoveis: [imovel({ situacao: 'CA' })] })).veredito).toBe('atencao');
    expect(avaliarCredito(resultado({ imoveis: [imovel({ situacao: 'PE' })] })).veredito).toBe('conferir');
  });

  it('sem CAR manda conferir; CAR fora do ar é inconclusivo', () => {
    expect(avaliarCredito(resultado({ imoveis: [] })).veredito).toBe('conferir');
    expect(avaliarCredito(resultado({ imoveis: [], falhas: ['CAR RS'] })).veredito).toBe('inconclusivo');
  });

  it('usa o imóvel com a maior parte do talhão', () => {
    const a = avaliarCredito(resultado({ imoveis: [imovel({ codigo: 'A', sobreposicaoHa: 2 }), imovel({ codigo: 'B', sobreposicaoHa: 30 })] }));
    expect(a.imovel?.codigo).toBe('B');
  });
});

describe('arquivo da EUDR', () => {
  it('gera polígono [lon, lat] com 6 casas, fechado, anti-horário e com as propriedades da UE', () => {
    const geo = arquivoEudr([{ nome: 'Trigo do Capão', contorno: [[-28.1234567891, -52.1], [-28.2, -52.1], [-28.2, -52.2]], areaHa: 47.345 }], ' João ');
    expect(geo.type).toBe('FeatureCollection');
    const f = geo.features[0]!;
    expect(f.properties).toEqual({ ProducerName: 'João', ProducerCountry: 'BR', ProductionPlace: 'Trigo do Capão', Area: 47.35 });
    const anel = f.geometry.coordinates[0]!;
    expect(anel[0]).toEqual(anel[anel.length - 1]);
    expect(anel).toContainEqual([-52.1, -28.123457]);
    let dobro = 0;
    for (let i = 0; i < anel.length - 1; i++) dobro += anel[i]![0] * anel[i + 1]![1] - anel[i + 1]![0] * anel[i]![1];
    expect(dobro).toBeGreaterThan(0);
  });

  it('tira pontos repetidos e descarta contorno sem área', () => {
    const geo = arquivoEudr([
      { nome: 'A', contorno: [[-28, -52], [-28, -52], [-28.1, -52], [-28.1, -52.1], [-28, -52]] },
      { nome: 'linha', contorno: [[-28, -52], [-28.1, -52], [-28.2, -52]] },
    ]);
    expect(geo.features).toHaveLength(1);
    expect(geo.features[0]!.geometry.coordinates[0]).toHaveLength(4);
    expect(geo.features[0]!.properties.ProducerName).toBeUndefined();
  });

  it('acha contorno cruzado em "oito"', () => {
    expect(contornoCruzado(TALHAO)).toBe(false);
    expect(contornoCruzado([[-28.2, -52.42], [-28.21, -52.41], [-28.2, -52.41], [-28.21, -52.42]])).toBe(true);
  });
});

describe('ficha em PDF', () => {
  it('traz os dois resultados, o CAR, os vértices e escapa o texto', () => {
    const html = montarFichaConformidadeHtml({
      talhao: { nome: 'Soja <da> Sanga', cultura: 'soja', areaHa: 37.1, contorno: TALHAO },
      produtor: 'Demonstração',
      documento: '000.000.000-00',
      resultado: resultado({ desmatamentoTalhao: [desmat(2023, '2023-08-01')] }),
      geradoEm: '2026-10-28T10:05',
    });
    expect(html).toContain('Soja &lt;da&gt; Sanga');
    expect(html).toContain('Desmatamento depois de 2020');
    expect(html).toContain('RS-4314100-ABC');
    expect(html).toContain('-28.210000');
    expect(html).toContain('<svg');
  });
});
