/**
 * Preços de referência reais: indicadores diários do Cepea/Esalq-USP (o mesmo widget público que
 * cooperativas e sites do agro embutem) e o dólar PTAX do Banco Central (API SGS). Nada é estimado:
 * se a fonte não responder, a rota devolve erro em vez de inventar número.
 */

export interface Indicador {
  id: number;
  produto: string;
  praca: string;
  unidade: string;
  valor: number;
  /** "2026-10-27" (diário) ou "2026-09" (mensal), como o Cepea publica. */
  data: string;
  /** Culturas do app a que o preço se refere. */
  culturas: string[];
}

export interface Dolar {
  valor: number;
  data: string;
}

/** Indicadores escolhidos: id no Cepea, como reconhecer a linha e como mostrar. */
const CATALOGO: { id: number; nome: RegExp; produto: string; praca: string; unidade: string; culturas: string[] }[] = [
  { id: 92, nome: /Soja Paranagu/i, produto: 'Soja', praca: 'Paranaguá (PR)', unidade: 'R$/saca 60 kg', culturas: ['soja'] },
  { id: 12, nome: /Soja - PR/i, produto: 'Soja', praca: 'Paraná', unidade: 'R$/saca 60 kg', culturas: ['soja'] },
  { id: 77, nome: /^Milho/i, produto: 'Milho', praca: 'Campinas (SP)', unidade: 'R$/saca 60 kg', culturas: ['milho'] },
  { id: 179, nome: /Trigo - RS/i, produto: 'Trigo', praca: 'Rio Grande do Sul', unidade: 'R$/tonelada', culturas: ['trigo'] },
  { id: 178, nome: /Trigo - PR/i, produto: 'Trigo', praca: 'Paraná', unidade: 'R$/tonelada', culturas: ['trigo'] },
  { id: 91, nome: /ARROZ EM CASCA/i, produto: 'Arroz em casca', praca: 'Rio Grande do Sul (IRGA)', unidade: 'R$/saca 50 kg', culturas: [] },
  { id: 23, nome: /Ar.{1,4}bica/i, produto: 'Café arábica', praca: 'São Paulo (capital)', unidade: 'R$/saca 60 kg', culturas: ['cafe'] },
  { id: 24, nome: /Robusta/i, produto: 'Café robusta', praca: 'Espírito Santo', unidade: 'R$/saca 60 kg', culturas: ['cafe'] },
  { id: 54, nome: /Algod/i, produto: 'Algodão em pluma', praca: 'São Paulo', unidade: 'centavos de R$/libra-peso', culturas: ['algodao'] },
  { id: 162, nome: /Citros/i, produto: 'Laranja', praca: 'São Paulo', unidade: 'R$/caixa 40,8 kg', culturas: ['citros'] },
  { id: 53, nome: /car - SP/i, produto: 'Açúcar cristal', praca: 'São Paulo', unidade: 'R$/saca 50 kg', culturas: ['cana'] },
  { id: 2, nome: /Boi Gordo/i, produto: 'Boi gordo', praca: 'São Paulo', unidade: 'R$/arroba', culturas: ['pastagem'] },
];

const URL_CEPEA = 'https://www.cepea.org.br/br/widgetproduto.js.php';
const URL_DOLAR = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/1?formato=json';

function textoDaCelula(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** "R$ 1.569,61" ou "¢R$ 408,60" → 1569.61 / 408.6 */
function lerValor(texto: string): number | null {
  const m = texto.match(/([\d.]+,\d+)/);
  if (!m) return null;
  const n = Number(m[1].replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** "27/10/2026" → "2026-10-27"; "09/2026" → "2026-09" */
function lerData(texto: string): string | null {
  const dia = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dia) return `${dia[3]}-${dia[2]}-${dia[1]}`;
  const mes = texto.match(/^(\d{2})\/(\d{4})$/);
  return mes ? `${mes[2]}-${mes[1]}` : null;
}

async function buscarCepea(): Promise<Indicador[]> {
  // Um indicador por pedido seria lento; num pedido só, cada linha é reconhecida pelo nome (não pela ordem).
  const q = CATALOGO.map((c) => `id_indicador%5B%5D=${c.id}`).join('&');
  const resposta = await fetch(`${URL_CEPEA}?${q}`, { headers: { 'User-Agent': 'GraoRaiz/1.0 (+https://graoraiz.com.br)' }, cache: 'no-store', signal: AbortSignal.timeout(20_000) });
  if (!resposta.ok) throw new Error(`Cepea respondeu ${resposta.status}`);
  const html = await resposta.text();
  const corpo = html.slice(html.indexOf('<tbody'));
  const linhas = [...corpo.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => textoDaCelula(c[1])));
  const resultado: Indicador[] = [];
  for (const item of CATALOGO) {
    const linha = linhas.find((l) => l.length >= 3 && item.nome.test(l[1]));
    const data = linha ? lerData(linha[0]) : null;
    const valor = linha ? lerValor(linha[2]) : null;
    if (data && valor !== null) resultado.push({ id: item.id, produto: item.produto, praca: item.praca, unidade: item.unidade, valor, data, culturas: item.culturas });
  }
  if (resultado.length === 0) throw new Error('Cepea sem indicadores reconhecíveis');
  return resultado;
}

async function buscarDolar(): Promise<Dolar | null> {
  try {
    const resposta = await fetch(URL_DOLAR, { headers: { Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(20_000) });
    if (!resposta.ok) throw new Error(`Banco Central respondeu ${resposta.status}`);
    const [ultimo] = (await resposta.json()) as { data: string; valor: string }[];
    const data = ultimo ? lerData(ultimo.data) : null;
    const valor = ultimo ? Number(ultimo.valor) : NaN;
    return data && Number.isFinite(valor) ? { valor, data } : null;
  } catch (e) {
    console.error('[precos] dólar indisponível:', e instanceof Error ? e.message : e);
    return null;
  }
}

export interface Precos {
  indicadores: Indicador[];
  dolar: Dolar | null;
  buscadoEm: string;
  fontes: string;
}

let cache: { precos: Precos; em: number } | null = null;
const VALIDADE_MS = 30 * 60 * 1000;
/** Sem o dólar, tenta de novo logo (falha passageira não deve durar meia hora). */
const VALIDADE_INCOMPLETO_MS = 2 * 60 * 1000;

/** Preços com cache de 30 minutos (o Cepea atualiza uma vez por dia). */
export async function obterPrecos(): Promise<Precos> {
  if (cache && Date.now() - cache.em < (cache.precos.dolar ? VALIDADE_MS : VALIDADE_INCOMPLETO_MS)) return cache.precos;
  const [indicadores, dolar] = await Promise.all([buscarCepea(), buscarDolar()]);
  const precos: Precos = {
    indicadores,
    dolar,
    buscadoEm: new Date().toISOString(),
    fontes: 'Indicadores Cepea/Esalq-USP; dólar PTAX (venda) do Banco Central do Brasil.',
  };
  cache = { precos, em: Date.now() };
  return precos;
}
