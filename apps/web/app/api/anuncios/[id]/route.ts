import type { AnuncioDetalhe } from '@graoraiz/clima';
import { banco, contaDaRequisicao, erro, json, lerCorpo, preflight } from '@/lib/contas';
import { esquemaAnuncio, fotosDaConta, idValido, type LinhaAnuncio, resumo } from '@/lib/maquinas';
import { primeiraMensagem } from '@/lib/validacao';

export const OPTIONS = preflight;

type Contexto = { params: Promise<{ id: string }> };

/** Conta de quem pede, se mandou o token (para marcar "meu"); sem token, segue como visitante. */
async function quemVe(request: Request): Promise<string | null> {
  if (!request.headers.get('authorization')) return null;
  const auth = await contaDaRequisicao(request);
  return 'falha' in auth ? null : auth.conta.id;
}

/** GET /api/anuncios/<id> → anúncio com fotos e descrição (sem o WhatsApp). Aberto a todos. */
export async function GET(request: Request, { params }: Contexto) {
  const { id } = await params;
  if (!idValido(id)) return erro(404, 'Anúncio não encontrado.');
  try {
    const r = await banco().query<LinhaAnuncio & { vendedor: string }>(
      `select a.*, split_part(c.nome, ' ', 1) as vendedor from app.anuncio a join app.conta c on c.id = a.conta_id
        where a.id = $1 and a.situacao <> 'removido'`,
      [id],
    );
    const l = r.rows[0];
    const contaId = await quemVe(request);
    if (!l || (l.situacao === 'pausado' && l.conta_id !== contaId)) return erro(404, 'Anúncio não encontrado ou já saiu do ar.');
    const detalhe: AnuncioDetalhe = { ...resumo(l), descricao: l.descricao, fotos: l.fotos, situacao: l.situacao, vendedor: l.vendedor, meu: l.conta_id === contaId };
    return json(detalhe);
  } catch (e) {
    console.error('[anuncios] falha ao abrir:', e instanceof Error ? e.message : e);
    return erro(503, 'Não deu para abrir o anúncio agora.');
  }
}

/** PUT /api/anuncios/<id> { ...anúncio } → edita (só quem anunciou, enquanto não vendeu). */
export async function PUT(request: Request, { params }: Contexto) {
  const { id } = await params;
  if (!idValido(id)) return erro(404, 'Anúncio não encontrado.');
  const lido = await lerCorpo(request, 10_000);
  if ('falha' in lido) return lido.falha;
  const validacao = esquemaAnuncio.safeParse(lido.corpo);
  if (!validacao.success) return erro(400, primeiraMensagem(validacao.error));
  const a = validacao.data;
  try {
    const auth = await contaDaRequisicao(request);
    if ('falha' in auth) return auth.falha;
    if (!(await fotosDaConta(auth.conta.id, a.fotos))) return erro(400, 'Envie as fotos de novo.');
    const r = await banco().query(
      `update app.anuncio set categoria = $3, titulo = $4, marca = $5, modelo = $6, ano = $7, horas = $8, preco = $9,
              municipio = $10, uf = $11, descricao = $12, whatsapp = $13, fotos = $14, atualizado_em = now()
        where id = $1 and conta_id = $2 and situacao in ('ativo', 'pausado')`,
      [id, auth.conta.id, a.categoria, a.titulo, a.marca, a.modelo, a.ano, a.horas, a.preco, a.municipio, a.uf, a.descricao, a.whatsapp, a.fotos],
    );
    if (!r.rowCount) return erro(404, 'Anúncio não encontrado ou já vendido.');
    return json({ ok: true });
  } catch (e) {
    console.error('[anuncios] falha ao editar:', e instanceof Error ? e.message : e);
    return erro(503, 'Não deu para salvar agora. Tente de novo.');
  }
}

/** DELETE /api/anuncios/<id> → tira o anúncio do ar de vez (só quem anunciou). */
export async function DELETE(request: Request, { params }: Contexto) {
  const { id } = await params;
  if (!idValido(id)) return erro(404, 'Anúncio não encontrado.');
  try {
    const auth = await contaDaRequisicao(request);
    if ('falha' in auth) return auth.falha;
    const r = await banco().query(
      "update app.anuncio set situacao = 'removido', atualizado_em = now() where id = $1 and conta_id = $2 and situacao in ('ativo', 'pausado')",
      [id, auth.conta.id],
    );
    if (!r.rowCount) return erro(404, 'Anúncio não encontrado.');
    return json({ ok: true });
  } catch (e) {
    console.error('[anuncios] falha ao remover:', e instanceof Error ? e.message : e);
    return erro(503, 'Não deu para tirar o anúncio agora.');
  }
}
