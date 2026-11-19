import { after } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { erro, json } from '@/lib/contas';
import { rodarRotina } from '@/lib/seo/rotina';

function autorizado(request: Request): boolean {
  const segredo = process.env.CRON_SECRET;
  const enviado = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!segredo || segredo.length < 24 || !enviado) return false;
  const a = Buffer.from(segredo);
  const b = Buffer.from(enviado);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * GET /api/cron/seo (Authorization: Bearer CRON_SECRET) → roda a rotina de SEO depois de responder.
 * ?forcar=onda,boletim,metricas,buscadores força as partes indicadas (ex.: publicar uma onda agora).
 */
export async function GET(request: Request) {
  if (!autorizado(request)) return erro(401, 'Não autorizado.');
  const forcar = Object.fromEntries((new URL(request.url).searchParams.get('forcar') ?? '').split(',').filter(Boolean).map((k) => [k, true]));
  after(async () => {
    try {
      const r = await rodarRotina(forcar);
      console.info('[seo] rotina:', JSON.stringify(r));
    } catch (e) {
      console.error('[seo] falha na rotina:', e instanceof Error ? e.message : e);
    }
  });
  return json({ ok: true, iniciada: true }, 202);
}
