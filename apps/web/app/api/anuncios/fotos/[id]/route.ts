import { banco, CORS, erro } from '@/lib/contas';
import { idValido } from '@/lib/maquinas';

/** GET /api/anuncios/fotos/<id> → a foto (a mesma para sempre: cache longo no navegador e na CDN). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!idValido(id)) return erro(404, 'Foto não encontrada.');
  try {
    const r = await banco().query<{ dados: Buffer }>('select dados from app.foto_anuncio where id = $1', [id]);
    const dados = r.rows[0]?.dados;
    if (!dados) return erro(404, 'Foto não encontrada.');
    const tipo = dados.subarray(0, 4).toString('latin1') === 'RIFF' ? 'image/webp' : 'image/jpeg';
    return new Response(new Uint8Array(dados), {
      headers: { 'Content-Type': tipo, 'Cache-Control': 'public, max-age=31536000, immutable', ...CORS },
    });
  } catch (e) {
    console.error('[anuncios] falha ao ler foto:', e instanceof Error ? e.message : e);
    return erro(503, 'Foto indisponível agora.');
  }
}
