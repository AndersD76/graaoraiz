import { z } from 'zod';
import { UFS } from './ufs';

/** Remove espaços; string vazia e null viram "não informado". */
function limpar(valor: unknown): unknown {
  if (valor === null) return undefined;
  if (typeof valor !== 'string') return valor;
  const t = valor.trim().replace(/\s+/g, ' ');
  return t === '' ? undefined : t;
}

function textoOpcional(max: number, campo: string) {
  return z.preprocess(
    limpar,
    z
      .string({ error: `${campo}: valor inválido.` })
      .max(max, `${campo}: use no máximo ${max} caracteres.`)
      .optional(),
  );
}

/**
 * Celular ou fixo brasileiro com DDD, aceitando +55, 0 de longa distância e pontuação comum.
 * Devolve no formato +55DDDNÚMERO ou null.
 */
export function normalizarTelefoneBR(valor: string): string | null {
  if (!/^[\d\s().+-]+$/.test(valor)) return null;
  let d = valor.replace(/\D/g, '');
  if (d.startsWith('0')) d = d.slice(1);
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
  if (!/^[1-9]{2}/.test(d)) return null;
  if (d.length === 11 && d[2] === '9') return `+55${d}`;
  if (d.length === 10 && /[2-5]/.test(d[2] ?? '')) return `+55${d}`;
  return null;
}

const MSG_CONTATO = 'Informe um celular com DDD, como (41) 99999-1234, ou um e-mail.';

const contato = z
  .string({ error: MSG_CONTATO })
  .trim()
  .min(1, MSG_CONTATO)
  .max(120, 'Contato: use no máximo 120 caracteres.')
  .transform((valor, ctx) => {
    if (valor.includes('@')) {
      const email = valor.toLowerCase();
      if (z.email().safeParse(email).success) return email;
      ctx.addIssue({ code: 'custom', message: 'E-mail inválido. Confira e tente de novo.' });
      return z.NEVER;
    }
    const telefone = normalizarTelefoneBR(valor);
    if (telefone) return telefone;
    ctx.addIssue({ code: 'custom', message: MSG_CONTATO });
    return z.NEVER;
  });

export const esquemaListaEspera = z.object({
  nome: textoOpcional(80, 'Nome'),
  contato,
  cidade: textoOpcional(80, 'Cidade'),
  uf: z.preprocess(
    (v) => {
      const t = limpar(v);
      return typeof t === 'string' ? t.toUpperCase() : t;
    },
    z.enum(UFS, { error: 'UF inválida.' }).optional(),
  ),
  cultura: textoOpcional(40, 'Cultura'),
  querTestar: z.boolean({ error: 'querTestar deve ser verdadeiro ou falso.' }).default(false),
});

export type EntradaListaEspera = z.infer<typeof esquemaListaEspera>;

/** Campo-armadilha: pessoas não o veem; robôs costumam preenchê-lo. */
export function armadilhaPreenchida(corpo: unknown): boolean {
  if (typeof corpo !== 'object' || corpo === null || !('site' in corpo)) return false;
  const site = (corpo as { site?: unknown }).site;
  if (site === undefined || site === null) return false;
  return typeof site !== 'string' || site.trim() !== '';
}

export type ResultadoGravacao = 'gravado' | 'duplicado' | 'falha';

/** Insere na tabela lista_espera via REST do Supabase (chave de serviço: só no servidor). */
export async function gravarNoSupabase(
  entrada: EntradaListaEspera,
  config: { url: string; chave: string },
): Promise<ResultadoGravacao> {
  const resposta = await fetch(`${config.url.replace(/\/+$/, '')}/rest/v1/lista_espera`, {
    method: 'POST',
    headers: {
      apikey: config.chave,
      Authorization: `Bearer ${config.chave}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      nome: entrada.nome ?? null,
      contato: entrada.contato,
      cidade: entrada.cidade ?? null,
      uf: entrada.uf ?? null,
      cultura: entrada.cultura ?? null,
      quer_testar: entrada.querTestar,
      origem: 'site',
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });

  if (resposta.ok) return 'gravado';
  // 409 = contato já cadastrado (restrição unique): para a pessoa, o resultado é o mesmo.
  if (resposta.status === 409) return 'duplicado';
  const detalhe = (await resposta.text().catch(() => '')).slice(0, 300);
  console.error('[lista-espera] Supabase respondeu', resposta.status, detalhe);
  return 'falha';
}
