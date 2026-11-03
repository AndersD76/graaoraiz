import { banco, erro } from '@/lib/contas';
import { idValido } from '@/lib/maquinas';
import { chavePainelConfere } from '@/lib/painel';

/** POST (formulário do painel) acao=comissao-paga|remover, id, chave → faz e volta para o painel. */
export async function POST(request: Request) {
  const dados = await request.formData();
  const chave = dados.get('chave');
  const id = String(dados.get('id') ?? '');
  const acao = dados.get('acao');
  if (!chavePainelConfere(chave)) return erro(403, 'Chave do painel inválida.');
  if (!idValido(id)) return erro(400, 'Anúncio inválido.');
  try {
    if (acao === 'comissao-paga') {
      await banco().query('update app.venda set comissao_paga_em = now() where anuncio_id = $1 and comissao_paga_em is null', [id]);
      await banco().query("update app.anuncio set comissao_paga_em = now() where id = $1 and situacao = 'vendido' and comissao_paga_em is null", [id]);
    } else if (acao === 'remover') {
      await banco().query("update app.anuncio set situacao = 'removido', atualizado_em = now() where id = $1 and situacao in ('ativo', 'pausado')", [id]);
    } else {
      return erro(400, 'Ação inválida.');
    }
  } catch (e) {
    console.error('[painel] falha:', e instanceof Error ? e.message : e);
    return erro(503, 'Não deu para salvar agora.');
  }
  // Endereço relativo: atrás do proxy do Railway o host interno do request não é o público.
  return new Response(null, { status: 303, headers: { Location: `/painel/maquinas?chave=${encodeURIComponent(String(chave))}` } });
}
