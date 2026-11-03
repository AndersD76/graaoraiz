import { banco, contaDaRequisicao, erro, json, lerCorpo, preflight } from '@/lib/contas';
import { idValido } from '@/lib/maquinas';

export const OPTIONS = preflight;

/** POST /api/anuncios/<id>/situacao { situacao: 'ativo' | 'pausado' } → pausa ou volta a mostrar o anúncio. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!idValido(id)) return erro(404, 'Anúncio não encontrado.');
  const lido = await lerCorpo(request, 200);
  if ('falha' in lido) return lido.falha;
  const situacao = (lido.corpo as { situacao?: unknown } | null)?.situacao;
  if (situacao !== 'ativo' && situacao !== 'pausado') return erro(400, 'Situação inválida.');
  try {
    const auth = await contaDaRequisicao(request);
    if ('falha' in auth) return auth.falha;
    const r = await banco().query(
      "update app.anuncio set situacao = $3, atualizado_em = now() where id = $1 and conta_id = $2 and situacao in ('ativo', 'pausado')",
      [id, auth.conta.id, situacao],
    );
    if (!r.rowCount) return erro(404, 'Anúncio não encontrado ou já vendido.');
    return json({ ok: true });
  } catch (e) {
    console.error('[anuncios] falha ao mudar situação:', e instanceof Error ? e.message : e);
    return erro(503, 'Não deu para salvar agora. Tente de novo.');
  }
}
