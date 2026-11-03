-- Contas do app Grão Raiz (cadastro, login e dados na nuvem).
-- Ficam no esquema "app", separadas das tabelas do sistema antigo (legado/web-v0) no mesmo banco.
-- Rode uma vez no banco (psql, console da Neon ou `node db/aplicar.mjs`); pode rodar de novo sem estragar nada.

create schema if not exists app;

create table if not exists app.conta (
  id            uuid        primary key default gen_random_uuid(),
  email         text        not null check (char_length(email) between 3 and 120),
  nome          text        not null check (char_length(nome) between 1 and 80),
  senha_hash    text        not null,
  -- Conta de demonstração: qualquer um entra, ninguém altera nem apaga os dados dela.
  demo          boolean     not null default false,
  criado_em     timestamptz not null default now(),
  constraint conta_email_unico unique (email)
);

-- O estado do app (talhões, chuvas, caderno, preferências) como o celular guarda, em JSON.
create table if not exists app.dados_conta (
  conta_id      uuid        primary key references app.conta (id) on delete cascade,
  estado        jsonb       not null,
  atualizado_em timestamptz not null default now()
);

comment on table app.conta is 'Produtores com conta no app. Apagada (com os dados) quando a pessoa exclui a conta no app.';
comment on table app.dados_conta is 'Cópia na nuvem do estado do app de cada conta.';

-- Recuperação de senha: um código de 6 números por conta, enviado por e-mail, vale 15 minutos.
create table if not exists app.recuperacao_senha (
  conta_id      uuid        primary key references app.conta (id) on delete cascade,
  codigo_hash   text        not null,
  expira_em     timestamptz not null,
  tentativas    integer     not null default 0,
  criado_em     timestamptz not null default now()
);

comment on table app.recuperacao_senha is 'Código de recuperação de senha em andamento (só o hash; apagado ao usar).';

-- Avaliações da versão de teste (página /avaliar, sem login). Contato só se a pessoa quiser resposta.
create table if not exists app.avaliacao (
  id            uuid        primary key default gen_random_uuid(),
  nota          smallint    not null check (nota between 1 and 5),
  indicaria     text        check (indicaria in ('sim', 'talvez', 'nao')),
  ajudou        text[]      not null default '{}',
  melhorar      text        check (char_length(melhorar) <= 2000),
  perfil        text        check (perfil in ('produtor', 'tecnico', 'cooperativa', 'outro')),
  cidade        text        check (char_length(cidade) <= 80),
  contato       text        check (char_length(contato) <= 120),
  origem        text        check (char_length(origem) <= 40),
  criado_em     timestamptz not null default now()
);

comment on table app.avaliacao is 'Opiniões de quem testou o app. Lidas no painel /avaliacoes (com chave).';

-- Classificados de máquinas e implementos usados. Quem anuncia aceita a comissão sobre a venda.
create table if not exists app.anuncio (
  id                  uuid          primary key default gen_random_uuid(),
  conta_id            uuid          not null references app.conta (id) on delete cascade,
  categoria           text          not null check (categoria in ('trator', 'colheitadeira', 'plantadeira', 'pulverizador', 'implemento', 'caminhao', 'outro')),
  titulo              text          not null check (char_length(titulo) between 5 and 80),
  marca               text          check (char_length(marca) <= 40),
  modelo              text          check (char_length(modelo) <= 60),
  ano                 smallint      check (ano between 1950 and 2100),
  horas               integer       check (horas between 0 and 200000),
  preco               numeric(12,2) not null check (preco > 0),
  municipio           text          not null check (char_length(municipio) between 2 and 80),
  uf                  char(2)       not null,
  descricao           text          check (char_length(descricao) <= 3000),
  whatsapp            text          not null check (whatsapp ~ '^[0-9]{10,13}$'),
  fotos               uuid[]        not null default '{}',
  situacao            text          not null default 'ativo' check (situacao in ('ativo', 'pausado', 'vendido', 'removido')),
  comissao_percentual numeric(5,2)  not null,
  aceite_termos_em    timestamptz   not null,
  criado_em           timestamptz   not null default now(),
  atualizado_em       timestamptz   not null default now(),
  vendido_em          timestamptz,
  valor_venda         numeric(12,2),
  comissao_valor      numeric(12,2),
  comissao_paga_em    timestamptz
);

create index if not exists anuncio_situacao_criado on app.anuncio (situacao, criado_em desc);
create index if not exists anuncio_conta on app.anuncio (conta_id);

-- Fotos dos anúncios em JPEG já reduzido no celular (até ~700 KB cada).
create table if not exists app.foto_anuncio (
  id            uuid        primary key default gen_random_uuid(),
  conta_id      uuid        not null references app.conta (id) on delete cascade,
  dados         bytea       not null,
  criado_em     timestamptz not null default now()
);

-- Quem pediu o WhatsApp de cada anúncio: base para cobrar a comissão de vendas feitas pelo app.
create table if not exists app.contato_anuncio (
  anuncio_id    uuid        not null references app.anuncio (id) on delete cascade,
  conta_id      uuid        not null references app.conta (id) on delete cascade,
  criado_em     timestamptz not null default now(),
  primary key (anuncio_id, conta_id)
);

comment on table app.anuncio is 'Anúncios de máquinas e implementos usados. Comissão sobre a venda aceita ao anunciar.';
comment on table app.foto_anuncio is 'Fotos dos anúncios (JPEG), servidas por /api/anuncios/fotos/<id>.';
comment on table app.contato_anuncio is 'Pedidos de contato com o vendedor (quem viu o WhatsApp de qual anúncio).';

-- Registro de cada venda com comissão: cópia que fica mesmo se o vendedor excluir a conta (prazo legal).
create table if not exists app.venda (
  anuncio_id          uuid          primary key,
  conta_id            uuid,
  titulo              text          not null,
  categoria           text          not null,
  valor_venda         numeric(12,2) not null,
  comissao_percentual numeric(5,2)  not null,
  comissao_valor      numeric(12,2) not null,
  vendedor_nome       text          not null,
  vendedor_email      text          not null,
  whatsapp            text          not null,
  vendido_em          timestamptz   not null default now(),
  comissao_paga_em    timestamptz
);

comment on table app.venda is 'Vendas marcadas nos classificados e a comissão devida. Sem ligação com a conta: sobrevive à exclusão dela.';
