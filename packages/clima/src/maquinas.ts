// Classificados de máquinas e implementos usados: tipos e listas usados pelo app e pelo servidor.

// A ordem é a dos chips: máquinas de lavoura, depois armazenagem e recebimento de grãos, "Outro" por último.
// Categoria nova precisa entrar também no check de app.anuncio (apps/web/db/contas.sql).
export const CATEGORIAS_MAQUINA = [
  { valor: 'trator', rotulo: 'Trator' },
  { valor: 'colheitadeira', rotulo: 'Colheitadeira' },
  { valor: 'plantadeira', rotulo: 'Plantadeira' },
  { valor: 'pulverizador', rotulo: 'Pulverizador' },
  { valor: 'implemento', rotulo: 'Implemento' },
  { valor: 'caminhao', rotulo: 'Caminhão' },
  { valor: 'silo', rotulo: 'Silo' },
  { valor: 'secador', rotulo: 'Secador' },
  { valor: 'limpeza', rotulo: 'Pré-limpeza' },
  { valor: 'classificador', rotulo: 'Classificador' },
  { valor: 'transportador', rotulo: 'Elevador e transportador' },
  { valor: 'tombador', rotulo: 'Tombador' },
  { valor: 'coletor', rotulo: 'Coletor de amostras' },
  { valor: 'balanca', rotulo: 'Balança' },
  { valor: 'outro', rotulo: 'Outro' },
] as const;

export type CategoriaMaquina = (typeof CATEGORIAS_MAQUINA)[number]['valor'];

export const UFS_BRASIL = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA',
  'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
] as const;

export type SituacaoAnuncio = 'ativo' | 'pausado' | 'vendido' | 'removido';

export const ORDENS_ANUNCIO = [
  { valor: 'recentes', rotulo: 'Mais recentes' },
  { valor: 'menor-preco', rotulo: 'Menor preço' },
  { valor: 'maior-preco', rotulo: 'Maior preço' },
] as const;

export type OrdemAnuncio = (typeof ORDENS_ANUNCIO)[number]['valor'];

/** Máximo de fotos por anúncio. */
export const MAX_FOTOS_ANUNCIO = 8;

/** Cartão da lista: o essencial para comparar. */
export interface AnuncioResumo {
  id: string;
  categoria: CategoriaMaquina;
  titulo: string;
  marca: string | null;
  modelo: string | null;
  ano: number | null;
  horas: number | null;
  preco: number;
  municipio: string;
  uf: string;
  /** Primeira foto (id para /api/anuncios/fotos/<id>). */
  foto: string | null;
  criadoEm: string;
}

export interface AnuncioDetalhe extends AnuncioResumo {
  descricao: string | null;
  fotos: string[];
  situacao: SituacaoAnuncio;
  /** Primeiro nome de quem anunciou. */
  vendedor: string;
  /** Anúncio da própria conta que está vendo. */
  meu: boolean;
}

/** Anúncio na lista "Meus anúncios": com a situação, os contatos recebidos e a comissão. */
export interface MeuAnuncio extends AnuncioResumo {
  situacao: SituacaoAnuncio;
  descricao: string | null;
  fotos: string[];
  /** Só de anúncios antigos: desde 24/11/2026 a conversa é pelo app. */
  whatsapp: string | null;
  contatos: number;
  comissaoPercentual: number;
  valorVenda: number | null;
  comissaoValor: number | null;
  comissaoPaga: boolean;
}

export function rotuloCategoria(valor: string): string {
  return CATEGORIAS_MAQUINA.find((c) => c.valor === valor)?.rotulo ?? 'Outro';
}

/** "R$ 285.000" (sem centavos quando redondo). */
export function formatarReais(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: Number.isInteger(valor) ? 0 : 2 });
}

/** "2018 · 4.200 h" com o que houver. */
export function resumoUso(a: Pick<AnuncioResumo, 'ano' | 'horas'>): string {
  return [a.ano ? String(a.ano) : null, a.horas !== null ? `${a.horas.toLocaleString('pt-BR')} h` : null].filter(Boolean).join(' · ');
}
