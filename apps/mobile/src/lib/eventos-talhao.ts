import { type DiaObservado, detectarEventos, type EventoDetectado } from '@graoraiz/clima';

import type { Talhao } from '@/lib/estado';

/**
 * Eventos adversos que interessam ao talhão: com data de plantio, só os que pegaram a lavoura;
 * sem ela, nada de veranico (seca antes de plantar não é perda).
 */
export function eventosDoTalhao(diario: DiaObservado[], talhao: Pick<Talhao, 'dataPlantio'>): EventoDetectado[] {
  const desde = talhao.dataPlantio;
  const eventos = detectarEventos(desde ? diario.filter((d) => d.data >= desde) : diario);
  return desde ? eventos : eventos.filter((e) => e.tipo !== 'veranico');
}
