import { erro, json, lerCorpo } from '@/lib/contas';
import { criarLimite, ipDaRequisicao } from '@/lib/limite';
import { armadilhaPreenchida } from '@/lib/lista-espera';
import { esquemaLead, gravarLead } from '@/lib/seo/leads';
import { primeiraMensagem } from '@/lib/validacao';

// No máximo 10 inscrições por IP a cada hora.
const permitido = criarLimite({ max: 10, janelaMs: 60 * 60 * 1000 });

/** POST /api/iscas { email, isca, municipio?, aceiteIsca: true, aceiteMarketing?, primeiro?, ultimo? } → { ok }. */
export async function POST(request: Request) {
  if (!permitido(ipDaRequisicao(request))) return erro(429, 'Muitas inscrições seguidas. Tente mais tarde.');
  const lido = await lerCorpo(request, 4_000);
  if ('falha' in lido) return lido.falha;
  // Robô que preencheu o campo escondido: responde como sucesso e não grava nada.
  if (armadilhaPreenchida(lido.corpo)) return json({ ok: true });
  const r = esquemaLead.safeParse(lido.corpo);
  if (!r.success) return erro(400, primeiraMensagem(r.error));
  try {
    const { novo } = await gravarLead(r.data);
    return json({ ok: true, novo });
  } catch (e) {
    console.error('[iscas] falha ao gravar:', e instanceof Error ? e.message : e);
    return erro(503, 'Não deu para salvar agora. Tente de novo em instantes.');
  }
}
