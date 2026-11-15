import { type NextRequest, NextResponse } from 'next/server';
import { COOKIE_ADMIN } from '@/lib/admin/sessao';
import { SITE_URL } from '@/lib/config';
import { criarLimite } from '@/lib/limite';
import { crawlerDeIa } from '@/lib/seo';
import { registrarEvento } from '@/lib/telemetria';

// Rotas públicas que chamam serviços de fora a cada pedido (INPE, CAR, IBGE, Open-Meteo): freio por IP.
const LIMITES: { prefixo: string; permitido: (chave: string) => boolean }[] = [
  { prefixo: '/api/conformidade', permitido: criarLimite({ max: 20, janelaMs: 60 * 60 * 1000 }) },
  { prefixo: '/api/municipio', permitido: criarLimite({ max: 120, janelaMs: 10 * 60 * 1000 }) },
  { prefixo: '/api/previsao', permitido: criarLimite({ max: 300, janelaMs: 10 * 60 * 1000 }) },
  { prefixo: '/api/historico', permitido: criarLimite({ max: 120, janelaMs: 10 * 60 * 1000 }) },
  { prefixo: '/api/diario', permitido: criarLimite({ max: 120, janelaMs: 10 * 60 * 1000 }) },
];

function origensExtras(): string[] {
  return (process.env.CORS_ORIGENS ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

/**
 * Navegador chamando a API de outro site: só passa a própria origem, a do site e as de CORS_ORIGENS
 * (em desenvolvimento, também localhost). O app nativo não manda Origin e passa direto.
 */
export function origemPermitida(origem: string, host: string | null, producao = process.env.NODE_ENV === 'production'): boolean {
  let url: URL;
  try {
    url = new URL(origem);
  } catch {
    return false;
  }
  if (host && url.host === host) return true;
  if (origem.replace(/\/+$/, '') === SITE_URL) return true;
  if (origensExtras().includes(url.origin)) return true;
  return !producao && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Monitor de crawlers de IA: quem leu qual página (app.evento, crawler_ai_hit).
  const bot = crawlerDeIa(request.headers.get('user-agent'));
  if (bot) registrarEvento({ nome: 'crawler_ai_hit', origem: 'servidor', pagina: pathname, propriedades: { bot } });

  // Painel sem cookie de sessão: vai direto para a entrada. A sessão em si é conferida em cada tela e ação.
  // Em produção usa o endereço público (atrás do proxy do Railway o host interno da requisição não é o público).
  if (pathname.startsWith('/admin') && pathname !== '/admin/entrar' && request.method === 'GET' && !request.cookies.has(COOKIE_ADMIN)) {
    const destino = new URL('/admin/entrar', SITE_URL.startsWith('https://') ? SITE_URL : request.url);
    const resposta = NextResponse.redirect(destino, 307);
    resposta.headers.set('Cache-Control', 'no-store');
    resposta.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return resposta;
  }

  if (pathname.startsWith('/api/')) {
    const origem = request.headers.get('origin');
    if (origem && !origemPermitida(origem, request.headers.get('host'))) {
      return NextResponse.json({ erro: 'Origem não permitida.' }, { status: 403 });
    }
    const limite = LIMITES.find((l) => pathname.startsWith(l.prefixo));
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'sem-ip';
    if (limite && !limite.permitido(ip)) {
      return NextResponse.json({ erro: 'Muitas consultas seguidas. Espere alguns minutos e tente de novo.' }, { status: 429 });
    }
  }
  return NextResponse.next();
}

export const config = {
  // Arquivos do app e do Next não passam pelo proxy.
  matcher: ['/((?!_next/|_expo/|assets/|favicon.ico|icon.svg).*)'],
};
