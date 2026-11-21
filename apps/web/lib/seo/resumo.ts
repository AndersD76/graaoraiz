// Resumo semanal do SEO por e-mail para os administradores, com os alertas da semana.
// Sai na segunda de manhã (rotina.ts). Sem a chave da Resend, não envia e o painel continua mostrando tudo.
import { SITE_URL } from '@/lib/config';
import { banco } from '@/lib/contas';
import { enviarEmail } from '@/lib/email';
import { gscConfigurado } from './buscadores';

const fmt = new Intl.NumberFormat('pt-BR');

export interface Alerta {
  nivel: 'atenção' | 'grave';
  texto: string;
}

/** Alertas da semana: queda de cliques por cluster (com Search Console), iscas sem conversão e páginas com problema. */
export async function alertasDaSemana(): Promise<Alerta[]> {
  const alertas: Alerta[] = [];
  const iscas = await banco().query<{ isca: string; vistas: number; concluidas: number }>(
    `select propriedades->>'isca_id' as isca,
            count(*) filter (where nome = 'isca_vista')::int as vistas,
            count(*) filter (where nome in ('isca_concluida', 'lead_capturado'))::int as concluidas
       from app.evento where origem in ('site', 'servidor') and criado_em > now() - interval '7 days' and propriedades ? 'isca_id'
      group by 1`,
  );
  for (const i of iscas.rows) {
    if (i.isca && i.vistas >= 20 && i.concluidas === 0) alertas.push({ nivel: 'atenção', texto: `Isca “${i.isca}” vista ${i.vistas} vezes e nenhuma conversão em 7 dias.` });
  }
  const reprovadas = await banco().query<{ n: number }>("select count(*)::int as n from app.seo_pagina where status = 'fila' and qualidade <> '{}' and not aprovada and tipo <> 'programatica'");
  if (reprovadas.rows[0]?.n) alertas.push({ nivel: 'atenção', texto: `${reprovadas.rows[0].n} página(s) de conteúdo reprovada(s) no portão esperando revisão.` });
  if (gscConfigurado()) {
    const queda = await banco().query<{ atual: number; antes: number }>(
      `select coalesce(sum(valor) filter (where dia > current_date - 9), 0)::float as atual,
              coalesce(sum(valor) filter (where dia <= current_date - 9 and dia > current_date - 16), 0)::float as antes
         from app.seo_metrica where fonte = 'gsc' and chave = 'cliques'`,
    );
    const q = queda.rows[0];
    if (q && q.antes >= 20 && q.atual < q.antes * 0.7) alertas.push({ nivel: 'grave', texto: `Cliques do Google caíram ${Math.round((1 - q.atual / q.antes) * 100)}% na semana (${fmt.format(q.atual)} contra ${fmt.format(q.antes)}).` });
  }
  return alertas;
}

export async function enviarResumoSemanal(): Promise<{ enviados: number }> {
  if (!process.env.RESEND_API_KEY) return { enviados: 0 };
  const admins = await banco().query<{ email: string }>('select email from app.conta where admin and not demo');
  if (!admins.rows.length) return { enviados: 0 };
  const d = (
    await banco().query<{ publicadas_semana: number; publicadas: number; fila: number; leads: number; organicas: number; ia: number; crawlers: number }>(
      `select (select count(*)::int from app.seo_pagina where publicada_em > now() - interval '7 days') as publicadas_semana,
              (select count(*)::int from app.seo_pagina where status = 'publicada') as publicadas,
              (select count(*)::int from app.seo_pagina where status = 'fila') as fila,
              (select count(*)::int from app.lead where criado_em > now() - interval '7 days') as leads,
              (select count(*)::int from app.evento where nome = 'pagina_vista' and propriedades->>'canal' = 'organico' and criado_em > now() - interval '7 days') as organicas,
              (select count(*)::int from app.evento where nome = 'pagina_vista' and propriedades->>'canal' = 'ia' and criado_em > now() - interval '7 days') as ia,
              (select count(*)::int from app.evento where nome = 'crawler_ai_hit' and criado_em > now() - interval '7 days') as crawlers`,
    )
  ).rows[0];
  const top = await banco().query<{ pagina: string; n: number }>(
    `select pagina, count(*)::int as n from app.evento where nome = 'pagina_vista' and criado_em > now() - interval '7 days' and pagina is not null
      group by 1 order by 2 desc limit 5`,
  );
  const alertas = await alertasDaSemana();
  const acoes = [
    alertas.length ? 'Resolver os alertas abaixo.' : null,
    d.leads ? null : 'Divulgar uma página de município no WhatsApp de produtores (fila de distribuição no painel).',
    'Contatar 5 alvos de link da aba "Alvos de link" do painel.',
    gscConfigurado() ? 'Olhar as páginas na posição 4–15 no Search Console.' : 'Conectar o Search Console (ver Integrações no painel).',
  ].filter(Boolean).slice(0, 5);
  const texto = [
    'Resumo semanal do SEO do Grão Raiz',
    '',
    `Publicadas na semana: ${fmt.format(d.publicadas_semana)} (total no ar: ${fmt.format(d.publicadas)}; na fila: ${fmt.format(d.fila)})`,
    `Visitas orgânicas: ${fmt.format(d.organicas)} · vindas de IAs: ${fmt.format(d.ia)} · robôs de IA: ${fmt.format(d.crawlers)}`,
    `Leads das iscas: ${fmt.format(d.leads)}`,
    '',
    'Páginas mais visitadas:',
    ...(top.rows.length ? top.rows.map((t) => `- ${t.pagina}: ${fmt.format(t.n)}`) : ['- ainda sem visitas registradas']),
    '',
    'Alertas:',
    ...(alertas.length ? alertas.map((a) => `- [${a.nivel}] ${a.texto}`) : ['- nenhum']),
    '',
    'Próximas ações:',
    ...acoes.map((a, i) => `${i + 1}. ${a}`),
    '',
    `Painel: ${SITE_URL}/admin/seo`,
  ].join('\n');
  let enviados = 0;
  for (const a of admins.rows) {
    await enviarEmail({ para: a.email, assunto: `Grão Raiz · SEO da semana: ${fmt.format(d.publicadas_semana)} publicadas, ${fmt.format(d.leads)} leads`, texto });
    enviados++;
  }
  return { enviados };
}
