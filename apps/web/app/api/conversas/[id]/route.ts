import { after } from 'next/server';

import { contaDaRequisicao, erro, json, lerCorpo, preflight } from '@/lib/contas';
import { abrirMensagens, avisarMensagem, conversaIdValido, esquemaMensagem, gravarMensagem } from '@/lib/conversas';
import { criarLimite } from '@/lib/limite';
import { primeiraMensagem } from '@/lib/validacao';

// Freio contra spam: 20 mensagens por minuto e 300 por dia por conta.
const porMinuto = criarLimite({ max: 20, janelaMs: 60 * 1000 });
const porDia = criarLimite({ max: 300, janelaMs: 24 * 60 * 60 * 1000 });

export const OPTIONS = preflight;

type Contexto = { params: Promise<{ id: string }> };

/** GET /api/conversas/<id>?depois=<id da última mensagem> → conversa e mensagens (marca como lida). */
export async function GET(request: Request, { params }: Contexto) {
  const { id } = await params;
  if (!conversaIdValido(id)) return erro(404, 'Conversa não encontrada.');
  const bruto = new URL(request.url).searchParams.get('depois');
  const depois = bruto && /^\d{1,18}$/.test(bruto) ? Number(bruto) : null;
  try {
    const auth = await contaDaRequisicao(request);
    if ('falha' in auth) return auth.falha;
    const conversa = await abrirMensagens(id, auth.conta.id, depois);
    if (!conversa) return erro(404, 'Conversa não encontrada.');
    return json(conversa);
  } catch (e) {
    console.error('[conversas] falha ao abrir mensagens:', e instanceof Error ? e.message : e);
    return erro(503, 'Não deu para abrir a conversa agora.');
  }
}

/** POST /api/conversas/<id> { texto } → { mensagem }; a outra pessoa é avisada por push ou e-mail. */
export async function POST(request: Request, { params }: Contexto) {
  const { id } = await params;
  if (!conversaIdValido(id)) return erro(404, 'Conversa não encontrada.');
  const lido = await lerCorpo(request, 6_000);
  if ('falha' in lido) return lido.falha;
  const validacao = esquemaMensagem.safeParse(lido.corpo);
  if (!validacao.success) return erro(400, primeiraMensagem(validacao.error));
  try {
    const auth = await contaDaRequisicao(request);
    if ('falha' in auth) return auth.falha;
    if (auth.conta.demo) return erro(403, 'Crie sua conta grátis para conversar com o vendedor.');
    if (!porMinuto(auth.conta.id) || !porDia(auth.conta.id)) return erro(429, 'Muitas mensagens seguidas. Espere um pouco e tente de novo.');
    const r = await gravarMensagem(id, auth.conta.id, validacao.data.texto);
    if (r === null) return erro(404, 'Conversa não encontrada.');
    if (r === 'fora') return erro(410, 'Este anúncio saiu do ar: a conversa foi encerrada.');
    after(() => avisarMensagem(r.destino, validacao.data.texto));
    return json({ mensagem: r.mensagem });
  } catch (e) {
    console.error('[conversas] falha ao mandar mensagem:', e instanceof Error ? e.message : e);
    return erro(503, 'Não deu para mandar a mensagem agora. Tente de novo.');
  }
}
