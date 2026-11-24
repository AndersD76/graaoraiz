import { contaDaRequisicao, erro, json, preflight } from '@/lib/contas';
import { abrirConversa } from '@/lib/conversas';
import { criarLimite } from '@/lib/limite';
import { idValido } from '@/lib/maquinas';

// Freio contra quem tenta abrir conversa em todos os anúncios: 30 por hora por conta.
const permitido = criarLimite({ max: 30, janelaMs: 60 * 60 * 1000 });

export const OPTIONS = preflight;

/** POST /api/anuncios/<id>/conversa → { id }: abre (ou reabre) a conversa com o vendedor. Só com conta. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!idValido(id)) return erro(404, 'Anúncio não encontrado.');
  try {
    const auth = await contaDaRequisicao(request);
    if ('falha' in auth) return auth.falha;
    if (auth.conta.demo) return erro(403, 'Crie sua conta grátis para conversar com o vendedor.');
    if (!permitido(auth.conta.id)) return erro(429, 'Muitas conversas seguidas. Espere um pouco e tente de novo.');
    const r = await abrirConversa(id, auth.conta.id);
    if ('problema' in r) return r.problema === 'proprio' ? erro(400, 'Este anúncio é seu.') : erro(404, 'Este anúncio saiu do ar.');
    return json({ id: r.id });
  } catch (e) {
    console.error('[conversas] falha ao abrir:', e instanceof Error ? e.message : e);
    return erro(503, 'Não deu para abrir a conversa agora. Tente de novo.');
  }
}
