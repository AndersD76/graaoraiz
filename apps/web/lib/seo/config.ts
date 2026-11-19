// Configuração do crescimento orgânico, num lugar só: clusters, iscas, canais (inclusive IAs) e UTM.
// O painel /admin/seo, as páginas e a telemetria leem daqui.

export const CLUSTERS = {
  pulverizacao: 'Hora de pulverizar',
  geada: 'Geada',
  chuva: 'Chuva',
  'doencas-clima': 'Doenças e clima',
  'plantio-colheita': 'Plantio e colheita',
  'eudr-ambiental': 'EUDR, CAR e PRODES',
  precos: 'Preços',
  'maquinas-usadas': 'Máquinas usadas',
  'caderno-campo': 'Caderno de campo',
  satelite: 'Satélite e vigor',
} as const;
export type Cluster = keyof typeof CLUSTERS;

export function clusterValido(c: string): c is Cluster {
  return c in CLUSTERS;
}

/** Iscas: parte do resultado na tela, sem cadastro; o completo por e-mail. Cada uma com URL própria. */
export const ISCAS = {
  'boletim-pulverizacao-municipio': {
    titulo: 'Boletim de pulverização do município',
    descricao: 'As janelas para pulverizar no seu município, toda manhã por e-mail.',
    cluster: 'pulverizacao',
    caminho: '/hora-de-pulverizar',
  },
  'calculadora-delta-t': {
    titulo: 'Calculadora de delta T',
    descricao: 'Delta T na hora, com a faixa boa para aplicar.',
    cluster: 'pulverizacao',
    caminho: '/ferramentas/delta-t',
  },
  'app-talhao': {
    titulo: 'Avisos do seu talhão',
    descricao: 'Geada, temporal e janela de pulverização no ponto exato da lavoura, grátis.',
    cluster: 'pulverizacao',
    caminho: '/',
  },
  'anunciar-maquina': {
    titulo: 'Anunciar máquina grátis',
    descricao: 'Classificados de máquinas e implementos usados, sem taxa e sem comissão.',
    cluster: 'maquinas-usadas',
    caminho: '/maquinas-usadas',
  },
} as const;
export type Isca = keyof typeof ISCAS;

export function iscaValida(i: string): i is Isca {
  return i in ISCAS;
}

/** De onde veio a visita. IAs de resposta contam como canal próprio (GEO), separado da busca. */
const IAS: [RegExp, string][] = [
  [/(^|\.)chatgpt\.com$|(^|\.)openai\.com$/, 'chatgpt'],
  [/(^|\.)perplexity\.ai$/, 'perplexity'],
  [/(^|\.)gemini\.google\.com$|(^|\.)bard\.google\.com$/, 'gemini'],
  [/(^|\.)copilot\.microsoft\.com$/, 'copilot'],
  [/(^|\.)claude\.ai$/, 'claude'],
];
const BUSCADORES: [RegExp, string][] = [
  [/(^|\.)google\.[a-z.]+$/, 'google'],
  [/(^|\.)bing\.com$/, 'bing'],
  [/(^|\.)duckduckgo\.com$/, 'duckduckgo'],
  [/(^|\.)yahoo\.com$/, 'yahoo'],
  [/(^|\.)ecosia\.org$/, 'ecosia'],
];
const SOCIAIS = /(^|\.)(facebook|instagram|linkedin|t|x|twitter|youtube|tiktok|whatsapp|wa)\.(com|me|co)$/;

export type Canal = 'ia' | 'organico' | 'social' | 'referencia' | 'direto' | 'campanha';

/** Canal pelo UTM (vence) ou pelo referrer. Busca orgânica inclui Google, Bing e afins; IAs são "ia". */
export function canalDaVisita(referrer: string | null | undefined, utmSource?: string | null, utmMedium?: string | null): { canal: Canal; fonte: string } {
  if (utmSource) {
    const meio = (utmMedium ?? '').toLowerCase();
    return { canal: meio === 'organic' ? 'organico' : meio === 'social' ? 'social' : 'campanha', fonte: utmSource.toLowerCase().slice(0, 40) };
  }
  let host = '';
  try {
    host = referrer ? new URL(referrer).hostname.toLowerCase() : '';
  } catch {
    host = '';
  }
  if (!host) return { canal: 'direto', fonte: '(direto)' };
  for (const [re, nome] of IAS) if (re.test(host)) return { canal: 'ia', fonte: nome };
  for (const [re, nome] of BUSCADORES) if (re.test(host)) return { canal: 'organico', fonte: nome };
  if (SOCIAIS.test(host)) return { canal: 'social', fonte: host };
  return { canal: 'referencia', fonte: host };
}

/** Padrão de UTM dos links que nós mesmos publicamos (LinkedIn, vídeo, e-mail, parceiros). */
export function comUtm(caminho: string, fonte: string, meio: 'social' | 'email' | 'referral' | 'video', campanha: string): string {
  const u = new URL(caminho, 'https://www.appgraoraiz.com.br');
  u.searchParams.set('utm_source', fonte);
  u.searchParams.set('utm_medium', meio);
  u.searchParams.set('utm_campaign', campanha);
  return `${u.pathname}${u.search}`;
}
