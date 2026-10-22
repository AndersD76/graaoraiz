import type { Page } from '@playwright/test';

/**
 * Respostas falsas do Open-Meteo, montadas a partir da data de hoje em São Paulo:
 * - todo dia: vento fraco das 6h às 10h (janela boa) e ventania à tarde;
 * - amanhã: madrugada de 1 °C (geada) e janela de pulverização 6h–10h;
 * - depois de amanhã: chuva forte (sem janela seca até lá);
 * - do 3º ao 6º dia: tempo firme.
 */

function dataSP(deslocamentoDias = 0): string {
  const d = new Date(Date.now() + deslocamentoDias * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export const DATAS = { ontem: dataSP(-1), hoje: dataSP(0), amanha: dataSP(1), depois: dataSP(2) };

function previsao(diasPassados: number, diasFuturos: number) {
  const time: string[] = [];
  const temperature_2m: number[] = [];
  const relative_humidity_2m: number[] = [];
  const precipitation: number[] = [];
  const precipitation_probability: number[] = [];
  const wind_speed_10m: number[] = [];
  const wind_gusts_10m: number[] = [];
  const weather_code: number[] = [];
  const daily = {
    time: [] as string[],
    precipitation_sum: [] as number[],
    precipitation_probability_max: [] as number[],
    temperature_2m_max: [] as number[],
    temperature_2m_min: [] as number[],
    wind_gusts_10m_max: [] as number[],
    weather_code: [] as number[],
  };

  for (let d = -diasPassados; d < diasFuturos; d++) {
    const data = dataSP(d);
    const chuvoso = d === 2;
    const frio = d === 1;
    daily.time.push(data);
    daily.precipitation_sum.push(chuvoso ? 38 : d < 0 ? (Math.abs(d) % 9 === 0 ? 12 : 0) : 0);
    daily.precipitation_probability_max.push(chuvoso ? 90 : 10);
    daily.temperature_2m_max.push(frio ? 19 : 29);
    daily.temperature_2m_min.push(frio ? 1 : 15);
    daily.wind_gusts_10m_max.push(40);
    daily.weather_code.push(chuvoso ? 63 : frio ? 0 : 2);

    for (let h = 0; h < 24; h++) {
      time.push(`${data}T${String(h).padStart(2, '0')}:00`);
      const calmo = h >= 6 && h < 10;
      temperature_2m.push(calmo ? 20 : 27);
      relative_humidity_2m.push(calmo ? 75 : 55);
      precipitation.push(chuvoso && h >= 12 ? 3 : 0);
      precipitation_probability.push(chuvoso ? 90 : 10);
      wind_speed_10m.push(calmo ? 8 : 26);
      wind_gusts_10m.push(calmo ? 13 : 38);
      weather_code.push(chuvoso && h >= 12 ? 63 : 1);
    }
  }
  return {
    timezone: 'America/Sao_Paulo',
    hourly: { time, temperature_2m, relative_humidity_2m, precipitation, precipitation_probability, wind_speed_10m, wind_gusts_10m, weather_code },
    daily,
  };
}

function historico(url: URL) {
  const inicio = url.searchParams.get('start_date') ?? DATAS.hoje;
  const fim = url.searchParams.get('end_date') ?? DATAS.hoje;
  const time: string[] = [];
  const precipitation_sum: number[] = [];
  const d = new Date(`${inicio}T12:00:00Z`);
  const ultimo = new Date(`${fim}T12:00:00Z`);
  let i = 0;
  while (d <= ultimo) {
    time.push(d.toISOString().slice(0, 10));
    precipitation_sum.push(i % 6 === 0 ? 9 : 0.4); // ~1,8 mm/dia de média
    d.setUTCDate(d.getUTCDate() + 1);
    i++;
  }
  return { daily: { time, precipitation_sum } };
}

/** Intercepta Open-Meteo (previsão e histórico); conta as chamadas para os testes conferirem. */
export async function usarClimaFalso(page: Page) {
  const chamadas: string[] = [];
  await page.route(/open-meteo\.com/, async (rota) => {
    const url = new URL(rota.request().url());
    chamadas.push(url.pathname);
    const corpo = url.pathname.includes('archive')
      ? historico(url)
      : previsao(Number(url.searchParams.get('past_days') ?? 0), Number(url.searchParams.get('forecast_days') ?? 7));
    await rota.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(corpo) });
  });
  return chamadas;
}
