// Rotina de produção contínua do SEO: roda de hora em hora (instrumentation.ts chama /api/cron/seo).
// Cada parte decide se é a hora dela, então rodar de novo não duplica nada.
import { banco } from '@/lib/contas';
import { SITE_URL } from '@/lib/config';
import { avisarIndexNow, chaveIndexNow } from '@/lib/indexnow';
import { bingConfigurado, gscConfigurado, ingerirBing, ingerirSearchConsole } from './buscadores';
import { enviarBoletins } from './leads';
import { gravarMetricasDoDia, publicarOnda } from './paginas';

/** Páginas por onda semanal (o pedido é 300–500; começamos no meio). */
export const TAMANHO_ONDA = 400;
const LOCK = 731_904; // pg_advisory_lock: uma rotina por vez

function horaBrasilia(): number {
  return Number(new Intl.DateTimeFormat('pt-BR', { hour: 'numeric', hourCycle: 'h23', timeZone: 'America/Sao_Paulo' }).format(new Date()));
}

async function feitoHoje(chave: string): Promise<boolean> {
  const r = await banco().query("select 1 from app.seo_metrica where dia = current_date and fonte = 'rotina' and chave = $1", [chave]);
  return (r.rowCount ?? 0) > 0;
}

async function marcarFeito(chave: string, detalhe: unknown): Promise<void> {
  await banco().query(
    `insert into app.seo_metrica (dia, fonte, chave, valor, detalhe) values (current_date, 'rotina', $1, 1, $2)
     on conflict (dia, fonte, chave) do update set detalhe = excluded.detalhe`,
    [chave, JSON.stringify(detalhe ?? {})],
  );
}

/**
 * Se a onda tiver mais de 21 dias e menos da metade das páginas com impressão no Search Console, o tipo pausa
 * (sem Search Console conectado não há como medir, e as ondas seguem no ritmo semanal).
 */
async function ondasPausadas(): Promise<boolean> {
  if (!gscConfigurado()) return false;
  const r = await banco().query<{ onda: number; total: number; com_impressao: number }>(
    `select p.onda, count(*)::int as total,
            count(*) filter (where exists (select 1 from app.seo_consulta c where c.pagina = p.caminho and c.fonte = 'search_console'))::int as com_impressao
       from app.seo_pagina p
      where p.status = 'publicada' and p.tipo = 'programatica' and p.publicada_em < now() - interval '21 days'
      group by p.onda order by p.onda desc limit 1`,
  );
  const ultima = r.rows[0];
  return Boolean(ultima && ultima.total > 0 && ultima.com_impressao / ultima.total < 0.5);
}

export async function rodarRotina(forcar: Partial<Record<'onda' | 'glossario' | 'boletim' | 'metricas' | 'buscadores', boolean>> = {}): Promise<Record<string, unknown>> {
  const resultado: Record<string, unknown> = {};
  const c = await banco().connect();
  try {
    const travou = (await c.query<{ ok: boolean }>('select pg_try_advisory_lock($1) as ok', [LOCK])).rows[0]?.ok;
    if (!travou) return { motivo: 'outra rotina em andamento' };
    try {
      const hora = horaBrasilia();

      if (forcar.metricas || !(await feitoHoje('metricas'))) {
        await gravarMetricasDoDia();
        await marcarFeito('metricas', {});
        resultado.metricas = 'gravadas';
      }

      if ((forcar.buscadores || (hora >= 7 && !(await feitoHoje('buscadores')))) && (gscConfigurado() || bingConfigurado())) {
        const gsc = await ingerirSearchConsole().catch((e: unknown) => ({ erro: e instanceof Error ? e.message : 'falha' }));
        const bing = await ingerirBing().catch((e: unknown) => ({ erro: e instanceof Error ? e.message : 'falha' }));
        await marcarFeito('buscadores', { gsc, bing });
        resultado.buscadores = { gsc, bing };
      }

      if (forcar.boletim || (hora >= 5 && hora <= 9 && !(await feitoHoje('boletim')))) {
        const b = await enviarBoletins();
        if (b.enviados || b.falhas || forcar.boletim) await marcarFeito('boletim', b);
        resultado.boletim = b;
      }

      // Glossário: termos novos na fila são publicados (pelo portão) assim que entram, sem esperar a onda dos municípios.
      if (forcar.glossario || (await banco().query("select 1 from app.seo_pagina where status = 'fila' and tipo = 'glossario' and qualidade = '{}' limit 1")).rowCount) {
        const g = await publicarOnda(500, 'glossario');
        resultado.glossario = { publicadas: g.publicadas.length, reprovadas: g.reprovadas.length };
      }

      const ultimaOnda = await banco().query<{ dias: number | null }>(
        "select extract(day from now() - max(publicada_em))::int as dias from app.seo_pagina where tipo = 'programatica' and status = 'publicada'",
      );
      const diasDesde = ultimaOnda.rows[0]?.dias;
      if (forcar.onda || (hora >= 6 && hora <= 20 && (diasDesde === null || diasDesde === undefined || diasDesde >= 7))) {
        if (!forcar.onda && (await ondasPausadas())) {
          resultado.onda = 'pausada: última onda abaixo de 50% com impressão em 21 dias';
        } else {
          const o = await publicarOnda(TAMANHO_ONDA, 'programatica');
          resultado.onda = { onda: o.onda, avaliadas: o.avaliadas, publicadas: o.publicadas.length, reprovadas: o.reprovadas.length };
        }
      }

      // Publicadas que ainda não foram avisadas ao IndexNow (ex.: onda publicada fora do servidor de produção).
      const pendentes = await banco().query<{ caminho: string }>("select caminho from app.seo_pagina where status = 'publicada' and indexnow_em is null limit 5000");
      if (pendentes.rows.length && chaveIndexNow() && SITE_URL.startsWith('https://')) {
        avisarIndexNow(pendentes.rows.map((l) => l.caminho));
        await banco().query('update app.seo_pagina set indexnow_em = now() where caminho = any($1)', [pendentes.rows.map((l) => l.caminho)]);
        resultado.indexnow = pendentes.rows.length;
      }
    } finally {
      await c.query('select pg_advisory_unlock($1)', [LOCK]);
    }
  } finally {
    c.release();
  }
  return resultado;
}
