// Os critérios de pulverização do app, em linguagem de produtor, lidos dos limiares reais do pacote de clima.
import { LIMIARES_PULVERIZACAO_PADRAO as L } from '@graoraiz/clima';

export interface Criterio {
  criterio: string;
  boa: string;
  cuidado: string;
  naoAplicar: string;
  porque: string;
  glossario: string | null;
}

export const CRITERIOS: Criterio[] = [
  {
    criterio: 'Delta T',
    boa: `${L.deltaT.idealMinimo} a ${L.deltaT.idealMaximo} °C`,
    cuidado: `abaixo de ${L.deltaT.idealMinimo} °C ou de ${L.deltaT.idealMaximo} a ${L.deltaT.maximo} °C`,
    naoAplicar: `acima de ${L.deltaT.maximo} °C`,
    porque: 'Mostra quanto a gota evapora no caminho até a folha: ar muito seco some com a gota; ar saturado deixa a gota escorrer.',
    glossario: 'delta-t',
  },
  {
    criterio: 'Vento na altura da barra (2 m)',
    boa: `${L.vento2m.minimo} a ${L.vento2m.idealMaximo} km/h`,
    cuidado: `abaixo de ${L.vento2m.minimo} km/h (risco de inversão térmica) ou de ${L.vento2m.idealMaximo} a ${L.vento2m.maximo} km/h`,
    naoAplicar: `acima de ${L.vento2m.maximo} km/h`,
    porque: 'Vento forte leva a calda para fora do alvo (deriva); vento quase parado pode indicar ar estável, que segura as gotas finas no ar.',
    glossario: 'deriva',
  },
  {
    criterio: 'Rajada na altura da barra',
    boa: `abaixo de ${L.rajada2m.atencao} km/h`,
    cuidado: `de ${L.rajada2m.atencao} a ${L.rajada2m.maximo} km/h`,
    naoAplicar: `${L.rajada2m.maximo} km/h ou mais`,
    porque: 'Rajadas mudam a direção e a força do vento de repente, mesmo com a média boa.',
    glossario: null,
  },
  {
    criterio: 'Umidade relativa do ar',
    boa: `${L.umidade.idealMinima}% ou mais`,
    cuidado: `de ${L.umidade.minima} a ${L.umidade.idealMinima}%`,
    naoAplicar: `abaixo de ${L.umidade.minima}%`,
    porque: 'Com ar seco a gota evapora antes de chegar à planta.',
    glossario: 'umidade-relativa-do-ar',
  },
  {
    criterio: 'Temperatura do ar',
    boa: `até ${L.temperatura.idealMaxima} °C`,
    cuidado: `de ${L.temperatura.idealMaxima} a ${L.temperatura.maxima} °C`,
    naoAplicar: `acima de ${L.temperatura.maxima} °C`,
    porque: 'Calor forte aumenta a evaporação e o estresse da planta na hora da aplicação.',
    glossario: null,
  },
  {
    criterio: `Chuva nas ${L.chuva.horasSemChuvaApos} horas seguintes`,
    boa: `menos de ${String(L.chuva.mmMaximo).replace('.', ',')} mm e chance abaixo de ${L.chuva.probAtencao}%`,
    cuidado: `chance de ${L.chuva.probAtencao} a ${L.chuva.probMaxima}%`,
    naoAplicar: `chovendo, ${String(L.chuva.mmMaximo).replace('.', ',')} mm ou mais previstos, ou chance de ${L.chuva.probMaxima}% ou mais`,
    porque: 'Chuva logo depois da aplicação pode lavar o produto da folha antes de ele agir.',
    glossario: 'chuva-acumulada',
  },
];

export const FONTES_METODO = [
  { nome: 'FAO, Irrigation and Drainage Paper 56 (Allen et al., 1998), cap. 3, eq. 47: perfil de vento para converter 10 m em 2 m', url: 'https://www.fao.org/4/x0490e/x0490e07.htm' },
  { nome: 'Stull, R. (2011). Wet-Bulb Temperature from Relative Humidity and Air Temperature. Journal of Applied Meteorology and Climatology, 50(11)', url: 'https://doi.org/10.1175/JAMC-D-11-0143.1' },
  { nome: 'Open-Meteo: previsão horária (modelos meteorológicos), licença CC BY 4.0', url: 'https://open-meteo.com/en/docs' },
  { nome: 'IBGE, Produção Agrícola Municipal, tabela 5457 (SIDRA)', url: 'https://sidra.ibge.gov.br/tabela/5457' },
];
