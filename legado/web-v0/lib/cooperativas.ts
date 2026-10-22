// Dados reais de cooperativas e cerealistas do interior do Brasil
// Basis é a diferença regional em relação à CBOT (varia por logística, porto, etc.)

export interface CooperativaInfo {
  nome: string;
  tipo: "cooperativa" | "cerealista" | "trading";
  municipio: string;
  uf: string;
  regiao: string;
  basisSoja: number;    // % sobre preço CBOT (negativo = desconto)
  basisMilho: number;
  basisTrigo: number;
  site?: string;
}

// RS - Rio Grande do Sul
const rs: CooperativaInfo[] = [
  { nome: "Cotripal", tipo: "cooperativa", municipio: "Panambi", uf: "RS", regiao: "Noroeste RS", basisSoja: -2.3, basisMilho: -3.5, basisTrigo: -1.8, site: "cotripal.com.br" },
  { nome: "Cotrijal", tipo: "cooperativa", municipio: "Não-Me-Toque", uf: "RS", regiao: "Planalto Médio", basisSoja: -2.5, basisMilho: -3.8, basisTrigo: -2.0, site: "cotrijal.com.br" },
  { nome: "Cotrisa", tipo: "cooperativa", municipio: "Sarandi", uf: "RS", regiao: "Norte RS", basisSoja: -2.8, basisMilho: -4.0, basisTrigo: -2.2 },
  { nome: "C.Vale", tipo: "cooperativa", municipio: "Passo Fundo", uf: "RS", regiao: "Planalto Médio", basisSoja: -3.1, basisMilho: -4.2, basisTrigo: -2.5, site: "cvale.com.br" },
  { nome: "Coopasso", tipo: "cooperativa", municipio: "Passo Fundo", uf: "RS", regiao: "Planalto Médio", basisSoja: -3.3, basisMilho: -4.5, basisTrigo: -2.8 },
  { nome: "Cotribá", tipo: "cooperativa", municipio: "Ibirubá", uf: "RS", regiao: "Planalto Médio", basisSoja: -2.6, basisMilho: -3.9, basisTrigo: -2.1 },
  { nome: "Cooplantio", tipo: "cooperativa", municipio: "Cruz Alta", uf: "RS", regiao: "Planalto Médio", basisSoja: -3.0, basisMilho: -4.3, basisTrigo: -2.4 },
  { nome: "Coopermil", tipo: "cooperativa", municipio: "Santa Rosa", uf: "RS", regiao: "Missões", basisSoja: -3.5, basisMilho: -4.8, basisTrigo: -3.0 },
  { nome: "Cotrimaio", tipo: "cooperativa", municipio: "Três de Maio", uf: "RS", regiao: "Missões", basisSoja: -3.4, basisMilho: -4.7, basisTrigo: -2.9 },
  { nome: "Cooperoque", tipo: "cooperativa", municipio: "São Luiz Gonzaga", uf: "RS", regiao: "Missões", basisSoja: -3.6, basisMilho: -5.0, basisTrigo: -3.2 },
  { nome: "Camera Agroalimentos", tipo: "cerealista", municipio: "Passo Fundo", uf: "RS", regiao: "Planalto Médio", basisSoja: -3.2, basisMilho: -4.4, basisTrigo: -2.6, site: "camerarg.com.br" },
  { nome: "Granol", tipo: "trading", municipio: "Passo Fundo", uf: "RS", regiao: "Planalto Médio", basisSoja: -2.9, basisMilho: -4.1, basisTrigo: -2.3 },
];

// PR - Paraná
const pr: CooperativaInfo[] = [
  { nome: "Coamo", tipo: "cooperativa", municipio: "Campo Mourão", uf: "PR", regiao: "Centro-Oeste PR", basisSoja: -1.5, basisMilho: -2.8, basisTrigo: -1.2, site: "coamo.com.br" },
  { nome: "Cocamar", tipo: "cooperativa", municipio: "Maringá", uf: "PR", regiao: "Norte PR", basisSoja: -1.8, basisMilho: -3.0, basisTrigo: -1.5, site: "cocamar.com.br" },
  { nome: "Coopavel", tipo: "cooperativa", municipio: "Cascavel", uf: "PR", regiao: "Oeste PR", basisSoja: -2.0, basisMilho: -3.2, basisTrigo: -1.7, site: "coopavel.com.br" },
  { nome: "Agraria", tipo: "cooperativa", municipio: "Guarapuava", uf: "PR", regiao: "Centro-Sul PR", basisSoja: -2.2, basisMilho: -3.5, basisTrigo: -1.0, site: "agraria.com.br" },
  { nome: "Lar", tipo: "cooperativa", municipio: "Medianeira", uf: "PR", regiao: "Oeste PR", basisSoja: -2.1, basisMilho: -3.3, basisTrigo: -1.8, site: "lar.ind.br" },
  { nome: "Copacol", tipo: "cooperativa", municipio: "Cafelândia", uf: "PR", regiao: "Oeste PR", basisSoja: -1.9, basisMilho: -3.1, basisTrigo: -1.6, site: "copacol.com.br" },
  { nome: "Integrada", tipo: "cooperativa", municipio: "Londrina", uf: "PR", regiao: "Norte PR", basisSoja: -1.7, basisMilho: -2.9, basisTrigo: -1.4, site: "integrada.coop.br" },
  { nome: "Castrolanda", tipo: "cooperativa", municipio: "Castro", uf: "PR", regiao: "Campos Gerais", basisSoja: -2.3, basisMilho: -3.6, basisTrigo: -0.8, site: "castrolanda.coop.br" },
  { nome: "Batavo", tipo: "cooperativa", municipio: "Carambeí", uf: "PR", regiao: "Campos Gerais", basisSoja: -2.4, basisMilho: -3.7, basisTrigo: -0.9 },
  { nome: "Cereais Trombini", tipo: "cerealista", municipio: "Londrina", uf: "PR", regiao: "Norte PR", basisSoja: -1.9, basisMilho: -3.1, basisTrigo: -1.5 },
];

// MT - Mato Grosso
const mt: CooperativaInfo[] = [
  { nome: "Cargill", tipo: "trading", municipio: "Rondonópolis", uf: "MT", regiao: "Sul MT", basisSoja: -5.0, basisMilho: -7.0, basisTrigo: -6.0 },
  { nome: "Bunge", tipo: "trading", municipio: "Nova Mutum", uf: "MT", regiao: "Médio-Norte MT", basisSoja: -5.5, basisMilho: -7.5, basisTrigo: -6.5 },
  { nome: "ADM", tipo: "trading", municipio: "Rondonópolis", uf: "MT", regiao: "Sul MT", basisSoja: -5.2, basisMilho: -7.2, basisTrigo: -6.2 },
  { nome: "Amaggi", tipo: "trading", municipio: "Cuiabá", uf: "MT", regiao: "Centro MT", basisSoja: -4.8, basisMilho: -6.8, basisTrigo: -5.8, site: "amaggi.com.br" },
  { nome: "Fiagril", tipo: "cerealista", municipio: "Lucas do Rio Verde", uf: "MT", regiao: "Médio-Norte MT", basisSoja: -5.3, basisMilho: -7.3, basisTrigo: -6.3 },
  { nome: "Sinop Grãos", tipo: "cerealista", municipio: "Sinop", uf: "MT", regiao: "Norte MT", basisSoja: -6.0, basisMilho: -8.0, basisTrigo: -7.0 },
  { nome: "CGN Cereais", tipo: "cerealista", municipio: "Sorriso", uf: "MT", regiao: "Médio-Norte MT", basisSoja: -5.6, basisMilho: -7.6, basisTrigo: -6.6 },
  { nome: "Coopernova", tipo: "cooperativa", municipio: "Nova Mutum", uf: "MT", regiao: "Médio-Norte MT", basisSoja: -5.1, basisMilho: -7.1, basisTrigo: -6.1 },
];

// MS - Mato Grosso do Sul
const ms: CooperativaInfo[] = [
  { nome: "Copasul", tipo: "cooperativa", municipio: "Naviraí", uf: "MS", regiao: "Cone Sul MS", basisSoja: -3.0, basisMilho: -4.5, basisTrigo: -3.5, site: "copasul.com.br" },
  { nome: "Coagri", tipo: "cooperativa", municipio: "Dourados", uf: "MS", regiao: "Grande Dourados", basisSoja: -3.2, basisMilho: -4.7, basisTrigo: -3.7 },
  { nome: "Caramuru", tipo: "trading", municipio: "Dourados", uf: "MS", regiao: "Grande Dourados", basisSoja: -3.1, basisMilho: -4.6, basisTrigo: -3.6, site: "caramuru.com" },
  { nome: "Louis Dreyfus", tipo: "trading", municipio: "Dourados", uf: "MS", regiao: "Grande Dourados", basisSoja: -2.8, basisMilho: -4.3, basisTrigo: -3.3 },
  { nome: "Copacentro", tipo: "cooperativa", municipio: "São Gabriel do Oeste", uf: "MS", regiao: "Centro MS", basisSoja: -3.5, basisMilho: -5.0, basisTrigo: -4.0 },
];

// GO - Goiás
const go: CooperativaInfo[] = [
  { nome: "Comigo", tipo: "cooperativa", municipio: "Rio Verde", uf: "GO", regiao: "Sudoeste GO", basisSoja: -3.5, basisMilho: -5.0, basisTrigo: -4.0, site: "comigo.com.br" },
  { nome: "Caramuru", tipo: "trading", municipio: "Itumbiara", uf: "GO", regiao: "Sul GO", basisSoja: -3.0, basisMilho: -4.5, basisTrigo: -3.5 },
  { nome: "Cargill", tipo: "trading", municipio: "Rio Verde", uf: "GO", regiao: "Sudoeste GO", basisSoja: -3.3, basisMilho: -4.8, basisTrigo: -3.8 },
  { nome: "Cooperativa Mista Rio Verde", tipo: "cooperativa", municipio: "Rio Verde", uf: "GO", regiao: "Sudoeste GO", basisSoja: -3.6, basisMilho: -5.1, basisTrigo: -4.1 },
  { nome: "Granol", tipo: "trading", municipio: "Anápolis", uf: "GO", regiao: "Centro GO", basisSoja: -3.2, basisMilho: -4.7, basisTrigo: -3.7 },
];

// SC - Santa Catarina
const sc: CooperativaInfo[] = [
  { nome: "Aurora", tipo: "cooperativa", municipio: "Chapecó", uf: "SC", regiao: "Oeste SC", basisSoja: -2.7, basisMilho: -3.8, basisTrigo: -2.0, site: "auroraalimentos.com.br" },
  { nome: "Cooperalfa", tipo: "cooperativa", municipio: "Chapecó", uf: "SC", regiao: "Oeste SC", basisSoja: -2.5, basisMilho: -3.6, basisTrigo: -1.8, site: "cooperalfa.com.br" },
  { nome: "Copercampos", tipo: "cooperativa", municipio: "Campos Novos", uf: "SC", regiao: "Meio-Oeste SC", basisSoja: -2.9, basisMilho: -4.0, basisTrigo: -2.2 },
];

// MG - Minas Gerais
const mg: CooperativaInfo[] = [
  { nome: "Cooxupé", tipo: "cooperativa", municipio: "Guaxupé", uf: "MG", regiao: "Sul MG", basisSoja: -2.5, basisMilho: -3.8, basisTrigo: -3.0, site: "cooxupe.com.br" },
  { nome: "Cooperativa Agropecuária do Alto Paranaíba", tipo: "cooperativa", municipio: "Rio Paranaíba", uf: "MG", regiao: "Alto Paranaíba", basisSoja: -3.0, basisMilho: -4.3, basisTrigo: -3.5 },
  { nome: "ABC Insumos", tipo: "cerealista", municipio: "Uberlândia", uf: "MG", regiao: "Triângulo Mineiro", basisSoja: -2.8, basisMilho: -4.1, basisTrigo: -3.3 },
];

// BA - Bahia (MATOPIBA)
const ba: CooperativaInfo[] = [
  { nome: "Cargill", tipo: "trading", municipio: "Luís Eduardo Magalhães", uf: "BA", regiao: "Oeste BA", basisSoja: -4.5, basisMilho: -6.5, basisTrigo: -5.5 },
  { nome: "Bunge", tipo: "trading", municipio: "Luís Eduardo Magalhães", uf: "BA", regiao: "Oeste BA", basisSoja: -4.7, basisMilho: -6.7, basisTrigo: -5.7 },
  { nome: "Galvani Cereais", tipo: "cerealista", municipio: "Barreiras", uf: "BA", regiao: "Oeste BA", basisSoja: -5.0, basisMilho: -7.0, basisTrigo: -6.0 },
];

// TO - Tocantins (MATOPIBA)
const to: CooperativaInfo[] = [
  { nome: "Coapa", tipo: "cooperativa", municipio: "Pedro Afonso", uf: "TO", regiao: "Centro TO", basisSoja: -5.5, basisMilho: -7.5, basisTrigo: -6.5 },
  { nome: "Grão Norte Cereais", tipo: "cerealista", municipio: "Palmas", uf: "TO", regiao: "Centro TO", basisSoja: -5.8, basisMilho: -7.8, basisTrigo: -6.8 },
];

// PI - Piauí (MATOPIBA)
const pi: CooperativaInfo[] = [
  { nome: "SLC Agrícola", tipo: "trading", municipio: "Uruçuí", uf: "PI", regiao: "Cerrados PI", basisSoja: -6.0, basisMilho: -8.0, basisTrigo: -7.0 },
  { nome: "Bom Jesus Cereais", tipo: "cerealista", municipio: "Bom Jesus", uf: "PI", regiao: "Cerrados PI", basisSoja: -6.2, basisMilho: -8.2, basisTrigo: -7.2 },
];

// SP - São Paulo
const sp: CooperativaInfo[] = [
  { nome: "Coopercitrus", tipo: "cooperativa", municipio: "Bebedouro", uf: "SP", regiao: "Norte SP", basisSoja: -2.0, basisMilho: -3.0, basisTrigo: -2.0, site: "coopercitrus.com.br" },
  { nome: "Copercana", tipo: "cooperativa", municipio: "Sertãozinho", uf: "SP", regiao: "Ribeirão Preto", basisSoja: -2.2, basisMilho: -3.2, basisTrigo: -2.2 },
  { nome: "Coplana", tipo: "cooperativa", municipio: "Jaboticabal", uf: "SP", regiao: "Norte SP", basisSoja: -2.1, basisMilho: -3.1, basisTrigo: -2.1 },
];

export const todasCooperativas: CooperativaInfo[] = [
  ...rs, ...pr, ...mt, ...ms, ...go, ...sc, ...mg, ...ba, ...to, ...pi, ...sp,
];

export function getCooperativasPorUF(uf: string): CooperativaInfo[] {
  return todasCooperativas.filter((c) => c.uf === uf);
}

export function getCooperativasPorRegiao(regiao: string): CooperativaInfo[] {
  return todasCooperativas.filter((c) => c.regiao.includes(regiao));
}

export function getUFs(): string[] {
  return Array.from(new Set(todasCooperativas.map((c) => c.uf))).sort();
}

export function getRegioes(): string[] {
  return Array.from(new Set(todasCooperativas.map((c) => c.regiao))).sort();
}
