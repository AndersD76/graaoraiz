// Opções da avaliação da versão de teste: usadas pelo formulário (/avaliar), pela API e pelo painel.

export const AJUDOU = [
  { valor: 'pulverizacao', rotulo: 'Hora de pulverizar' },
  { valor: 'avisos', rotulo: 'Avisos de geada e temporal' },
  { valor: 'chuva', rotulo: 'Chuva e pluviômetro' },
  { valor: 'satelite', rotulo: 'Satélite e vigor' },
  { valor: 'precos', rotulo: 'Preços do dia' },
  { valor: 'eudr', rotulo: 'EUDR e crédito rural' },
  { valor: 'caderno', rotulo: 'Caderno de campo' },
] as const;

export const PERFIS = [
  { valor: 'produtor', rotulo: 'Produtor' },
  { valor: 'tecnico', rotulo: 'Agrônomo ou técnico' },
  { valor: 'cooperativa', rotulo: 'Cooperativa ou revenda' },
  { valor: 'outro', rotulo: 'Outro' },
] as const;

export const INDICARIA = [
  { valor: 'sim', rotulo: 'Sim' },
  { valor: 'talvez', rotulo: 'Talvez' },
  { valor: 'nao', rotulo: 'Não' },
] as const;

export type ValorAjudou = (typeof AJUDOU)[number]['valor'];
export type ValorPerfil = (typeof PERFIS)[number]['valor'];
export type ValorIndicaria = (typeof INDICARIA)[number]['valor'];

export function rotuloDe(lista: readonly { valor: string; rotulo: string }[], valor: string | null): string {
  return lista.find((o) => o.valor === valor)?.rotulo ?? '—';
}
