import { z } from 'zod';
import { AJUDOU, INDICARIA, PERFIS } from '@/lib/avaliacoes';
import { banco, bloqueadoPorTentativas, erro, json, lerCorpo, preflight, registrarFalha } from '@/lib/contas';
import { primeiraMensagem } from '@/lib/validacao';

export const OPTIONS = preflight;

const valores = <T extends readonly { valor: string }[]>(lista: T) => lista.map((o) => o.valor) as [T[number]['valor'], ...T[number]['valor'][]];
const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use até ${max} caracteres.`)
    .optional()
    .transform((v) => v || null);

const esquemaAvaliacao = z.object({
  nota: z.number({ error: 'Escolha uma nota de 1 a 5.' }).int().min(1, 'Escolha uma nota de 1 a 5.').max(5, 'Escolha uma nota de 1 a 5.'),
  indicaria: z.enum(valores(INDICARIA)).nullable().optional(),
  ajudou: z.array(z.enum(valores(AJUDOU))).max(AJUDOU.length).default([]),
  melhorar: textoOpcional(2000),
  perfil: z.enum(valores(PERFIS)).nullable().optional(),
  cidade: textoOpcional(80),
  contato: textoOpcional(120),
  origem: textoOpcional(40),
  // Campo escondido: só robô preenche.
  site: z.string().optional(),
});

/** POST /api/avaliacao → guarda a opinião de quem testou o app (página /avaliar). */
export async function POST(request: Request) {
  const lido = await lerCorpo(request, 6_000);
  if ('falha' in lido) return lido.falha;
  const validacao = esquemaAvaliacao.safeParse(lido.corpo);
  if (!validacao.success) return erro(400, primeiraMensagem(validacao.error));
  const a = validacao.data;
  if (a.site) return json({ ok: true });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'sem-ip';
  const chave = `avaliacao:${ip}`;
  if (bloqueadoPorTentativas(chave)) return erro(429, 'Muitas avaliações seguidas. Espere alguns minutos.');
  registrarFalha(chave);

  try {
    await banco().query(
      `insert into app.avaliacao (nota, indicaria, ajudou, melhorar, perfil, cidade, contato, origem)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [a.nota, a.indicaria ?? null, [...new Set(a.ajudou)], a.melhorar, a.perfil ?? null, a.cidade, a.contato, a.origem],
    );
    return json({ ok: true });
  } catch (e) {
    console.error('[avaliacao] falha:', e instanceof Error ? e.message : e);
    return erro(503, 'Não deu para guardar agora. Tente de novo em instantes.');
  }
}
