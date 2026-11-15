import { type NextRequest, NextResponse } from 'next/server';
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
