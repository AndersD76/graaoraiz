import { NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/config';
import { descadastrar } from '@/lib/seo/leads';

/**
 * POST /api/descadastrar?t=<token> → descadastro em 1 clique. É o endereço do cabeçalho List-Unsubscribe-Post
 * do e-mail (o cliente de e-mail chama direto) e do botão da página /descadastrar (com volta=1, que leva de volta
 * à página). GET só leva à página de confirmação: leitores automáticos de link não descadastram ninguém.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('t') ?? '';
  const ok = await descadastrar(token);
  if (url.searchParams.get('volta') === '1') {
    return NextResponse.redirect(new URL(`/descadastrar?t=${encodeURIComponent(token)}&feito=1`, SITE_URL), 303);
  }
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('t') ?? '';
  return NextResponse.redirect(new URL(`/descadastrar?t=${encodeURIComponent(token)}`, SITE_URL), 307);
}
