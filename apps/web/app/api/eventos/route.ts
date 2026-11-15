import { z } from 'zod';
import { contaDaRequisicao, erro, json, lerCorpo, preflight } from '@/lib/contas';
import { criarLimite, ipDaRequisicao } from '@/lib/limite';
import { EVENTOS_DO_APP, registrarEvento } from '@/lib/telemetria';

export const OPTIONS = preflight;

// Freio contra enxurrada de eventos: 120 por 10 minutos por IP.
const permitido = criarLimite({ max: 120, janelaMs: 10 * 60 * 1000 });

const esquema = z.object({
  nome: z.enum(EVENTOS_DO_APP),
  sessao: z.string().max(64).optional(),
  pagina: z.string().max(300).optional(),
  propriedades: z.record(z.string().max(40), z.union([z.string().max(200), z.number(), z.boolean(), z.null()])).optional(),
});

/** POST /api/eventos { nome, sessao?, pagina?, propriedades? } → 204. Só os eventos do funil que o app pode mandar. */
export async function POST(request: Request) {
  if (!permitido(ipDaRequisicao(request))) return erro(429, 'Eventos demais.');
  const lido = await lerCorpo(request, 4_000);
  if ('falha' in lido) return lido.falha;
  const r = esquema.safeParse(lido.corpo);
  if (!r.success) return erro(400, 'Evento inválido.');
  // Com sessão, o evento fica ligado à conta; sem ela, só à sessão anônima do navegador.
  let contaId: string | null = null;
  if (request.headers.get('authorization')) {
    const auth = await contaDaRequisicao(request);
    if (!('falha' in auth)) contaId = auth.conta.id;
  }
  registrarEvento({ nome: r.data.nome, origem: 'app', contaId, sessao: r.data.sessao, pagina: r.data.pagina, propriedades: r.data.propriedades });
  return json({ ok: true });
}
