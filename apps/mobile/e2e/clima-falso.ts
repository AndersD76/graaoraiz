/// <reference types="node" />
import type { Page } from '@playwright/test';

/**
 * Respostas falsas do Open-Meteo e do serviço de satélite, montadas a partir da data de hoje em São Paulo:
 * - todo dia: vento fraco das 6h às 10h (janela boa) e ventania à tarde;
 * - amanhã: madrugada de 1 °C até as 5h, céu limpo e sem vento (geada), e janela de pulverização 6h–10h;
 * - depois de amanhã: chuva forte à tarde;
 * - daqui a 3 dias: noite longa de folha molhada a 20 °C (risco alto de ferrugem-asiática);
 * - satélite: três passagens limpas com vigor subindo (0,45 → 0,62 → 0,71).
 */

function dataSP(deslocamentoDias = 0): string {
  const d = new Date(Date.now() + deslocamentoDias * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export const DATAS = { ontem: dataSP(-1), hoje: dataSP(0), amanha: dataSP(1), depois: dataSP(2), tresDias: dataSP(3) };

function previsao(diasPassados: number, diasFuturos: number) {
  const hourly = {
    time: [] as string[],
    temperature_2m: [] as number[],
    relative_humidity_2m: [] as number[],
    precipitation: [] as number[],
    precipitation_probability: [] as number[],
    wind_speed_10m: [] as number[],
    wind_gusts_10m: [] as number[],
    weather_code: [] as number[],
    dew_point_2m: [] as number[],
    cloud_cover: [] as number[],
    soil_temperature_0cm: [] as number[],
    soil_moisture_3_to_9cm: [] as number[],
    leaf_wetness_probability: [] as number[],
  };
  const daily = {
    time: [] as string[],
    precipitation_sum: [] as number[],
    precipitation_probability_max: [] as number[],
    temperature_2m_max: [] as number[],
    temperature_2m_min: [] as number[],
    wind_gusts_10m_max: [] as number[],
    weather_code: [] as number[],
    sunrise: [] as string[],
    sunset: [] as string[],
    et0_fao_evapotranspiration: [] as number[],
  };

  for (let d = -diasPassados; d < diasFuturos; d++) {
    const data = dataSP(d);
    const chuvoso = d === 2;
    const frio = d === 1;
    const molhado = d === 3;
    daily.time.push(data);
    daily.precipitation_sum.push(chuvoso ? 38 : d < 0 ? (Math.abs(d) % 9 === 0 ? 12 : 0) : 0);
    daily.precipitation_probability_max.push(chuvoso ? 90 : 10);
    daily.temperature_2m_max.push(frio ? 19 : 29);
    daily.temperature_2m_min.push(frio ? 1 : 15);
    daily.wind_gusts_10m_max.push(40);
    daily.weather_code.push(chuvoso ? 63 : frio ? 0 : 2);
    daily.sunrise.push(`${data}T05:45`);
    daily.sunset.push(`${data}T18:35`);
    daily.et0_fao_evapotranspiration.push(4.5);

    for (let h = 0; h < 24; h++) {
      hourly.time.push(`${data}T${String(h).padStart(2, '0')}:00`);
      const calmo = h >= 6 && h < 10;
      const madrugadaFria = frio && h <= 5;
      const noiteMolhada = molhado && (h < 6 || h >= 20);
      hourly.temperature_2m.push(madrugadaFria ? 1 : noiteMolhada ? 20 : calmo ? 20 : 27);
      hourly.relative_humidity_2m.push(noiteMolhada ? 96 : calmo ? 75 : 55);
      hourly.precipitation.push(chuvoso && h >= 12 ? 3 : 0);
      hourly.precipitation_probability.push(chuvoso ? 90 : 10);
      hourly.wind_speed_10m.push(madrugadaFria ? 2 : calmo ? 8 : 26);
      hourly.wind_gusts_10m.push(madrugadaFria ? 4 : calmo ? 13 : 38);
      hourly.weather_code.push(chuvoso && h >= 12 ? 63 : 1);
      hourly.dew_point_2m.push(madrugadaFria ? -1 : 15);
      hourly.cloud_cover.push(madrugadaFria ? 0 : chuvoso ? 100 : 30);
      hourly.soil_temperature_0cm.push(madrugadaFria ? -1 : 24);
      hourly.soil_moisture_3_to_9cm.push(0.24);
      hourly.leaf_wetness_probability.push(noiteMolhada ? 95 : 5);
    }
  }
  return { timezone: 'America/Sao_Paulo', hourly, daily };
}

/** Diário (chuva, mínima, máxima, rajada) entre duas datas, para a reanálise e o diário recente. */
function diario(inicio: string, fim: string) {
  const daily = {
    time: [] as string[],
    precipitation_sum: [] as number[],
    temperature_2m_min: [] as number[],
    temperature_2m_max: [] as number[],
    wind_gusts_10m_max: [] as number[],
  };
  const d = new Date(`${inicio}T12:00:00Z`);
  const ultimo = new Date(`${fim}T12:00:00Z`);
  let i = 0;
  while (d <= ultimo) {
    daily.time.push(d.toISOString().slice(0, 10));
    daily.precipitation_sum.push(i % 6 === 0 ? 9 : 0.4); // ~1,8 mm/dia de média
    daily.temperature_2m_min.push(16);
    daily.temperature_2m_max.push(30);
    daily.wind_gusts_10m_max.push(35);
    d.setUTCDate(d.getUTCDate() + 1);
    i++;
  }
  return { daily };
}

/** Intercepta Open-Meteo (previsão, diário e histórico); conta as chamadas para os testes conferirem. */
export async function usarClimaFalso(page: Page) {
  const chamadas: string[] = [];
  await page.route(/open-meteo\.com/, async (rota) => {
    const url = new URL(rota.request().url());
    chamadas.push(url.pathname);
    const passados = Number(url.searchParams.get('past_days') ?? 0);
    const futuros = Number(url.searchParams.get('forecast_days') ?? 7);
    let corpo: unknown;
    if (url.pathname.includes('archive')) corpo = diario(url.searchParams.get('start_date') ?? DATAS.hoje, url.searchParams.get('end_date') ?? DATAS.hoje);
    else if (!url.searchParams.get('hourly')) corpo = diario(dataSP(-passados), dataSP(futuros - 1));
    else corpo = previsao(passados, futuros);
    await rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(corpo) });
  });
  await usarSateliteFalso(page);
  return chamadas;
}

/** PNG 1×1 verde para os blocos de imagem do satélite. */
const PNG_VERDE = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkqPpfDwAE/gH/ifk9wAAAAABJRU5ErkJggg==', 'base64');

const CENAS = [
  { id: 'S2A_FALSA_1', data: dataSP(-20), media: 0.45 },
  { id: 'S2B_FALSA_2', data: dataSP(-10), media: 0.62 },
  { id: 'S2C_FALSA_3', data: dataSP(-3), media: 0.71 },
];

export async function usarSateliteFalso(page: Page) {
  await page.route(/planetarycomputer\.microsoft\.com/, async (rota) => {
    const url = new URL(rota.request().url());
    if (url.pathname.endsWith('/search')) {
      const features = [...CENAS].reverse().map((c) => ({ id: c.id, properties: { datetime: `${c.data}T13:38:31Z`, 'eo:cloud_cover': 2 } }));
      return rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ features }) });
    }
    if (url.pathname.endsWith('/statistics')) {
      const cena = CENAS.find((c) => c.id === url.searchParams.get('item')) ?? CENAS[0]!;
      const ndvi = '(B08-B04)/(B08+B04)';
      const nuvem = 'where((SCL==3)|(SCL==8)|(SCL==9)|(SCL==10),1,0)';
      // 10% do talhão bem abaixo da mediana: vira a mancha de vigor baixo.
      const bordas = Array.from({ length: 41 }, (_, i) => i / 40);
      const contagens = bordas.slice(0, 40).map((b) => (Math.abs(b - cena.media) < 0.05 ? 90 : Math.abs(b - 0.2) < 0.03 ? 10 : 0));
      const corpo = {
        type: 'Feature',
        properties: {
          statistics: {
            [ndvi]: { mean: cena.media, median: cena.media, count: 1000, histogram: [contagens, bordas] },
            [nuvem]: { mean: 0, median: 0, count: 1000, histogram: [[1000], [0, 1]] },
          },
        },
      };
      return rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(corpo) });
    }
    return rota.fulfill({ status: 200, contentType: 'image/png', body: PNG_VERDE });
  });
}
