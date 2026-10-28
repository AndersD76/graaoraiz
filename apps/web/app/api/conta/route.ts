import { banco, contaDaRequisicao, erro, json, preflight } from '@/lib/contas';

export const OPTIONS = preflight;

/** DELETE /api/conta → apaga a conta e os dados dela (exigência das lojas). */
export async function DELETE(request: Request) {
  try {
    const auth = await contaDaRequisicao(request);
    if ('falha' in auth) return auth.falha;
    if (auth.conta.demo) return erro(403, 'A conta de demonstração não pode ser excluída.');
    await banco().query('delete from app.conta where id = $1', [auth.conta.id]);
    return json({ ok: true });
  } catch (e) {
    console.error('[conta] falha ao excluir:', e instanceof Error ? e.message : e);
    return erro(503, 'Não foi possível excluir a conta agora. Tente de novo em instantes.');
  }
}
