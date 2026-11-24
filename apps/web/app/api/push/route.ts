import { z } from 'zod';

import { banco, contaDaRequisicao, erro, json, lerCorpo, preflight } from '@/lib/contas';
import { chavePublicaPush } from '@/lib/push';
import { primeiraMensagem } from '@/lib/validacao';

export const OPTIONS = preflight;

// O servidor faz POST no endereço da inscrição: só os serviços de push conhecidos (sem isso, alguém
// cadastraria um endereço interno e usaria o servidor para chamá-lo).
const SERVICOS_PUSH = ['fcm.googleapis.com', 'android.googleapis.com', 'push.services.mozilla.com', 'push.apple.com', 'notify.windows.com'];
function servicoConhecido(endereco: string): boolean {
  try {
    const u = new URL(endereco);
    return u.protocol === 'https:' && SERVICOS_PUSH.some((s) => u.hostname === s || u.hostname.endsWith(`.${s}`));
  } catch {
    return false;
  }
}

const esquemaInscricao = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal('web'),
    endpoint: z.string().max(1000).refine(servicoConhecido, 'Serviço de aviso não reconhecido.'),
    chaves: z.object({ p256dh: z.string().min(20).max(200), auth: z.string().min(8).max(100) }),
  }),
  z.object({
    tipo: z.literal('expo'),
    endpoint: z.string().max(200).regex(/^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$/, 'Token do aparelho inválido.'),
  }),
]);

/** GET /api/push → { chave }: chave pública para o navegador se inscrever (null sem configuração). */
export function GET() {
  return json({ chave: chavePublicaPush() });
}

/** POST /api/push { tipo, endpoint, chaves? }: avisos de mensagem nova neste navegador ou aparelho. */
export async function POST(request: Request) {
  const lido = await lerCorpo(request, 3_000);
  if ('falha' in lido) return lido.falha;
  const v = esquemaInscricao.safeParse(lido.corpo);
  if (!v.success) return erro(400, primeiraMensagem(v.error));
  try {
    const auth = await contaDaRequisicao(request);
    if ('falha' in auth) return auth.falha;
    if (auth.conta.demo) return erro(403, 'Crie sua conta grátis para receber os avisos.');
    const i = v.data;
    // O mesmo navegador numa conta nova passa para ela (quem entrou por último recebe os avisos).
    await banco().query(
      `insert into app.inscricao_push (endpoint, conta_id, tipo, chaves) values ($1, $2, $3, $4)
       on conflict (endpoint) do update set conta_id = excluded.conta_id, tipo = excluded.tipo, chaves = excluded.chaves, criado_em = now()`,
      [i.endpoint, auth.conta.id, i.tipo, i.tipo === 'web' ? JSON.stringify(i.chaves) : null],
    );
    // No máximo 10 aparelhos por conta: os mais antigos saem.
    await banco().query(
      `delete from app.inscricao_push where conta_id = $1 and endpoint not in
         (select endpoint from app.inscricao_push where conta_id = $1 order by criado_em desc limit 10)`,
      [auth.conta.id],
    );
    return json({ ok: true });
  } catch (e) {
    console.error('[push] falha ao inscrever:', e instanceof Error ? e.message : e);
    return erro(503, 'Não deu para ligar os avisos agora. Tente de novo.');
  }
}

/** DELETE /api/push { endpoint }: para de avisar neste navegador ou aparelho (ao sair da conta). */
export async function DELETE(request: Request) {
  const lido = await lerCorpo(request, 1_500);
  if ('falha' in lido) return lido.falha;
  const endpoint = (lido.corpo as { endpoint?: unknown })?.endpoint;
  if (typeof endpoint !== 'string' || endpoint.length > 1000) return erro(400, 'Informe o endereço do aviso.');
  try {
    const auth = await contaDaRequisicao(request);
    if ('falha' in auth) return auth.falha;
    await banco().query('delete from app.inscricao_push where endpoint = $1 and conta_id = $2', [endpoint, auth.conta.id]);
    return json({ ok: true });
  } catch (e) {
    console.error('[push] falha ao desinscrever:', e instanceof Error ? e.message : e);
    return erro(503, 'Não deu para desligar os avisos agora.');
  }
}
