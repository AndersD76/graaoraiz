# @graoraiz/web — site e API do Grão Raiz

Site público (landing page, Política de Privacidade, Termos de Uso, exclusão de dados e página de download) e uma API
pequena usada pelo app e pelo site. Feito com Next.js (App Router, Cache Components), TypeScript e Tailwind CSS.

As regras e URLs do Open-Meteo vêm do pacote compartilhado [`@graoraiz/clima`](../../packages/clima).

## Páginas

| Rota             | Conteúdo                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------- |
| `/`              | Landing: hero, exemplo do semáforo, como funciona, recursos, planos, dúvidas, lista de espera |
| `/privacidade`   | Política de Privacidade (LGPD)                                                              |
| `/termos`        | Termos de Uso                                                                               |
| `/excluir-dados` | Como apagar dados (URL exigida pela Google Play)                                            |
| `/baixar`        | Destino dos links dos cartões de chuva (`/baixar?utm_source=cartao`)                        |

## API

| Método e rota                                                 | O que faz                                                                                                  |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `GET /api/previsao?lat=&lon=&dias=7&passados=0`               | Repassa a previsão do Open-Meteo (coordenadas arredondadas a ~1 km). Cache de 30 min na CDN.                |
| `GET /api/historico?lat=&lon=&inicio=AAAA-MM-DD&fim=AAAA-MM-DD` | Chuva diária histórica (reanálise). Período máximo de 31 anos. Cache de 1 dia na CDN.                     |
| `POST /api/lista-espera`                                      | Cadastro na lista de espera (JSON). Grava no Supabase quando configurado.                                  |

Erros de validação respondem `400 { "erro": "..." }`; falhas do Open-Meteo, `502 { "erro": "..." }`.
Sem Supabase configurado, a lista de espera responde `200 { ok: true, armazenado: false }` em desenvolvimento
(e registra a entrada no console) e `503` em produção.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha. Variáveis `NEXT_PUBLIC_*` entram no build: depois de mudar,
gere o build de novo.

| Variável                    | Obrigatória       | Para quê                                                                                     |
| --------------------------- | ----------------- | -------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`      | Sim, em produção  | Endereço público (ex.: `https://graoraiz.com.br`). Padrão: `http://localhost:3000`.           |
| `NEXT_PUBLIC_CONTATO_EMAIL` | Recomendado       | E-mail exibido no site e nos textos legais. Padrão: `contato@graoraiz.com.br`.                |
| `NEXT_PUBLIC_PLAY_URL`      | Não               | Link da Google Play. Vazio = "Em breve".                                                     |
| `NEXT_PUBLIC_APP_STORE_URL` | Não               | Link da App Store. Vazio = "Em breve".                                                       |
| `NEXT_PUBLIC_RESPONSAVEL`   | Sim, antes de publicar | Nome ou razão social do controlador dos dados. Vazio = placeholder e aviso "Revise com um profissional". |
| `OPEN_METEO_API_KEY`        | Para uso comercial | Chave paga do Open-Meteo; ativa o servidor `customer-*`.                                    |
| `SUPABASE_URL`              | Para a lista de espera | URL do projeto Supabase.                                                                |
| `SUPABASE_SERVICE_ROLE_KEY` | Para a lista de espera | Chave `service_role` (só no servidor; nunca no navegador).                              |

### Supabase

Rode [`supabase/lista_espera.sql`](supabase/lista_espera.sql) no SQL Editor do projeto. A tabela fica com RLS ligado
e sem políticas públicas: só a API do site (com a chave `service_role`) lê e grava.

## Como rodar

Na raiz do monorepo (`D:\projetos\graaoraiz`):

```bash
npm install                          # uma vez, na raiz (workspaces)
npm run dev -w @graoraiz/web         # desenvolvimento em http://localhost:3000
npm run lint -w @graoraiz/web
npm run typecheck -w @graoraiz/web
npm run build -w @graoraiz/web       # build de produção
npm run start -w @graoraiz/web       # serve o build
```

## Deploy

- Funciona em qualquer hospedagem que rode Next.js no Node.js (Vercel, Netlify, Render, Fly.io, VPS com `next start` etc.).
- Na Vercel: importe o repositório, defina **Root Directory** como `apps/web` e configure as variáveis acima. O
  plano Hobby (gratuito) da Vercel é só para uso pessoal e não comercial — para um produto com assinatura paga, use o
  plano Pro (pago) ou outra hospedagem.
- O Open-Meteo gratuito também é só para uso não comercial: em produção comercial, contrate um plano e defina
  `OPEN_METEO_API_KEY`.
- Mantenha a atribuição "Dados meteorológicos: Open-Meteo.com (CC BY 4.0)" no rodapé (exigência da licença).

## Antes de publicar

- Preencha `NEXT_PUBLIC_RESPONSAVEL`, `NEXT_PUBLIC_CONTATO_EMAIL` e `NEXT_PUBLIC_SITE_URL`.
- Revise a Política de Privacidade e os Termos de Uso com um profissional e confirme que descrevem o app como ele
  está (por exemplo, o uso da localização do aparelho e o caminho Ajustes → "Apagar todos os meus dados").
- Confira os preços e o período de teste em `lib/config.ts` (`PRECO`) e nas lojas.
