import { llmsIndice } from '@/lib/llms';
import { ufsPublicadas } from '@/lib/seo/municipios';
import { termosPublicados } from '@/lib/seo/paginas';
import { anunciosPublicos } from '@/lib/vitrine';

/** GET /llms.txt → índice em Markdown das páginas-chave, para buscadores de IA. */
export async function GET() {
  return new Response(llmsIndice(await anunciosPublicos(null), { ufs: await ufsPublicadas(), termos: await termosPublicados() }), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
