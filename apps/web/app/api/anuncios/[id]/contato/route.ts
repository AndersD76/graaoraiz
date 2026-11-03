import { banco, contaDaRequisicao, erro, json, preflight } from '@/lib/contas';
import { idValido } from '@/lib/maquinas';

export const OPTIONS = preflight;

/**
 * POST /api/anuncios/<id>/contato → { whatsapp, vendedor }. Só com conta (não a de demonstração):
 * fica registrado quem pediu o contato, base para a comissão de vendas feitas pelo app.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!idValido(id)) return erro(404, 'Anúncio não encontrado.');
  try {
    const auth = await contaDaRequisicao(request);
    if ('falha' in auth) return auth.falha;
    if (auth.conta.demo) return erro(403, 'Crie sua conta para falar com o vendedor.');
    const r = await banco().query<{ whatsapp: string; conta_id: string; vendedor: string }>(
      `select a.whatsapp, a.conta_id, split_part(c.nome, ' ', 1) as vendedor from app.anuncio a join app.conta c on c.id = a.conta_id
        where a.id = $1 and a.situacao = 'ativo'`,
      [id],
    );
    const l = r.rows[0];
    if (!l) return erro(404, 'Este anúncio saiu do ar.');
    if (l.conta_id !== auth.conta.id) {
      await banco().query('insert into app.contato_anuncio (anuncio_id, conta_id) values ($1, $2) on conflict do nothing', [id, auth.conta.id]);
    }
    return json({ whatsapp: l.whatsapp, vendedor: l.vendedor });
  } catch (e) {
    console.error('[anuncios] falha ao pedir contato:', e instanceof Error ? e.message : e);
    return erro(503, 'Não deu para buscar o contato agora. Tente de novo.');
  }
}
