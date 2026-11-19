// Dados do Search Console e do Bing Webmaster para a tabela local (app.seo_metrica e app.seo_consulta).
// Só rodam com credencial: GSC_CLIENT_EMAIL + GSC_PRIVATE_KEY (conta de serviço com acesso à propriedade)
// e BING_WEBMASTER_API_KEY. Sem credencial, não fazem nada (e o painel mostra o que falta).
import { createSign } from 'node:crypto';
import { SITE_URL } from '@/lib/config';
import { banco } from '@/lib/contas';

export function gscConfigurado(): boolean {
  return Boolean(process.env.GSC_CLIENT_EMAIL && process.env.GSC_PRIVATE_KEY);
}

export function bingConfigurado(): boolean {
  return Boolean(process.env.BING_WEBMASTER_API_KEY);
}

/** Propriedade de domínio no Search Console ("sc-domain:appgraoraiz.com.br"), ou a de URL se definida. */
function propriedadeGsc(): string {
  return process.env.GSC_PROPRIEDADE || `sc-domain:${new URL(SITE_URL).hostname.replace(/^www\./, '')}`;
}

async function tokenGoogle(): Promise<string> {
  const agora = Math.floor(Date.now() / 1000);
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const corpo = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: process.env.GSC_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: agora,
    exp: agora + 3600,
  })}`;
  const assinatura = createSign('RSA-SHA256').update(corpo).sign((process.env.GSC_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'), 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${corpo}.${assinatura}` }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!r.ok) throw new Error(`token Google ${r.status}`);
  return ((await r.json()) as { access_token: string }).access_token;
}

interface LinhaGsc {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/** Puxa os últimos dias do Search Console (consulta × página) e grava métricas e consultas novas. */
export async function ingerirSearchConsole(dias = 3): Promise<{ linhas: number }> {
  if (!gscConfigurado()) return { linhas: 0 };
  const token = await tokenGoogle();
  const fim = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10); // o GSC fecha o dado com ~2 dias
  const inicio = new Date(Date.now() - (2 + dias) * 86_400_000).toISOString().slice(0, 10);
  const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propriedadeGsc())}/searchAnalytics/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate: inicio, endDate: fim, dimensions: ['date', 'query', 'page'], rowLimit: 25000, dataState: 'final' }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!r.ok) throw new Error(`Search Console ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const linhas = ((await r.json()) as { rows?: LinhaGsc[] }).rows ?? [];
  const porDia = new Map<string, { cliques: number; impressoes: number; posicaoPesada: number; paginas: Set<string> }>();
  for (const l of linhas) {
    const [dia, consulta, pagina] = l.keys;
    const d = porDia.get(dia) ?? { cliques: 0, impressoes: 0, posicaoPesada: 0, paginas: new Set<string>() };
    d.cliques += l.clicks;
    d.impressoes += l.impressions;
    d.posicaoPesada += l.position * l.impressions;
    d.paginas.add(pagina);
    porDia.set(dia, d);
    if (consulta && consulta.length <= 200) {
      const caminho = (() => {
        try {
          return new URL(pagina).pathname;
        } catch {
          return null;
        }
      })();
      await banco().query(
        `insert into app.seo_consulta (consulta, cluster, intencao, tipo_pagina, prioridade, fonte, pagina)
         values ($1, 'a-classificar', 'a-classificar', 'a-classificar', 2, 'search_console', $2)
         on conflict (consulta) do update set pagina = coalesce(app.seo_consulta.pagina, excluded.pagina)`,
        [consulta.toLowerCase(), caminho],
      );
    }
  }
  for (const [dia, d] of porDia) {
    const valores: [string, number][] = [
      ['cliques', d.cliques],
      ['impressoes', d.impressoes],
      ['ctr', d.impressoes ? d.cliques / d.impressoes : 0],
      ['posicao_media', d.impressoes ? d.posicaoPesada / d.impressoes : 0],
      ['paginas_com_impressao', d.paginas.size],
    ];
    for (const [chave, valor] of valores) {
      await banco().query(
        `insert into app.seo_metrica (dia, fonte, chave, valor) values ($1, 'gsc', $2, $3)
         on conflict (dia, fonte, chave) do update set valor = excluded.valor`,
        [dia, chave, valor],
      );
    }
  }
  return { linhas: linhas.length };
}

/** Estatísticas de consultas do Bing Webmaster (últimas semanas), gravadas por dia. */
export async function ingerirBing(): Promise<{ linhas: number }> {
  if (!bingConfigurado()) return { linhas: 0 };
  const url = `https://ssl.bing.com/webmaster/api.svc/json/GetQueryStats?apikey=${encodeURIComponent(process.env.BING_WEBMASTER_API_KEY ?? '')}&siteUrl=${encodeURIComponent(`${SITE_URL}/`)}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!r.ok) throw new Error(`Bing ${r.status}`);
  const linhas = ((await r.json()) as { d?: { Query: string; Clicks: number; Impressions: number; AvgImpressionPosition: number; Date: string }[] }).d ?? [];
  const porDia = new Map<string, { cliques: number; impressoes: number }>();
  for (const l of linhas) {
    const ms = Number(/\d+/.exec(l.Date)?.[0] ?? 0);
    const dia = new Date(ms).toISOString().slice(0, 10);
    const d = porDia.get(dia) ?? { cliques: 0, impressoes: 0 };
    d.cliques += l.Clicks;
    d.impressoes += l.Impressions;
    porDia.set(dia, d);
    if (l.Query && l.Query.length <= 200) {
      await banco().query(
        `insert into app.seo_consulta (consulta, cluster, intencao, tipo_pagina, prioridade, fonte)
         values ($1, 'a-classificar', 'a-classificar', 'a-classificar', 2, 'bing') on conflict (consulta) do nothing`,
        [l.Query.toLowerCase()],
      );
    }
  }
  for (const [dia, d] of porDia) {
    for (const [chave, valor] of [['cliques', d.cliques], ['impressoes', d.impressoes]] as const) {
      await banco().query(
        `insert into app.seo_metrica (dia, fonte, chave, valor) values ($1, 'bing', $2, $3)
         on conflict (dia, fonte, chave) do update set valor = excluded.valor`,
        [dia, chave, valor],
      );
    }
  }
  return { linhas: linhas.length };
}
