import type { NomeIcone } from '@/components/icone';

/** Abas do app: a mesma lista alimenta a barra nativa (SF Symbols/Material) e a da web (Phosphor). */
export const ABAS: { nome: string; href: '/' | '/lavoura' | '/caderno' | '/chuva' | '/ajustes'; rotulo: string; icone: NomeIcone; sf: string; md: string }[] = [
  { nome: 'index', href: '/', rotulo: 'Hoje', icone: 'nuvemSol', sf: 'sun.max.fill', md: 'wb_sunny' },
  { nome: 'lavoura', href: '/lavoura', rotulo: 'Lavoura', icone: 'planta', sf: 'leaf.fill', md: 'grass' },
  { nome: 'caderno', href: '/caderno', rotulo: 'Caderno', icone: 'caderno', sf: 'book.closed.fill', md: 'menu_book' },
  { nome: 'chuva', href: '/chuva', rotulo: 'Chuva', icone: 'gota', sf: 'cloud.rain.fill', md: 'water_drop' },
  { nome: 'ajustes', href: '/ajustes', rotulo: 'Ajustes', icone: 'engrenagem', sf: 'gearshape.fill', md: 'settings' },
];
