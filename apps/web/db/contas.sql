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
