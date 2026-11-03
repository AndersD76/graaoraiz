import type { NomeIcone } from '@/components/icone';

/**
 * Abas do app: a mesma lista alimenta a barra nativa (SF Symbols/Material) e a da web (Phosphor).
 * São no máximo 5 (limite da barra do Android); Ajustes abre pela engrenagem do Hoje e pelo menu lateral da web.
 */
export const ABAS: { nome: string; href: '/' | '/lavoura' | '/maquinas' | '/chuva' | '/caderno'; rotulo: string; icone: NomeIcone; sf: string; md: string }[] = [
  { nome: 'index', href: '/', rotulo: 'Hoje', icone: 'nuvemSol', sf: 'sun.max.fill', md: 'wb_sunny' },
  { nome: 'lavoura', href: '/lavoura', rotulo: 'Lavoura', icone: 'planta', sf: 'leaf.fill', md: 'grass' },
  { nome: 'maquinas', href: '/maquinas', rotulo: 'Máquinas', icone: 'trator', sf: 'cart.fill', md: 'agriculture' },
  { nome: 'chuva', href: '/chuva', rotulo: 'Chuva', icone: 'gota', sf: 'cloud.rain.fill', md: 'water_drop' },
  { nome: 'caderno', href: '/caderno', rotulo: 'Caderno', icone: 'caderno', sf: 'book.closed.fill', md: 'menu_book' },
];
