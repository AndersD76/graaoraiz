import type { Doenca } from './doencas';

export type Cultura =
  | 'soja'
  | 'milho'
  | 'trigo'
  | 'feijao'
  | 'algodao'
  | 'cafe'
  | 'uva'
  | 'maca'
  | 'tomate'
  | 'batata'
  | 'hortalicas'
  | 'citros'
  | 'cana'
  | 'pastagem'
  | 'outra';

export interface InfoCultura {
  rotulo: string;
  /** Doenças guiadas pelo clima que o app acompanha nesta cultura. */
  doencas: Doenca[];
  /** Ciclo típico em dias (lavouras anuais); null em perenes. */
  cicloDias: number | null;
  /** Temperatura do solo abaixo da qual a germinação fica lenta, °C; null em perenes. */
  tSoloMinima: number | null;
  /** Geada causa dano econômico (folhas, flores ou grãos). */
  sensivelGeada: boolean;
  /** Produto secado ao sol depois da colheita (chuva no terreiro derruba a qualidade). */
  secagem?: boolean;
}

export const CULTURAS: Record<Cultura, InfoCultura> = {
  soja: { rotulo: 'Soja', doencas: ['ferrugemSoja', 'mofoBranco'], cicloDias: 120, tSoloMinima: 18, sensivelGeada: true },
  milho: { rotulo: 'Milho', doencas: ['cercosporiose'], cicloDias: 130, tSoloMinima: 10, sensivelGeada: true },
  trigo: { rotulo: 'Trigo', doencas: ['brusone', 'giberela'], cicloDias: 120, tSoloMinima: 5, sensivelGeada: true },
  feijao: { rotulo: 'Feijão', doencas: ['mofoBranco'], cicloDias: 90, tSoloMinima: 12, sensivelGeada: true },
  algodao: { rotulo: 'Algodão', doencas: [], cicloDias: 160, tSoloMinima: 18, sensivelGeada: true },
  cafe: { rotulo: 'Café', doencas: ['ferrugemCafe'], cicloDias: null, tSoloMinima: null, sensivelGeada: true, secagem: true },
  uva: { rotulo: 'Uva', doencas: ['mildio'], cicloDias: null, tSoloMinima: null, sensivelGeada: true },
  maca: { rotulo: 'Maçã', doencas: ['sarna'], cicloDias: null, tSoloMinima: null, sensivelGeada: true },
  tomate: { rotulo: 'Tomate', doencas: ['requeima'], cicloDias: 110, tSoloMinima: 15, sensivelGeada: true },
  batata: { rotulo: 'Batata', doencas: ['requeima'], cicloDias: 100, tSoloMinima: 8, sensivelGeada: true },
  hortalicas: { rotulo: 'Hortaliças', doencas: [], cicloDias: 80, tSoloMinima: 10, sensivelGeada: true },
  citros: { rotulo: 'Citros', doencas: [], cicloDias: null, tSoloMinima: null, sensivelGeada: true },
  cana: { rotulo: 'Cana', doencas: [], cicloDias: null, tSoloMinima: null, sensivelGeada: true },
  pastagem: { rotulo: 'Pastagem', doencas: [], cicloDias: null, tSoloMinima: null, sensivelGeada: false },
  outra: { rotulo: 'Outra', doencas: [], cicloDias: null, tSoloMinima: null, sensivelGeada: false },
};

export const LISTA_CULTURAS = Object.keys(CULTURAS) as Cultura[];
