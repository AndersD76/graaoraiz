import { banco, contaDaRequisicao, erro, json, lerCorpo, preflight } from '@/lib/contas';

export const OPTIONS = preflight;

// Freio contra abuso: até 60 fotos por hora por conta (por instância do servidor).
const envios = new Map<string, { n: number; desde: number }>();
const JANELA_MS = 60 * 60 * 1000;
const MAX_POR_JANELA = 60;

function podeEnviar(contaId: string): boolean {
  const agora = Date.now();
  const e = envios.get(contaId);
  if (!e || agora - e.desde > JANELA_MS) {
    envios.set(contaId, { n: 1, desde: agora });
    return true;
  }
  e.n += 1;
  return e.n <= MAX_POR_JANELA;
}

/** A foto chega reduzida pelo app (lado maior ~1600 px, JPEG): 900 KB já é folga. */
const MAX_BYTES = 900_000;

/** POST /api/anuncios/fotos { base64 } → { id }. JPEG ou WebP, só com conta (não a de demonstração). */
export async function POST(request: Request) {
  const lido = await lerCorpo(request, Math.ceil((MAX_BYTES * 4) / 3) + 200);
  if ('falha' in lido) return lido.falha;
  const base64 = (lido.corpo as { base64?: unknown } | null)?.base64;
  if (typeof base64 !== 'string') return erro(400, 'Foto inválida.');
  const dados = Buffer.from(base64.replace(/^data:[^,]+,/, ''), 'base64');
  const jpeg = dados[0] === 0xff && dados[1] === 0xd8 && dados[2] === 0xff;
  const webp = dados.subarray(0, 4).toString('latin1') === 'RIFF' && dados.subarray(8, 12).toString('latin1') === 'WEBP';
  if (!jpeg && !webp) return erro(400, 'Envie a foto em JPEG.');
  if (dados.length > MAX_BYTES) return erro(413, 'Foto grande demais.');
  try {
    const auth = await contaDaRequisicao(request);
    if ('falha' in auth) return auth.falha;
    if (auth.conta.demo) return erro(403, 'A conta de demonstração não anuncia. Crie sua conta para anunciar.');
    if (!podeEnviar(auth.conta.id)) return erro(429, 'Muitas fotos seguidas. Espere alguns minutos.');
    const r = await banco().query<{ id: string }>('insert into app.foto_anuncio (conta_id, dados) values ($1, $2) returning id', [auth.conta.id, dados]);
    return json({ id: r.rows[0].id }, 201);
  } catch (e) {
    console.error('[anuncios] falha ao guardar foto:', e instanceof Error ? e.message : e);
    return erro(503, 'Não deu para enviar a foto agora. Tente de novo.');
  }
}
