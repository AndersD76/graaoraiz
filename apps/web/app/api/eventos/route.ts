import { z } from 'zod';
import { contaDaRequisicao, erro, json, lerCorpo, preflight } from '@/lib/contas';
import { criarLimite, ipDaRequisicao } from '@/lib/limite';
import { canalDaVisita } from '@/lib/seo/config';
import { EVENTOS_DO_APP, EVENTOS_DO_SITE, registrarEvento } from '@/lib/telemetria';

export const OPTIONS = preflight;

// Freio contra enxurrada de eventos: 120 por 10 minutos por IP.
const permitido = criarLimite({ max: 120, janelaMs: 10 * 60 * 1000 });

const esquema = z.object({
  nome: z.enum([...EVENTOS_DO_APP, ...EVENTOS_DO_SITE]),
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
  const doSite = (EVENTOS_DO_SITE as readonly string[]).includes(r.data.nome);
  let propriedades = r.data.propriedades;
  if (doSite && propriedades) {
    // Canal da visita (busca, IA, social...) calculado aqui; do referrer só fica o domínio.
    const { referrer, utm_source, utm_medium, ...resto } = propriedades;
    const ref = typeof referrer === 'string' ? referrer : null;
    const { canal, fonte } = canalDaVisita(ref, typeof utm_source === 'string' ? utm_source : null, typeof utm_medium === 'string' ? utm_medium : null);
    let host: string | null = null;
    try {
      host = ref ? new URL(ref).hostname : null;
    } catch {
      host = null;
    }
    propriedades = { ...resto, canal, fonte, referrer_host: host, utm_source: utm_source ?? null, utm_medium: utm_medium ?? null };
  }
  registrarEvento({ nome: r.data.nome, origem: doSite ? 'site' : 'app', contaId, sessao: r.data.sessao, pagina: r.data.pagina, propriedades });
  return json({ ok: true });
}
