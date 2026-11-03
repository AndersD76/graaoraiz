import { banco, contaDaRequisicao, erro, json, lerCorpo, preflight } from '@/lib/contas';
import { idValido } from '@/lib/maquinas';

export const OPTIONS = preflight;

/**
 * POST /api/anuncios/<id>/vendido { valor } → marca como vendido e registra a comissão devida
 * (o percentual aceito ao anunciar, sobre o valor da venda). Resposta: { comissaoPercentual, comissaoValor }.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!idValido(id)) return erro(404, 'Anúncio não encontrado.');
  const lido = await lerCorpo(request, 200);
  if ('falha' in lido) return lido.falha;
  const valor = (lido.corpo as { valor?: unknown } | null)?.valor;
  if (typeof valor !== 'number' || !(valor > 0) || valor > 50_000_000) return erro(400, 'Informe o valor da venda.');
  try {
    const auth = await contaDaRequisicao(request);
    if ('falha' in auth) return auth.falha;
    // Marca o anúncio e guarda a cópia da venda (app.venda), que fica mesmo se a conta for excluída.
    const r = await banco().query<{ comissao_percentual: string; comissao_valor: string }>(
      `with a as (
         update app.anuncio
            set situacao = 'vendido', vendido_em = now(), atualizado_em = now(), valor_venda = $3,
                comissao_valor = round($3 * comissao_percentual / 100, 2)
          where id = $1 and conta_id = $2 and situacao in ('ativo', 'pausado')
          returning id, conta_id, titulo, categoria, valor_venda, comissao_percentual, comissao_valor, whatsapp, vendido_em
       )
       insert into app.venda (anuncio_id, conta_id, titulo, categoria, valor_venda, comissao_percentual, comissao_valor, vendedor_nome, vendedor_email, whatsapp, vendido_em)
       select a.id, a.conta_id, a.titulo, a.categoria, a.valor_venda, a.comissao_percentual, a.comissao_valor, c.nome, c.email, a.whatsapp, a.vendido_em
         from a join app.conta c on c.id = a.conta_id
       returning comissao_percentual, comissao_valor`,
      [id, auth.conta.id, Math.round(valor * 100) / 100],
    );
    const l = r.rows[0];
    if (!l) return erro(404, 'Anúncio não encontrado ou já vendido.');
    return json({ comissaoPercentual: Number(l.comissao_percentual), comissaoValor: Number(l.comissao_valor) });
  } catch (e) {
    console.error('[anuncios] falha ao marcar vendido:', e instanceof Error ? e.message : e);
    return erro(503, 'Não deu para salvar agora. Tente de novo.');
  }
}
