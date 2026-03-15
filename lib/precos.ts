export interface CotacaoCBOT {
  preco: number; // USD cents/bushel
  variacao: number;
  timestamp: string;
}

export interface CotacaoDolar {
  compra: number;
  venda: number;
  timestamp: string;
}

export interface PrecoCooperativa {
  cooperativa: string;
  municipio: string;
  cultura: string;
  preco: number; // R$/saca
  basis?: number;
  atualizadoEm: string;
}

// 1 bushel de soja = 27.2155 kg, 1 saca = 60 kg
const BUSHEL_TO_SACA = 27.2155 / 60; // ~0.4536

export function calcularPrecoSaca(
  cbotCents: number,
  dolarBRL: number,
  basisPercent: number = 0
): number {
  const cbotUSD = cbotCents / 100;
  const precoSacaUSD = cbotUSD / BUSHEL_TO_SACA;
  const precoSacaBRL = precoSacaUSD * dolarBRL;
  return precoSacaBRL * (1 + basisPercent / 100);
}

export function calcularReceitaLiquida(
  sacas: number,
  precoSaca: number,
  fretePorSaca: number = 3.5,
  funruralPercent: number = 1.5
): {
  bruto: number;
  frete: number;
  funrural: number;
  liquido: number;
} {
  const bruto = sacas * precoSaca;
  const frete = sacas * fretePorSaca;
  const funrural = bruto * (funruralPercent / 100);
  const liquido = bruto - frete - funrural;
  return { bruto, frete, funrural, liquido };
}

export async function fetchCBOT(): Promise<CotacaoCBOT> {
  try {
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/ZS=F?interval=1d&range=1d",
      { next: { revalidate: 300 } }
    );
    const data = await res.json();
    const quote = data.chart.result[0].meta;
    return {
      preco: Math.round(quote.regularMarketPrice * 100) / 100,
      variacao:
        Math.round(
          ((quote.regularMarketPrice - quote.previousClose) /
            quote.previousClose) *
            10000
        ) / 100,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return { preco: 1050, variacao: 0.5, timestamp: new Date().toISOString() };
  }
}

export async function fetchDolar(): Promise<CotacaoDolar> {
  try {
    const res = await fetch("https://economia.awesomeapi.com.br/last/USD-BRL", {
      next: { revalidate: 300 },
    });
    const data = await res.json();
    const usd = data.USDBRL;
    return {
      compra: parseFloat(usd.bid),
      venda: parseFloat(usd.ask),
      timestamp: usd.create_date,
    };
  } catch {
    return {
      compra: 5.1,
      venda: 5.12,
      timestamp: new Date().toISOString(),
    };
  }
}
