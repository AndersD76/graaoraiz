import { banco, contaDaRequisicao, erro, json, lerCorpo, preflight } from '@/lib/contas';

export const OPTIONS = preflight;

/** Estado do app com fotos, caderno e anos de safra cabe com folga. */
const LIMITE = 2_000_000;

/** GET /api/conta/dados → { conta, estado, atualizadoEm } (estado null se a conta ainda não enviou nada). */
export async function GET(request: Request) {
  try {
    const auth = await contaDaRequisicao(request);
    if ('falha' in auth) return auth.falha;
    const r = await banco().query<{ estado: unknown; atualizado_em: Date }>(
      'select estado, atualizado_em from app.dados_conta where conta_id = $1',
      [auth.conta.id],
    );
    const linha = r.rows[0];
    return json({ conta: auth.conta, estado: linha?.estado ?? null, atualizadoEm: linha?.atualizado_em.toISOString() ?? null });
  } catch (e) {
    console.error('[conta] falha ao ler dados:', e instanceof Error ? e.message : e);
    return erro(503, 'Não foi possível buscar seus dados agora.');
  }
}

/** PUT /api/conta/dados { estado } → { atualizadoEm }. A conta de demonstração é só leitura. */
export async function PUT(request: Request) {
  try {
    const auth = await contaDaRequisicao(request);
    if ('falha' in auth) return auth.falha;
    if (auth.conta.demo) return erro(403, 'A conta de demonstração não guarda alterações.');
    const lido = await lerCorpo(request, LIMITE);
    if ('falha' in lido) return lido.falha;
    const estado = (lido.corpo as { estado?: unknown } | null)?.estado;
    if (typeof estado !== 'object' || estado === null || Array.isArray(estado)) return erro(400, 'Envie { estado }.');
    const r = await banco().query<{ atualizado_em: Date }>(
      `insert into app.dados_conta (conta_id, estado, atualizado_em) values ($1, $2, now())
       on conflict (conta_id) do update set estado = excluded.estado, atualizado_em = now()
       returning atualizado_em`,
      [auth.conta.id, JSON.stringify(estado)],
    );
    return json({ atualizadoEm: r.rows[0].atualizado_em.toISOString() });
  } catch (e) {
    console.error('[conta] falha ao guardar dados:', e instanceof Error ? e.message : e);
    return erro(503, 'Não foi possível guardar seus dados agora.');
  }
}
