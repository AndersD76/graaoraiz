/**
 * Datas locais sem fuso ("2026-10-22T06:00" e "2026-10-22").
 * As contas usam UTC só como relógio neutro; o Brasil não tem horário de verão desde 2019.
 */

function paraMs(iso: string): number {
  const [data, hora = '00:00'] = iso.split('T');
  const [ano, mes, dia] = (data ?? '').split('-').map(Number);
  const [h, min] = hora.split(':').map(Number);
  return Date.UTC(ano ?? 0, (mes ?? 1) - 1, dia ?? 1, h ?? 0, min ?? 0);
}

function doisDigitos(n: number): string {
  return String(n).padStart(2, '0');
}

export function somarHoras(iso: string, horas: number): string {
  const d = new Date(paraMs(iso) + horas * 3_600_000);
  return (
    `${d.getUTCFullYear()}-${doisDigitos(d.getUTCMonth() + 1)}-${doisDigitos(d.getUTCDate())}` +
    `T${doisDigitos(d.getUTCHours())}:${doisDigitos(d.getUTCMinutes())}`
  );
}

export function somarMinutos(iso: string, minutos: number): string {
  return somarHoras(iso, minutos / 60);
}

/** Dias corridos de `inicio` até `fim` (datas "AAAA-MM-DD"); negativo se fim vier antes. */
export function diasEntre(inicio: string, fim: string): number {
  return Math.round((paraMs(`${fim}T00:00`) - paraMs(`${inicio}T00:00`)) / 86_400_000);
}

/** Data e hora locais de um Date no formato usado pelo pacote ("2026-10-22T06:00"). */
export function isoLocal(d: Date): string {
  return (
    `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}` +
    `T${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`
  );
}

/** Converte "2026-10-22T06:00" (hora local do aparelho) em Date. */
export function dateLocal(iso: string): Date {
  const [data, hora = '00:00'] = iso.split('T');
  const [ano, mes, dia] = (data ?? '').split('-').map(Number);
  const [h, min] = hora.split(':').map(Number);
  return new Date(ano ?? 0, (mes ?? 1) - 1, dia ?? 1, h ?? 0, min ?? 0);
}

export function somarDias(data: string, dias: number): string {
  return somarHoras(`${data}T00:00`, dias * 24).slice(0, 10);
}

export function dataDe(iso: string): string {
  return iso.slice(0, 10);
}
