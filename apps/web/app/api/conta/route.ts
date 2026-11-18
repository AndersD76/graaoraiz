import { banco, contaDaRequisicao, erro, json, preflight } from '@/lib/contas';
import { vitrineMudou } from '@/lib/vitrine';

export const OPTIONS = preflight;

/** DELETE /api/conta → apaga a conta e os dados dela (exigência das lojas). */
export async function DELETE(request: Request) {
  try {
    const auth = await contaDaRequisicao(request);
    if ('falha' in auth) return auth.falha;
    if (auth.conta.demo) return erro(403, 'A conta de demonstração não pode ser excluída.');
    // Os anúncios saem junto (cascata); a vitrine pública precisa esquecer deles na hora.
    const anuncios = await banco().query<{ id: string; categoria: string }>(
      "select id, categoria from app.anuncio where conta_id = $1 and situacao <> 'removido'",
      [auth.conta.id],
    );
    // Vendas sem comissão não têm motivo legal para ficar: saem com a conta. As com comissão ficam pelo prazo legal.
    await banco().query('delete from app.venda where conta_id = $1 and comissao_valor = 0', [auth.conta.id]);
    await banco().query('delete from app.conta where id = $1', [auth.conta.id]);
    for (const a of anuncios.rows) vitrineMudou(a.id, a.categoria);
    return json({ ok: true });
  } catch (e) {
    console.error('[conta] falha ao excluir:', e instanceof Error ? e.message : e);
    return erro(503, 'Não foi possível excluir a conta agora. Tente de novo em instantes.');
  }
}
