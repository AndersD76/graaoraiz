import { banco, contaDaRequisicao, erro, json, preflight } from '@/lib/contas';
import { criarLimite } from '@/lib/limite';
import { idValido } from '@/lib/maquinas';
import { registrarEvento } from '@/lib/telemetria';

// Freio contra quem tenta colher os WhatsApps de todos os anúncios: 30 contatos por hora por conta.
const permitido = criarLimite({ max: 30, janelaMs: 60 * 60 * 1000 });

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
    if (!permitido(auth.conta.id)) return erro(429, 'Muitos contatos seguidos. Espere um pouco e tente de novo.');
    const r = await banco().query<{ whatsapp: string | null; conta_id: string; vendedor: string }>(
      `select a.whatsapp, a.conta_id, split_part(c.nome, ' ', 1) as vendedor from app.anuncio a join app.conta c on c.id = a.conta_id
        where a.id = $1 and a.situacao = 'ativo'`,
      [id],
    );
    const l = r.rows[0];
    if (!l) return erro(404, 'Este anúncio saiu do ar.');
    // Desde 24/11/2026 a conversa é pelo app: anúncio sem WhatsApp manda o app antigo se atualizar.
    if (!l.whatsapp) return erro(410, 'Agora a conversa com o vendedor é pelo app. Atualize a página ou o app.');
    if (l.conta_id !== auth.conta.id) {
      await banco().query('insert into app.contato_anuncio (anuncio_id, conta_id) values ($1, $2) on conflict do nothing', [id, auth.conta.id]);
      registrarEvento({ nome: 'seller_contacted', origem: 'servidor', contaId: auth.conta.id, propriedades: { anuncio: id } });
    }
    return json({ whatsapp: l.whatsapp, vendedor: l.vendedor });
  } catch (e) {
    console.error('[anuncios] falha ao pedir contato:', e instanceof Error ? e.message : e);
    return erro(503, 'Não deu para buscar o contato agora. Tente de novo.');
  }
}
