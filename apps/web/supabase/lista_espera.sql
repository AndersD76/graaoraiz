-- Lista de espera do site do Grão Raiz.
-- Rode no SQL Editor do Supabase (ou via migração). A API do site grava com a chave
-- service_role, que ignora o RLS; nenhuma política pública é criada, então a chave
-- anon/pública não consegue ler nem escrever nesta tabela.

create extension if not exists pgcrypto; -- gen_random_uuid() (já vem ativo no Supabase)

create table if not exists public.lista_espera (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  nome        text        check (nome is null or char_length(nome) <= 80),
  contato     text        not null check (char_length(contato) between 1 and 120),
  cidade      text        check (cidade is null or char_length(cidade) <= 80),
  uf          char(2)     check (uf is null or uf ~ '^[A-Z]{2}$'),
  cultura     text        check (cultura is null or char_length(cultura) <= 40),
  quer_testar boolean     not null default false,
  origem      text        not null default 'site',
  -- O contato chega normalizado (e-mail em minúsculas ou telefone +55DDDNÚMERO);
  -- a API trata um cadastro repetido (409) como sucesso.
  constraint lista_espera_contato_unico unique (contato)
);

comment on table public.lista_espera is
  'Interessados no lançamento do app. Guardar até a pessoa pedir remoção ou até 12 meses após o lançamento (ver Política de Privacidade).';

alter table public.lista_espera enable row level security;

-- Sem políticas: só a service_role (servidor) acessa.
revoke all on table public.lista_espera from anon, authenticated;
