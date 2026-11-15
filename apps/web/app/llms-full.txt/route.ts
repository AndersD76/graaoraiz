import { llmsCompleto } from '@/lib/llms';
import { anunciosPublicos } from '@/lib/vitrine';

/** GET /llms-full.txt → descrição completa do app e lista de máquinas, em Markdown limpo. */
export async function GET() {
  return new Response(llmsCompleto(await anunciosPublicos(null)), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
