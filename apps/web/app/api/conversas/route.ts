import { contaDaRequisicao, erro, json, preflight } from '@/lib/contas';
import { listarConversas } from '@/lib/conversas';

export const OPTIONS = preflight;

/** GET /api/conversas → { conversas, naoLidas }: as conversas dos classificados da conta. */
export async function GET(request: Request) {
  try {
    const auth = await contaDaRequisicao(request);
    if ('falha' in auth) return auth.falha;
    if (auth.conta.demo) return json({ conversas: [], naoLidas: 0 });
    return json(await listarConversas(auth.conta.id));
  } catch (e) {
    console.error('[conversas] falha ao listar:', e instanceof Error ? e.message : e);
    return erro(503, 'Não deu para buscar as conversas agora.');
  }
}
