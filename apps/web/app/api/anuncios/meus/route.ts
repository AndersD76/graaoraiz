import type { MeuAnuncio } from '@graoraiz/clima';
import { banco, contaDaRequisicao, erro, json, preflight } from '@/lib/contas';
import { type LinhaAnuncio, resumo } from '@/lib/maquinas';

export const OPTIONS = preflight;

/** GET /api/anuncios/meus → anúncios da conta (menos os tirados do ar), com contatos recebidos e comissão. */
export async function GET(request: Request) {
  try {
    const auth = await contaDaRequisicao(request);
    if ('falha' in auth) return auth.falha;
    const r = await banco().query<LinhaAnuncio & { contatos: number }>(
      `select a.*, (select count(*)::int from app.contato_anuncio c where c.anuncio_id = a.id) as contatos
         from app.anuncio a where a.conta_id = $1 and a.situacao <> 'removido' order by a.criado_em desc`,
      [auth.conta.id],
    );
    const anuncios: MeuAnuncio[] = r.rows.map((l) => ({
      ...resumo(l),
      situacao: l.situacao,
      descricao: l.descricao,
      fotos: l.fotos,
      whatsapp: l.whatsapp,
      contatos: l.contatos,
      comissaoPercentual: Number(l.comissao_percentual),
      valorVenda: l.valor_venda === null ? null : Number(l.valor_venda),
      comissaoValor: l.comissao_valor === null ? null : Number(l.comissao_valor),
      comissaoPaga: l.comissao_paga_em !== null,
    }));
    return json({ anuncios });
  } catch (e) {
    console.error('[anuncios] falha ao listar os meus:', e instanceof Error ? e.message : e);
    return erro(503, 'Não deu para buscar seus anúncios agora.');
  }
}
