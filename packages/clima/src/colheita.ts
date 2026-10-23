import { dataDe, somarHoras } from './datas';
import type { Hora, Status } from './tipos';
import { piorStatus } from './tipos';

/**
 * Colheita e secagem: o grão e o café no terreiro precisam de horas sem chuva, ar seco e folha
 * sem orvalho. Chuva logo depois de colher ou no terreiro derruba a qualidade e o preço.
 */

export interface AvaliacaoColheita {
  hora: string;
  status: Status;
  motivos: string[];
}

export function avaliarColheita(horas: Hora[], indice: number): AvaliacaoColheita {
  const h = horas[indice];
  if (!h) throw new RangeError(`Hora ${indice} fora da série`);
  const motivos: { status: Status; texto: string }[] = [];
  const antes = horas.slice(Math.max(0, indice - 3), indice).reduce((s, x) => s + x.chuva, 0);
  const depois = horas.slice(indice + 1, indice + 3);
  const probDepois = Math.max(0, ...depois.map((x) => x.probChuva ?? 0));

  if (h.chuva > 0.1) motivos.push({ status: 'ruim', texto: 'chovendo' });
  else if (antes >= 0.5) motivos.push({ status: 'ruim', texto: 'choveu há pouco: lavoura molhada' });
  if (h.umidade >= 85) motivos.push({ status: 'ruim', texto: `ar muito úmido (${Math.round(h.umidade)}%)` });
  else if (h.umidade >= 72) motivos.push({ status: 'atencao', texto: `umidade alta (${Math.round(h.umidade)}%)` });
  if (h.molhamento !== undefined && h.molhamento >= 50 && h.chuva <= 0.1) motivos.push({ status: 'atencao', texto: 'orvalho' });
  if (probDepois >= 60) motivos.push({ status: 'ruim', texto: `chuva provável nas próximas 2 h (${probDepois}%)` });
  else if (probDepois >= 40) motivos.push({ status: 'atencao', texto: `chance de chuva nas próximas 2 h (${probDepois}%)` });

  return { hora: h.hora, status: motivos.reduce<Status>((s, m) => piorStatus(s, m.status), 'bom'), motivos: motivos.map((m) => m.texto) };
}

export interface JanelaHoras {
  inicio: string;
  fim: string;
  horas: number;
}

/** Horas boas seguidas (mínimo 2) de um dia. */
export function janelasColheita(horas: Hora[], data: string): JanelaHoras[] {
  const janelas: JanelaHoras[] = [];
  let atual: JanelaHoras | null = null;
  horas.forEach((h, i) => {
    if (dataDe(h.hora) !== data) return;
    const boa = avaliarColheita(horas, i).status === 'bom';
    if (boa && atual && atual.fim === h.hora) {
      atual.fim = somarHoras(h.hora, 1);
      atual.horas += 1;
    } else if (boa) {
      if (atual && atual.horas >= 2) janelas.push(atual);
      atual = { inicio: h.hora, fim: somarHoras(h.hora, 1), horas: 1 };
    } else {
      if (atual && atual.horas >= 2) janelas.push(atual);
      atual = null;
    }
  });
  const ultima = atual as JanelaHoras | null;
  if (ultima && ultima.horas >= 2) janelas.push(ultima);
  return janelas;
}

export interface ChuvaChegando {
  /** Primeira hora com chuva relevante. */
  hora: string;
  mm: number;
  prob: number | null;
}

/** Primeira hora com chuva relevante nas próximas `janelaHoras` (para cobrir o café, enleirar o feno, tirar a máquina). */
export function chuvaChegando(horas: Hora[], agora: string, janelaHoras = 6): ChuvaChegando | null {
  const desde = `${agora.slice(0, 13)}:00`;
  const ate = somarHoras(desde, janelaHoras);
  const h = horas.find((x) => x.hora > desde && x.hora <= ate && (x.chuva >= 0.5 || (x.probChuva ?? 0) >= 70));
  if (!h) return null;
  // Chuva já caindo agora não é "chegando".
  const atual = horas.find((x) => x.hora === desde);
  if (atual && atual.chuva >= 0.5) return null;
  return { hora: h.hora, mm: h.chuva, prob: h.probChuva };
}

export interface DiaSecagem {
  data: string;
  seco: boolean;
}

/** Dia bom de terreiro/secagem: sem chuva, chance baixa e umidade média moderada (horas das 8h às 17h). */
export function diasDeSecagem(horas: Hora[]): DiaSecagem[] {
  const porDia = new Map<string, Hora[]>();
  for (const h of horas) {
    const hh = Number(h.hora.slice(11, 13));
    if (hh < 8 || hh > 17) continue;
    const lista = porDia.get(dataDe(h.hora)) ?? [];
    lista.push(h);
    porDia.set(dataDe(h.hora), lista);
  }
  return [...porDia.entries()]
    .filter(([, lista]) => lista.length >= 8)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, lista]) => {
      const chuva = lista.reduce((s, h) => s + h.chuva, 0);
      const prob = Math.max(0, ...lista.map((h) => h.probChuva ?? 0));
      const umidade = lista.reduce((s, h) => s + h.umidade, 0) / lista.length;
      return { data, seco: chuva < 0.5 && prob < 40 && umidade < 75 };
    });
}
