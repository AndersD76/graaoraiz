import { z } from 'zod';

/** Número obrigatório vindo da query string ("" e ausência contam como não informado). */
export function numeroObrigatorio(nome: string, min: number, max: number) {
  const faixa = `${nome} deve ser um número entre ${min} e ${max}.`;
  return z
    .string({ error: `Informe ${nome}.` })
    .trim()
    .min(1, `Informe ${nome}.`)
    .transform(Number)
    .pipe(z.number({ error: faixa }).min(min, faixa).max(max, faixa));
}

/** Inteiro opcional da query string, com valor padrão. */
export function inteiroOpcional(nome: string, min: number, max: number, padrao: number) {
  const faixa = `${nome} deve ser um número inteiro entre ${min} e ${max}.`;
  return z
    .string({ error: faixa })
    .trim()
    .min(1, faixa)
    .transform(Number)
    .pipe(z.number({ error: faixa }).int(faixa).min(min, faixa).max(max, faixa))
    .default(padrao);
}

/** Verifica se "AAAA-MM-DD" é uma data que existe no calendário. */
export function dataExiste(iso: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

export function dataObrigatoria(nome: string) {
  const formato = `Informe ${nome} no formato AAAA-MM-DD.`;
  return z
    .string({ error: formato })
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, formato)
    .refine(dataExiste, `${nome} não é uma data válida.`);
}

/** Soma anos a uma data ISO mantendo mês e dia (serve para comparar como texto). */
export function somarAnos(iso: string, anos: number): string {
  const ano = Number(iso.slice(0, 4)) + anos;
  return `${String(ano).padStart(4, '0')}${iso.slice(4)}`;
}

/** Primeira mensagem de erro da validação, para devolver em { erro }. */
export function primeiraMensagem(erro: z.ZodError): string {
  return erro.issues[0]?.message ?? 'Parâmetros inválidos.';
}

/** Lê a query string como objeto simples (a última ocorrência de cada chave vale). */
export function lerQuery(url: URL): Record<string, string> {
  return Object.fromEntries(url.searchParams.entries());
}
