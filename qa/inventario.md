# Inventário: rotas, endpoints, dados e testes

Data: 14/11/2026 · Front: app Expo (React Native Web, SPA) + páginas Next.js 16 · Back: rotas de API do Next (Node) · Banco: Neon (PostgreSQL) · Hospedagem: Railway (`graaoraiz`, branch `app-clima`) · Autenticação: token próprio HMAC-SHA256 (180 dias) com senha scrypt · Papéis: visitante, conta, conta de demonstração, dono do painel (chave).

## Endpoints da API

| Método e rota | Autenticação | Entrada | Observação |
|---|---|---|---|
| POST `/api/conta/cadastro` | não | nome, e-mail, senha, atribuição | limite 10/h por IP |
| POST `/api/conta/entrar` | não | e-mail, senha | 10 erros/15 min por e-mail |
| POST `/api/conta/recuperar` | não | e-mail | resposta igual com ou sem conta (sem enumeração) |
| POST `/api/conta/redefinir` | código de 6 dígitos | e-mail, código, senha | HMAC do código, 15 min, 5 tentativas |
| GET/PUT `/api/conta/dados` | token | estado do app (até 2 MB) | demo é só leitura |
| DELETE `/api/conta` | token | — | apaga conta e dados (cascata) e limpa a vitrine |
| GET `/api/anuncios` | não | filtros | só anúncios ativos |
| POST `/api/anuncios` | token (não demo) | anúncio + aceite | 30 ativos por conta |
| GET/PUT/DELETE `/api/anuncios/<id>` | GET aberto; PUT/DELETE dono | anúncio | dono checado no SQL (`conta_id = $2`) |
| POST `/api/anuncios/<id>/situacao` | dono | ativo/pausado | |
| POST `/api/anuncios/<id>/vendido` | dono | valor | grava cópia em `app.venda` |
| POST `/api/anuncios/<id>/contato` | token (não demo) | — | devolve WhatsApp; **novo:** 30/h por conta |
| GET `/api/anuncios/meus` | token | — | só da própria conta |
| POST `/api/anuncios/fotos` | token (não demo) | base64 JPEG/WebP ≤ 900 KB | assinatura de bytes; 60/h por conta |
| GET `/api/anuncios/fotos/<id>` | não | — | cache longo |
| POST `/api/conformidade` | não | contorno | chama PRODES e CAR; **novo:** 20/h por IP |
| GET `/api/municipio` | não | lat, lon | chama IBGE; **novo:** 120/10 min por IP |
| GET `/api/previsao`, `/api/historico`, `/api/diario` | não | lat, lon, datas | Open-Meteo; **novo:** limites por IP |
| GET `/api/precos` | não | — | Cepea + BCB, cache |
| POST `/api/avaliacao` | não | formulário | 10/15 min por IP, honeypot |
| POST `/api/eventos` | opcional | evento da lista fechada | **novo**; 120/10 min por IP |
| POST `/api/lista-espera` | não | — | legado (formulário removido do site) |

## Páginas

- **Públicas (servidor):** `/maquinas-usadas`, `/maquinas-usadas/categoria/<c>`, `/maquinas-usadas/<id>`, `/baixar`, `/avaliar`, `/privacidade`, `/termos`, `/excluir-dados`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llms-full.txt`, `/indexnow.txt`, `/opengraph-image`.
- **App (SPA):** `/` e todas as telas do app.
- **Painel administrativo (`/admin`, login de administrador):** Dashboard, Usuários e ficha da conta, Anúncios, Vendas e comissões (com planilha CSV), Pedidos de contato, Funil, Avaliações, Configurações e Busca. Os endereços antigos `/painel/maquinas`, `/painel/funil` e `/avaliacoes` redirecionam para ele.

## Chamadas externas

- **INPE TerraBrasilis (PRODES), SICAR (CAR), IBGE geoserviços:** recebem o contorno ou o ponto, sem nome.
- **Open-Meteo:** coordenada arredondada.
- **Microsoft Planetary Computer:** contorno, direto do app.
- **Cepea, BCB:** dados públicos, sem dado pessoal.
- **Resend:** e-mail do "esqueci a senha"; sem chave em produção.
- **IndexNow:** só URLs públicas.
- **RevenueCat:** apps das lojas.

## Fluxo de dado pessoal

| Dado | Entra por | Fica em | Vai para | Prazo |
|---|---|---|---|---|
| Nome, e-mail, hash da senha | cadastro | `app.conta` | — | até excluir a conta |
| Lavoura (talhões, contornos, caderno) | app | `app.dados_conta` (JSON) + aparelho | INPE/CAR/IBGE/Planetary (só geometria) | até excluir a conta |
| Anúncio, fotos, WhatsApp | anunciar | `app.anuncio`, `app.foto_anuncio` | comprador com conta (WhatsApp) | até excluir a conta |
| Quem pediu contato | contato | `app.contato_anuncio` | painel do dono | até excluir a conta |
| Venda e comissão (nome, e-mail, WhatsApp) | "vendi" | `app.venda` | painel do dono | prazo fiscal (≈5 anos) |
| Origem do cadastro (UTM, referrer) | cadastro | `app.conta.origem` | painel do dono | até excluir a conta |
| Eventos do funil | app/servidor | `app.evento` (sem e-mail ou WhatsApp) | painel do dono | conta vira nula ao excluir |
| Avaliação (contato opcional) | /avaliar | `app.avaliacao` | painel do dono | 12 meses |

## Estado dos testes

| Camada | Antes | Agora |
|---|---|---|
| Regras de clima (`packages/clima`) | 93 testes (Vitest) | 93 testes |
| Servidor (`apps/web`) | **nenhum** | 19 testes (Vitest): limite, JSON-LD, crawler, atribuição, token, sessão do painel, origem, rotas do app |
| Autorização e segurança da API | nenhum | 66 verificações contra servidor real ([`testes/autorizacao.mjs`](testes/autorizacao.mjs)), contas de teste apagadas no fim |
| Painel administrativo | não havia painel | 43 verificações no navegador ([`testes/admin.mjs`](testes/admin.mjs)) |
| App (`apps/mobile`) | 11 testes ponta a ponta (Playwright, sem servidor) | 11 testes |
| Lint e tipos | app e servidor | app e servidor |
| CI | não havia | `.github/workflows/ci.yml` (tudo acima, menos o teste com banco) |

Resultados e vulnerabilidades: [`RELATORIO-QUALIDADE-SEGURANCA.md`](RELATORIO-QUALIDADE-SEGURANCA.md).
