import { chaveIndexNow } from '@/lib/indexnow';

/** GET /indexnow.txt → a chave do IndexNow (keyLocation), que prova que o site é nosso. */
export function GET() {
  const chave = chaveIndexNow();
  if (!chave) return new Response('IndexNow não configurado.', { status: 404 });
  return new Response(chave, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
