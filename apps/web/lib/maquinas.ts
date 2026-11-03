// Classificados de máquinas e implementos usados: validação, leitura do banco e comissão.
import { type AnuncioResumo, CATEGORIAS_MAQUINA, MAX_FOTOS_ANUNCIO, type SituacaoAnuncio, UFS_BRASIL } from '@graoraiz/clima';
import { z } from 'zod';
import { banco } from '@/lib/contas';

/** Comissão sobre o valor da venda, em %. Vale para os anúncios criados a partir de agora. */
export function comissaoPercentual(): number {
  const n = Number(process.env.COMISSAO_PERCENTUAL);
  return Number.isFinite(n) && n > 0 && n < 50 ? n : 3;
}

const categorias = CATEGORIAS_MAQUINA.map((c) => c.valor) as [string, ...string[]];
const opcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use até ${max} caracteres.`)
    .optional()
    .nullable()
    .transform((v) => v || null);
const inteiroOpcional = (min: number, max: number, mensagem: string) =>
  z
    .number({ error: mensagem })
    .int(mensagem)
    .min(min, mensagem)
    .max(max, mensagem)
    .optional()
    .nullable()
    .transform((v) => v ?? null);

export const esquemaAnuncio = z.object({
  categoria: z.enum(categorias, { error: 'Escolha a categoria.' }),
  titulo: z.string().trim().min(5, 'Escreva um título com pelo menos 5 letras.').max(80, 'Título com até 80 caracteres.'),
  marca: opcional(40),
  modelo: opcional(60),
  ano: inteiroOpcional(1950, new Date().getFullYear() + 1, 'Ano inválido.'),
  horas: inteiroOpcional(0, 200000, 'Horas de uso inválidas.'),
  preco: z.number({ error: 'Informe o preço.' }).positive('Informe o preço.').max(50_000_000, 'Preço alto demais.'),
  municipio: z.string().trim().min(2, 'Informe a cidade.').max(80),
  uf: z.enum(UFS_BRASIL, { error: 'Escolha o estado (UF).' }),
  descricao: opcional(3000),
  whatsapp: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .pipe(z.string().regex(/^\d{10,13}$/, 'WhatsApp com DDD, ex.: (54) 99999-0000.')),
  fotos: z.array(z.uuid()).min(1, 'Coloque pelo menos uma foto.').max(MAX_FOTOS_ANUNCIO, `No máximo ${MAX_FOTOS_ANUNCIO} fotos.`),
});

export type DadosAnuncio = z.infer<typeof esquemaAnuncio>;

export interface LinhaAnuncio {
  id: string;
  conta_id: string;
  categoria: string;
  titulo: string;
  marca: string | null;
  modelo: string | null;
  ano: number | null;
  horas: number | null;
  preco: string;
  municipio: string;
  uf: string;
  descricao: string | null;
  whatsapp: string;
  fotos: string[];
  situacao: SituacaoAnuncio;
  comissao_percentual: string;
  criado_em: Date;
  valor_venda: string | null;
  comissao_valor: string | null;
  comissao_paga_em: Date | null;
}

export function resumo(l: LinhaAnuncio): AnuncioResumo {
  return {
    id: l.id,
    categoria: l.categoria as AnuncioResumo['categoria'],
    titulo: l.titulo,
    marca: l.marca,
    modelo: l.modelo,
    ano: l.ano,
    horas: l.horas,
    preco: Number(l.preco),
    municipio: l.municipio,
    uf: l.uf,
    foto: l.fotos[0] ?? null,
    criadoEm: l.criado_em.toISOString(),
  };
}

/** As fotos precisam ter sido enviadas pela mesma conta. */
export async function fotosDaConta(contaId: string, fotos: string[]): Promise<boolean> {
  const r = await banco().query('select 1 from app.foto_anuncio where conta_id = $1 and id = any($2::uuid[])', [contaId, fotos]);
  return r.rowCount === new Set(fotos).size;
}

/** Identificador válido de anúncio ou foto (evita erro do banco com texto qualquer). */
export function idValido(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
