import { dataDe, somarDias } from './datas';

const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const DIAS_LONGOS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function partes(data: string): [number, number, number] {
  const [a, m, d] = data.split('-').map(Number);
  return [a ?? 0, m ?? 1, d ?? 1];
}

export function diaDaSemana(data: string, longo = false): string {
  const [a, m, d] = partes(data);
  const indice = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
  return (longo ? DIAS_LONGOS : DIAS_CURTOS)[indice] ?? '';
}

/** "2026-10-23" → "23/10". */
export function formatarData(data: string): string {
  const [, m, d] = partes(data);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

/** "2026-10" → "out/26". */
export function formatarMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number);
  return `${MESES[(m ?? 1) - 1] ?? ''}/${String((a ?? 0) % 100).padStart(2, '0')}`;
}

/** "2026-10-22T06:00" → "6h"; "06:30" → "6h30". */
export function formatarHora(iso: string): string {
  const hora = iso.includes('T') ? iso.split('T')[1] ?? '' : iso;
  const [h, min] = hora.split(':').map(Number);
  return min ? `${h}h${String(min).padStart(2, '0')}` : `${h}h`;
}

export function formatarJanela(janela: { inicio: string; fim: string }): string {
  return `das ${formatarHora(janela.inicio)} às ${formatarHora(janela.fim)}`;
}

/** Número em português com até `casas` decimais, sem zeros sobrando: 2.5 → "2,5"; 12 → "12". */
export function formatarNumero(n: number, casas = 1): string {
  const fator = 10 ** casas;
  const arredondado = Math.round(n * fator) / fator;
  return arredondado.toLocaleString('pt-BR', { maximumFractionDigits: casas });
}

export function formatarMm(mm: number): string {
  return `${formatarNumero(mm, mm < 10 ? 1 : 0)} mm`;
}

/** "hoje", "amanhã" ou "qui, 23/10". */
export function rotuloDia(data: string, hoje: string): string {
  if (data === hoje) return 'hoje';
  if (data === somarDias(hoje, 1)) return 'amanhã';
  return `${diaDaSemana(data)}, ${formatarData(data)}`;
}

/** Rótulo de um momento relativo ao agora: "hoje às 16h", "amanhã às 6h". */
export function rotuloMomento(iso: string, agora: string): string {
  return `${rotuloDia(dataDe(iso), dataDe(agora))} às ${formatarHora(iso)}`;
}
