-- Crescimento orgânico (SEO/GEO): dados operacionais que alimentam as páginas públicas e o painel /admin/seo.
-- Tudo aqui é recriável: rodar de novo não apaga nada (if not exists / on conflict nos scripts).

-- Municípios com dado agrícola real (IBGE, Produção Agrícola Municipal). Só os que passam do limiar
-- de área de grãos ganham página; o resto não entra (sem página rasa).
create table if not exists app.municipio_agro (
  codigo          text primary key,                 -- código IBGE, 7 dígitos
  nome            text not null,
  uf              text not null,
  slug            text not null,
  lat             double precision not null,        -- centro da malha municipal do IBGE
  lon             double precision not null,
  regiao_codigo   text,                             -- região geográfica imediata (IBGE)
  regiao_nome     text,
  culturas        jsonb not null default '{}',      -- { soja: { area_ha, producao_t }, ... }
  area_graos_ha   numeric not null default 0,
  ano_pam         integer not null,
  unique (uf, slug)
);
create index if not exists municipio_agro_regiao on app.municipio_agro (regiao_codigo);
create index if not exists municipio_agro_area on app.municipio_agro (area_graos_ha desc);

-- Registro de toda página de conteúdo: tipo, consulta-alvo, isca, onda de publicação e portão de qualidade.
-- Só página "publicada" responde e entra no sitemap; "fila" espera a onda; "reprovada" não sai.
create table if not exists app.seo_pagina (
  caminho         text primary key,
  tipo            text not null check (tipo in ('pilar','satelite','modelo','glossario','norma','comparativo','ferramenta','programatica','setor','hub','institucional')),
  cluster         text not null,
  consulta        text not null,
  isca            text,
  titulo          text not null,
  descricao       text not null,
  status          text not null default 'fila' check (status in ('fila','publicada','reprovada','revisao')),
  onda            integer,
  prioridade      numeric not null default 0,
  qualidade       jsonb not null default '{}',      -- resultado de cada regra do portão
  aprovada        boolean not null default false,
  publicada_em    timestamptz,
  indexnow_em     timestamptz,
  atualizada_em   timestamptz not null default now(),
  criada_em       timestamptz not null default now()
);
create index if not exists seo_pagina_status on app.seo_pagina (status, tipo);
create index if not exists seo_pagina_fila on app.seo_pagina (status, prioridade desc) where status = 'fila';

-- Mapa de buscas: consultas reais (autocomplete e, depois, Search Console) com cluster, intenção e página.
create table if not exists app.seo_consulta (
  id              bigserial primary key,
  consulta        text not null unique,
  cluster         text not null,
  intencao        text not null,
  tipo_pagina     text not null,
  isca            text,
  prioridade      smallint not null default 3,
  fonte           text not null,                    -- autocomplete | search_console | bing
  semente         text,
  volume_estimado integer,                          -- null: sem Keyword Planner (não inventamos volume)
  pagina          text,                             -- caminho que atende a consulta, quando houver
  criada_em       timestamptz not null default now()
);
create index if not exists seo_consulta_cluster on app.seo_consulta (cluster, prioridade);

-- Glossário: um termo por página, com fontes abertas e conferidas.
create table if not exists app.seo_glossario (
  slug            text primary key,
  termo           text not null,
  cluster         text not null,
  consulta        text not null,
  resposta_direta text not null,
  explicacao      text not null,
  exemplo         text not null,
  perguntas       jsonb not null default '[]',
  fontes          jsonb not null default '[]',
  relacionados    text[] not null default '{}',
  revisado_em     date not null default current_date
);

-- Iscas: quem pediu o boletim, a checklist etc. Opt-in de marketing separado e desmarcado; descadastro em 1 clique.
create table if not exists app.lead (
  id                uuid primary key default gen_random_uuid(),
  email             text not null,
  nome              text,
  isca              text not null,
  municipio_codigo  text,
  pagina            text,
  consulta          text,
  origem            jsonb not null default '{}',    -- primeiro e último toque (UTM, referrer, página de entrada)
  aceite_isca       boolean not null,               -- receber o que pediu (obrigatório para a isca)
  aceite_marketing  boolean not null default false, -- novidades do Grão Raiz (opcional, desmarcado)
  token             text not null unique,           -- descadastro em 1 clique
  descadastrado_em  timestamptz,
  criado_em         timestamptz not null default now(),
  unique (email, isca, municipio_codigo)
);
create index if not exists lead_criado on app.lead (criado_em desc);

-- Alvos de link (link building honesto) e textos prontos (artigos de convidado, diretórios, distribuição).
create table if not exists app.seo_alvo_link (
  id            bigserial primary key,
  nome          text not null,
  tipo          text not null,
  uf            text,
  url_site      text not null unique,
  pagina_alvo   text,
  contato       text,
  ativo         text not null,
  mensagem      text not null,
  prioridade    smallint not null default 2,
  status        text not null default 'a_contatar' check (status in ('a_contatar','contatado','respondeu','link_obtido','descartado')),
  atualizado_em timestamptz not null default now()
);

create table if not exists app.seo_texto (
  id         bigserial primary key,
  tipo       text not null check (tipo in ('artigo_convidado','diretorio','linkedin','video')),
  titulo     text not null,
  alvo       text,                                  -- veículo/diretório ou página de origem
  pagina     text,                                  -- página do site divulgada (com UTM no corpo)
  corpo      text not null,
  status     text not null default 'rascunho' check (status in ('rascunho','aprovado','publicado','descartado')),
  criado_em  timestamptz not null default now(),
  unique (tipo, titulo)
);

-- Métricas diárias (linha de base, Search Console, Bing, crawlers) e linha do tempo (deploys e ondas).
create table if not exists app.seo_metrica (
  dia     date not null,
  fonte   text not null,                            -- local | gsc | bing
  chave   text not null,                            -- ex.: paginas_publicadas, cliques, impressoes
  valor   numeric not null,
  detalhe jsonb not null default '{}',
  primary key (dia, fonte, chave)
);

create table if not exists app.seo_anotacao (
  id        bigserial primary key,
  tipo      text not null,                          -- deploy | onda | marco
  texto     text not null,
  criado_em timestamptz not null default now()
);
