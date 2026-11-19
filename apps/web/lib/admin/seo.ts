// Consultas do painel /admin/seo: páginas, portão de qualidade, mapa de buscas, conversão, leads, links e textos.
import 'server-only';
import { banco } from '@/lib/contas';

export const ABAS_SEO = ['visao', 'paginas', 'buscas', 'leads', 'links', 'textos'] as const;
export type AbaSeo = (typeof ABAS_SEO)[number];

export function lerAba(v: unknown): AbaSeo {
  return typeof v === 'string' && (ABAS_SEO as readonly string[]).includes(v) ? (v as AbaSeo) : 'visao';
}

export async function resumoSeo() {
  const r = await banco().query<{
    publicadas: number;
    fila: number;
    reprovadas: number;
    consultas: number;
    leads: number;
    leads_7d: number;
    visitas_org_7d: number;
    visitas_ia_7d: number;
    crawlers_7d: number;
    iscas_7d: number;
  }>(
    `select (select count(*)::int from app.seo_pagina where status = 'publicada') as publicadas,
            (select count(*)::int from app.seo_pagina where status = 'fila') as fila,
            (select count(*)::int from app.seo_pagina where status = 'fila' and qualidade <> '{}' and not aprovada) as reprovadas,
            (select count(*)::int from app.seo_consulta) as consultas,
            (select count(*)::int from app.lead where descadastrado_em is null) as leads,
            (select count(*)::int from app.lead where criado_em > now() - interval '7 days') as leads_7d,
            (select count(*)::int from app.evento where nome = 'pagina_vista' and propriedades->>'canal' = 'organico' and criado_em > now() - interval '7 days') as visitas_org_7d,
            (select count(*)::int from app.evento where nome = 'pagina_vista' and propriedades->>'canal' = 'ia' and criado_em > now() - interval '7 days') as visitas_ia_7d,
            (select count(*)::int from app.evento where nome = 'crawler_ai_hit' and criado_em > now() - interval '7 days') as crawlers_7d,
            (select count(*)::int from app.evento where nome = 'isca_concluida' and criado_em > now() - interval '7 days') as iscas_7d`,
  );
  return r.rows[0];
}

export async function paginasPorTipo() {
  const r = await banco().query<{ tipo: string; publicadas: number; fila: number; reprovadas: number; indexnow: number }>(
    `select tipo, count(*) filter (where status = 'publicada')::int as publicadas, count(*) filter (where status = 'fila')::int as fila,
            count(*) filter (where status = 'fila' and qualidade <> '{}' and not aprovada)::int as reprovadas,
            count(*) filter (where indexnow_em is not null)::int as indexnow
       from app.seo_pagina group by tipo order by publicadas desc`,
  );
  return r.rows;
}

export async function reprovadasRecentes(limite = 30) {
  const r = await banco().query<{ caminho: string; tipo: string; qualidade: { regras?: Record<string, { ok: boolean; detalhe: string }> }; atualizada_em: Date }>(
    `select caminho, tipo, qualidade, atualizada_em from app.seo_pagina
      where not aprovada and qualidade <> '{}' order by atualizada_em desc limit $1`,
    [limite],
  );
  return r.rows.map((l) => ({
    ...l,
    motivos: Object.entries(l.qualidade.regras ?? {})
      .filter(([, v]) => !v.ok)
      .map(([k, v]) => `${k}: ${v.detalhe}`),
  }));
}

export async function ondas() {
  const r = await banco().query<{ onda: number; n: number; em: Date }>(
    'select onda, count(*)::int as n, min(publicada_em) as em from app.seo_pagina where onda is not null and status = \'publicada\' group by onda order by onda desc limit 20',
  );
  return r.rows;
}

/** Conversão do conteúdo nos últimos dias: visita → isca vista → iniciada → concluída/lead → clique no app. */
export async function conversaoPorTipo(dias = 30) {
  const r = await banco().query<{ tipo: string; visitas: number; isca_vista: number; isca_iniciada: number; isca_concluida: number; leads: number; cta: number }>(
    `select coalesce(propriedades->>'page_type', '(sem tipo)') as tipo,
            count(*) filter (where nome = 'pagina_vista')::int as visitas,
            count(*) filter (where nome = 'isca_vista')::int as isca_vista,
            count(*) filter (where nome = 'isca_iniciada')::int as isca_iniciada,
            count(*) filter (where nome = 'isca_concluida')::int as isca_concluida,
            0 as leads,
            count(*) filter (where nome = 'cta_produto_clicado')::int as cta
       from app.evento where origem = 'site' and criado_em > now() - make_interval(days => $1)
      group by 1 order by visitas desc`,
    [dias],
  );
  const leads = await banco().query<{ n: number }>("select count(*)::int as n from app.lead where criado_em > now() - make_interval(days => $1)", [dias]);
  return { linhas: r.rows, leads: leads.rows[0]?.n ?? 0 };
}

export async function topPaginas(dias = 30, limite = 20) {
  const r = await banco().query<{ pagina: string; visitas: number; organicas: number; ia: number; iscas: number }>(
    `select pagina, count(*) filter (where nome = 'pagina_vista')::int as visitas,
            count(*) filter (where nome = 'pagina_vista' and propriedades->>'canal' = 'organico')::int as organicas,
            count(*) filter (where nome = 'pagina_vista' and propriedades->>'canal' = 'ia')::int as ia,
            count(*) filter (where nome in ('isca_concluida', 'isca_iniciada'))::int as iscas
       from app.evento where origem = 'site' and pagina is not null and criado_em > now() - make_interval(days => $1)
      group by pagina order by visitas desc limit $2`,
    [dias, limite],
  );
  return r.rows;
}

export async function canais(dias = 30) {
  const r = await banco().query<{ canal: string; fonte: string; n: number }>(
    `select propriedades->>'canal' as canal, propriedades->>'fonte' as fonte, count(*)::int as n
       from app.evento where nome = 'pagina_vista' and criado_em > now() - make_interval(days => $1)
      group by 1, 2 order by n desc limit 20`,
    [dias],
  );
  return r.rows;
}

export async function mapaPorCluster() {
  const r = await banco().query<{ cluster: string; total: number; p1: number; com_pagina: number }>(
    `select cluster, count(*)::int as total, count(*) filter (where prioridade = 1)::int as p1, count(*) filter (where pagina is not null)::int as com_pagina
       from app.seo_consulta group by cluster order by total desc`,
  );
  return r.rows;
}

export async function consultas(cluster: string | null, busca: string, limite = 100) {
  const r = await banco().query<{ consulta: string; cluster: string; intencao: string; tipo_pagina: string; isca: string | null; prioridade: number; fonte: string; pagina: string | null }>(
    `select consulta, cluster, intencao, tipo_pagina, isca, prioridade, fonte, pagina from app.seo_consulta
      where ($1::text is null or cluster = $1) and ($2 = '' or consulta ilike '%' || $2 || '%')
      order by prioridade, consulta limit $3`,
    [cluster, busca, limite],
  );
  return r.rows;
}

export async function leads(limite = 100) {
  const r = await banco().query<{ id: string; email: string; isca: string; municipio: string | null; pagina: string | null; canal: string | null; fonte: string | null; aceite_marketing: boolean; descadastrado_em: Date | null; criado_em: Date }>(
    `select l.id, l.email, l.isca, m.nome || ' (' || m.uf || ')' as municipio, l.pagina, l.origem->>'canal' as canal, l.origem->>'fonte' as fonte,
            l.aceite_marketing, l.descadastrado_em, l.criado_em
       from app.lead l left join app.municipio_agro m on m.codigo = l.municipio_codigo
      order by l.criado_em desc limit $1`,
    [limite],
  );
  return r.rows;
}

export async function alvosLink(status: string | null) {
  const r = await banco().query<{ id: number; nome: string; tipo: string; uf: string | null; url_site: string; pagina_alvo: string | null; contato: string | null; ativo: string; mensagem: string; prioridade: number; status: string }>(
    `select id, nome, tipo, uf, url_site, pagina_alvo, contato, ativo, mensagem, prioridade, status from app.seo_alvo_link
      where ($1::text is null or status = $1) order by prioridade, nome`,
    [status],
  );
  const contagem = await banco().query<{ status: string; n: number }>('select status, count(*)::int as n from app.seo_alvo_link group by status');
  return { linhas: r.rows, contagem: Object.fromEntries(contagem.rows.map((c) => [c.status, c.n])) as Record<string, number> };
}

export async function textos(tipo: string | null) {
  const r = await banco().query<{ id: number; tipo: string; titulo: string; alvo: string | null; pagina: string | null; corpo: string; status: string }>(
    `select id, tipo, titulo, alvo, pagina, corpo, status from app.seo_texto where ($1::text is null or tipo = $1) order by status, tipo, id desc limit 300`,
    [tipo],
  );
  const contagem = await banco().query<{ tipo: string; n: number }>("select tipo, count(*)::int as n from app.seo_texto where status <> 'descartado' group by tipo");
  return { linhas: r.rows, contagem: Object.fromEntries(contagem.rows.map((c) => [c.tipo, c.n])) as Record<string, number> };
}

export async function linhaDoTempo(limite = 30) {
  const r = await banco().query<{ tipo: string; texto: string; criado_em: Date }>('select tipo, texto, criado_em from app.seo_anotacao order by criado_em desc limit $1', [limite]);
  return r.rows;
}

export async function metricasRecentes() {
  const r = await banco().query<{ dia: Date; fonte: string; chave: string; valor: string }>(
    "select dia, fonte, chave, valor from app.seo_metrica where fonte <> 'rotina' and dia > current_date - 30 order by dia desc, fonte, chave",
  );
  return r.rows;
}
