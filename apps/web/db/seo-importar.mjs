// Importa os dados de pesquisa de SEO para o banco (em lote, sem duplicar): mapa de buscas, glossário,
// alvos de link, textos prontos (diretórios, artigos de convidado) e registra as páginas fixas e a fila
// de distribuição (LinkedIn e roteiro de vídeo com UTM). Glossário entra na fila e passa pelo portão na onda.
// Uso (em apps/web): DATABASE_URL=... node db/seo-importar.mjs <pasta-com-os-json>
// Arquivos lidos, se existirem: consultas.json, glossario.json, alvos-link.json, artigos.json
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

const pasta = process.argv[2];
if (!process.env.DATABASE_URL || !pasta) {
  console.error('Uso: DATABASE_URL=... node db/seo-importar.mjs <pasta-com-os-json>');
  process.exit(1);
}
const ler = (n) => (existsSync(join(pasta, n)) ? JSON.parse(readFileSync(join(pasta, n), 'utf8')) : null);
const SITE = 'https://www.appgraoraiz.com.br';
const utm = (caminho, fonte, meio, campanha) => `${SITE}${caminho}?utm_source=${fonte}&utm_medium=${meio}&utm_campaign=${campanha}`;

const c = new pg.Client({ connectionString: process.env.DATABASE_URL.replace('sslmode=require', 'sslmode=verify-full') });
await c.connect();
await c.query(readFileSync(new URL('./seo.sql', import.meta.url), 'utf8'));
const relatorio = {};

// ---------- páginas fixas (escritas e revisadas à mão; publicadas direto) ----------
const FIXAS = [
  ['/hora-de-pulverizar', 'pilar', 'pulverizacao', 'hora de pulverizar', 'boletim-pulverizacao-municipio', 'Hora de pulverizar: como escolher e previsão por município', 'Melhor horário para pulverizar: delta T, vento, umidade e chuva explicados, com a previsão das janelas hora a hora para milhares de municípios.'],
  ['/ferramentas/delta-t', 'ferramenta', 'pulverizacao', 'calculadora de delta t', 'calculadora-delta-t', 'Calculadora de delta T para pulverização (grátis)', 'Calcule o delta T com a temperatura e a umidade do ar e veja se está na faixa boa para pulverizar. Tabela pronta de delta T e grátis, sem cadastro.'],
  ['/ferramentas', 'hub', 'pulverizacao', 'ferramentas para produtor rural', 'calculadora-delta-t', 'Ferramentas grátis para o produtor de grãos', 'Calculadora de delta T, previsão da hora de pulverizar por município e glossário agrícola com fontes. Tudo grátis e sem cadastro.'],
  ['/metodologia', 'institucional', 'pulverizacao', 'como calcular a hora de pulverizar', 'calculadora-delta-t', 'Metodologia: como o Grão Raiz calcula a hora de pulverizar', 'Os critérios, as fórmulas e as fontes por trás das janelas de pulverização, da previsão por município e dos dados de lavoura do Grão Raiz.'],
  ['/sobre', 'institucional', 'pulverizacao', 'grão raiz', 'app-talhao', 'Sobre o Grão Raiz e política editorial', 'Quem faz o Grão Raiz, de onde vêm os dados das páginas e como o conteúdo é escrito, revisado e corrigido.'],
];
for (const [caminho, tipo, cluster, consulta, isca, titulo, descricao] of FIXAS) {
  await c.query(
    `insert into app.seo_pagina (caminho, tipo, cluster, consulta, isca, titulo, descricao, status, aprovada, publicada_em, prioridade, qualidade)
     values ($1,$2,$3,$4,$5,$6,$7,'publicada',true,now(),1e9,'{"revisada":"à mão, com fontes; regras do portão conferidas"}')
     on conflict (caminho) do update set titulo = excluded.titulo, descricao = excluded.descricao, tipo = excluded.tipo`,
    [caminho, tipo, cluster, consulta, isca, titulo, descricao],
  );
}
relatorio.fixas = FIXAS.length;

// ---------- mapa de buscas ----------
const consultas = ler('consultas.json');
if (consultas) {
  const lote = consultas
    .filter((q) => q.consulta && q.consulta.length <= 200)
    .map((q) => ({ consulta: q.consulta.toLowerCase().trim(), cluster: q.cluster ?? 'outros', intencao: q.intencao ?? 'informacional', tipo_pagina: q.tipo_pagina ?? 'satelite', isca: q.isca ?? null, prioridade: Number(q.prioridade) || 3, fonte: q.fonte ?? 'autocomplete', semente: q.semente ?? null }));
  for (let i = 0; i < lote.length; i += 1000) {
    await c.query(
      `insert into app.seo_consulta (consulta, cluster, intencao, tipo_pagina, isca, prioridade, fonte, semente)
       select consulta, cluster, intencao, tipo_pagina, isca, prioridade, fonte, semente
         from jsonb_to_recordset($1::jsonb) as x(consulta text, cluster text, intencao text, tipo_pagina text, isca text, prioridade smallint, fonte text, semente text)
       on conflict (consulta) do update set cluster = excluded.cluster, intencao = excluded.intencao, tipo_pagina = excluded.tipo_pagina,
         isca = excluded.isca, prioridade = excluded.prioridade`,
      [JSON.stringify(lote.slice(i, i + 1000))],
    );
  }
  // Liga as consultas às páginas que já as atendem.
  await c.query(`update app.seo_consulta set pagina = '/ferramentas/delta-t' where pagina is null and consulta ~ '(calculadora|calcular|tabela).*delta|delta t.*(calculadora|tabela)'`);
  await c.query(`update app.seo_consulta set pagina = '/hora-de-pulverizar' where pagina is null and consulta ~ '(hora|horário|horario|momento).*(pulveriz|aplica)'`);
  await c.query(`update app.seo_consulta set pagina = '/maquinas-usadas' where pagina is null and cluster = 'maquinas-usadas' and intencao in ('transacional','comercial')`);
  await c.query(`update app.seo_consulta q set pagina = p.caminho from app.seo_pagina p
                  where q.pagina is null and p.tipo = 'programatica' and q.consulta like '%' || split_part(p.consulta, ' em ', 2) and length(split_part(p.consulta, ' em ', 2)) > 4
                    and q.cluster = 'pulverizacao'`);
  relatorio.consultas = lote.length;
}

// ---------- glossário (entra na fila; o portão decide na onda) ----------
const glossario = ler('glossario.json');
if (glossario) {
  const slugs = new Set(glossario.map((t) => t.slug));
  const lote = glossario.map((t) => ({
    slug: t.slug,
    termo: t.termo,
    cluster: t.cluster,
    consulta: t.consulta_principal,
    resposta_direta: t.resposta_direta,
    explicacao: t.explicacao,
    exemplo: t.exemplo_pratico,
    perguntas: t.perguntas ?? [],
    fontes: (t.fontes ?? []).filter((f) => /^https:\/\//.test(f.url)),
    relacionados: (t.relacionados ?? []).filter((s) => slugs.has(s) && s !== t.slug),
  }));
  await c.query(
    `insert into app.seo_glossario (slug, termo, cluster, consulta, resposta_direta, explicacao, exemplo, perguntas, fontes, relacionados)
     select slug, termo, cluster, consulta, resposta_direta, explicacao, exemplo, perguntas, fontes, array(select jsonb_array_elements_text(relacionados))
       from jsonb_to_recordset($1::jsonb) as x(slug text, termo text, cluster text, consulta text, resposta_direta text, explicacao text, exemplo text, perguntas jsonb, fontes jsonb, relacionados jsonb)
     on conflict (slug) do update set termo = excluded.termo, cluster = excluded.cluster, consulta = excluded.consulta, resposta_direta = excluded.resposta_direta,
       explicacao = excluded.explicacao, exemplo = excluded.exemplo, perguntas = excluded.perguntas, fontes = excluded.fontes,
       relacionados = excluded.relacionados, revisado_em = current_date`,
    [JSON.stringify(lote)],
  );
  await c.query(
    `insert into app.seo_pagina (caminho, tipo, cluster, consulta, isca, titulo, descricao, prioridade)
     select '/glossario/' || slug, 'glossario', cluster, consulta,
            case cluster when 'pulverizacao' then 'calculadora-delta-t' when 'maquinas-usadas' then 'anunciar-maquina' else 'app-talhao' end,
            left(termo || ': o que é e como usar na lavoura', 60), left(resposta_direta, 155), 5e8
       from app.seo_glossario
     on conflict (caminho) do nothing`,
  );
  await c.query(`update app.seo_consulta q set pagina = '/glossario/' || g.slug from app.seo_glossario g where q.pagina is null and q.consulta = g.consulta`);
  // Página do glossário (hub): existe quando há termos.
  await c.query(
    `insert into app.seo_pagina (caminho, tipo, cluster, consulta, isca, titulo, descricao, status, aprovada, publicada_em, prioridade, qualidade)
     values ('/glossario', 'hub', 'pulverizacao', 'glossário agrícola', 'app-talhao', 'Glossário agrícola: termos do produtor de grãos',
             'Delta T, deriva, geada, NDVI, CAR, EUDR, ZARC e outros termos da lavoura explicados com exemplo prático e fonte oficial. Grátis.',
             'publicada', true, now(), 1e9, '{"revisada":"hub gerado dos termos publicados"}')
     on conflict (caminho) do nothing`,
  );
  relatorio.glossario = lote.length;
}

// ---------- alvos de link e diretórios ----------
const alvos = ler('alvos-link.json');
if (alvos) {
  const lote = (alvos.alvos ?? []).map((a) => ({ nome: a.nome, tipo: a.tipo, uf: a.uf ?? null, url_site: a.url_site, pagina_alvo: a.pagina_alvo ?? null, contato: a.contato || null, ativo: a.ativo, mensagem: a.mensagem, prioridade: Number(a.prioridade) || 2 }));
  await c.query(
    `insert into app.seo_alvo_link (nome, tipo, uf, url_site, pagina_alvo, contato, ativo, mensagem, prioridade)
     select nome, tipo, uf, url_site, pagina_alvo, contato, ativo, mensagem, prioridade
       from jsonb_to_recordset($1::jsonb) as x(nome text, tipo text, uf text, url_site text, pagina_alvo text, contato text, ativo text, mensagem text, prioridade smallint)
     on conflict (url_site) do update set pagina_alvo = excluded.pagina_alvo, contato = excluded.contato, ativo = excluded.ativo, mensagem = excluded.mensagem`,
    [JSON.stringify(lote)],
  );
  for (const d of alvos.diretorios ?? []) {
    const corpo = [
      `Diretório: ${d.nome}${d.url_diretorio ? ` (${d.url_diretorio})` : ''}`,
      d.categoria ? `Categoria: ${d.categoria}` : '',
      `Descrição curta: ${d.descricao_curta ?? ''}`,
      '',
      `Descrição longa: ${d.descricao_longa ?? ''}`,
      d.descricao_curta_en ? `\nEnglish (short): ${d.descricao_curta_en}` : '',
      d.descricao_longa_en ? `English (long): ${d.descricao_longa_en}` : '',
      d.observacao ? `\nObservação: ${d.observacao}` : '',
      `\nLink para usar no cadastro: ${utm('/', 'diretorio', 'referral', 'cadastro-diretorio')}`,
    ].filter((l) => l !== '').join('\n');
    await c.query(
      `insert into app.seo_texto (tipo, titulo, alvo, pagina, corpo) values ('diretorio', $1, $2, '/', $3)
       on conflict (tipo, titulo) do update set corpo = excluded.corpo, alvo = excluded.alvo`,
      [`Cadastro: ${d.nome}`, d.url_diretorio ?? d.nome, corpo],
    );
  }
  relatorio.alvos = lote.length;
  relatorio.diretorios = (alvos.diretorios ?? []).length;
}

// ---------- artigos de convidado ----------
const artigos = ler('artigos.json');
if (artigos) {
  for (const a of artigos) {
    await c.query(
      `insert into app.seo_texto (tipo, titulo, alvo, pagina, corpo) values ('artigo_convidado', $1, $2, $3, $4)
       on conflict (tipo, titulo) do update set corpo = excluded.corpo, alvo = excluded.alvo, pagina = excluded.pagina`,
      [a.titulo, a.publico_alvo ?? null, a.caminho_cta ?? '/', a.corpo],
    );
  }
  relatorio.artigos = artigos.length;
}

// ---------- fila de distribuição: 1 post de LinkedIn e 1 roteiro de vídeo por página nova (com UTM) ----------
const paginasDivulgar = await c.query(
  `select p.caminho, p.tipo, p.titulo, p.consulta, g.termo, g.resposta_direta
     from app.seo_pagina p left join app.seo_glossario g on p.caminho = '/glossario/' || g.slug
    where p.tipo in ('pilar','ferramenta','glossario')
      and not exists (select 1 from app.seo_texto t where t.pagina = p.caminho and t.tipo = 'linkedin')`,
);
const ufs = await c.query(`select uf, count(*)::int as n, (array_agg(nome order by area_graos_ha desc))[1:5] as maiores from app.municipio_agro group by uf having count(*) >= 5 order by count(*) desc`);
const posts = [];
for (const p of paginasDivulgar.rows) {
  const campanha = p.caminho.replace(/^\//, '').replace(/\//g, '-');
  const assunto = p.termo ?? p.titulo;
  const gancho = p.resposta_direta ?? p.titulo;
  posts.push({
    tipo: 'linkedin',
    titulo: `LinkedIn: ${assunto}`.slice(0, 200),
    pagina: p.caminho,
    corpo: `${p.termo ? `${p.termo}: você sabe o que é e por que importa na lavoura?` : p.titulo}\n\n${gancho}\n\nExplicação completa, com exemplo prático e fontes: ${utm(p.caminho, 'linkedin', 'social', campanha)}\n\n#agro #soja #milho #pulverizacao #agricultura`,
  });
  posts.push({
    tipo: 'video',
    titulo: `Vídeo curto: ${assunto}`.slice(0, 200),
    pagina: p.caminho,
    corpo: `Roteiro (30–45 s, celular na vertical, na lavoura):\n1. Gancho (3 s): "${p.termo ? `Você sabe o que é ${p.termo.toLowerCase()}?` : p.titulo}"\n2. Resposta (15 s): ${gancho}\n3. Exemplo (10 s): mostre na prática, na máquina ou no talhão.\n4. Chamada (5 s): "O link com tudo explicado está na bio."\nLink da bio: ${utm(p.caminho, 'video', 'video', campanha)}`,
  });
}
for (const u of ufs.rows) {
  const caminho = `/hora-de-pulverizar/${u.uf.toLowerCase()}`;
  posts.push({
    tipo: 'linkedin',
    titulo: `LinkedIn: hora de pulverizar no ${u.uf}`,
    pagina: caminho,
    corpo: `Hora de pulverizar, município por município, no ${u.uf}: a janela de hoje e da semana, hora a hora, com delta T, vento na barra, umidade e chuva.\n\nJá tem ${u.maiores.join(', ')} e outros municípios produtores (com a área de grãos do IBGE). Grátis: ${utm(caminho, 'linkedin', 'social', `uf-${u.uf.toLowerCase()}`)}\n\n#agro #pulverizacao #${u.uf.toLowerCase()}`,
  });
}
for (const p of posts) {
  await c.query(`insert into app.seo_texto (tipo, titulo, pagina, corpo) values ($1, $2, $3, $4) on conflict (tipo, titulo) do nothing`, [p.tipo, p.titulo, p.pagina, p.corpo]);
}
relatorio.distribuicao = posts.length;

await c.query("insert into app.seo_anotacao (tipo, texto) values ('marco', $1)", [`Importação de SEO: ${JSON.stringify(relatorio)}`]);
console.log('Importado:', relatorio);
await c.end();
