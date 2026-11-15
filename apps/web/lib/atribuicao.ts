// De onde o visitante veio: primeiro toque (primeira visita) e último toque (visita do cadastro).
// Os dois vêm do navegador e são só dados de marketing; nada aqui decide acesso ou dinheiro.
import { z } from 'zod';

const toque = z
  .object({
    utm_source: z.string().max(100).optional(),
    utm_medium: z.string().max(100).optional(),
    utm_campaign: z.string().max(150).optional(),
    utm_content: z.string().max(150).optional(),
    utm_term: z.string().max(150).optional(),
    referrer: z.string().max(300).optional(),
    landing: z.string().max(300).optional(),
    em: z.string().max(40).optional(),
  })
  .strip();

const esquema = z.object({ primeiro: toque.nullable().optional(), ultimo: toque.nullable().optional() }).strip();

export type Atribuicao = z.infer<typeof esquema>;

/** Atribuição válida e limpa, ou null (dado ausente ou malformado nunca impede o cadastro). */
export function lerAtribuicao(valor: unknown): Atribuicao | null {
  const r = esquema.safeParse(valor);
  if (!r.success || (!r.data.primeiro && !r.data.ultimo)) return null;
  return r.data;
}
