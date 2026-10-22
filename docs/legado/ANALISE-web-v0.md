# Análise do Grão Raiz — estado em 21/10/2026

Escopo: código em `D:\projetos\graaoraiz` (commit `6153960`, branch `master`). Auditoria de leitura do backend, das telas e das dependências, mais checagens locais (typecheck, lint, `npm audit`). Nenhum arquivo do app foi alterado.

## Veredito

O Grão Raiz é um **protótipo de demonstração**: a casca (layout, landing, componentes, mapa, autenticação) é boa e reaproveitável, mas o "motor" que um cliente pagaria não existe e parte do que aparece na tela é fabricado.

- **Funciona de verdade:** cadastro/login, propriedade, talhão (só um ponto), aplicações, cadastro de alertas, chave de API, cadastro de membros.
- **Não existe:** nada proativo (nenhum alerta é disparado), WhatsApp, clima, vínculo cooperativa → cooperados, criação de lote, cobrança.
- **É falso ou simulado:** dashboard inteiro, preços por cooperativa (ruído aleatório), dados de demonstração exibidos em conta real, depoimentos e números da landing, declaração automática de "não desmatamento".
- **É perigoso:** 3 falhas que deixam um usuário ler, alterar ou apagar dados de outro; vulnerabilidades críticas em Next.js e NextAuth.

Decisão recomendada: **manter o repositório e a stack, refazer o motor e o modelo de dados**. Reescrever do zero desperdiçaria a casca; remendar o modelo atual não suporta cooperativas.

## 1. Checagens locais

| Checagem | Resultado |
|---|---|
| TypeScript (`tsc --noEmit`) | passa |
| ESLint (`next lint`) | passa (1 aviso de `<img>`) |
| Testes | não existem |
| Migrações Prisma | não existem (assume `db push` manual) |
| `.env.example` | não existe |
| `npm audit --omit=dev` | 34 vulnerabilidades: **5 críticas** (next, next-auth, @auth/core, @auth/prisma-adapter, proxy-addr), 20 altas |
| Versões | Next 14.2.35 (atual 16.x), React 18, Prisma 5.22, next-auth 4.24.13 |

Boa parte das vulnerabilidades altas vem do pacote `shadcn` (CLI) instalado como dependência de produção — deveria ser ferramenta de desenvolvimento.

## 2. Segurança (corrigir antes de qualquer uso real)

| Severidade | Problema | Onde |
|---|---|---|
| Crítica | Qualquer usuário logado lê, altera e apaga talhão de outro (com aplicações, lotes, NF-e) | `app/api/talhoes/[id]/route.ts:18`, `:82`, `:112` |
| Crítica | POST de aplicação aceita talhão de outra pessoa (grava na caderneta e na página pública alheia) | `app/api/aplicacoes/route.ts:61` |
| Crítica | Next 14 / NextAuth com vulnerabilidades críticas publicadas | `package.json` |
| Alta | Chave de API guardada em texto puro e devolvida a qualquer momento | `app/api/configuracoes/api-key/route.ts`, `lib/api-auth.ts` |
| Alta | Página pública do lote expõe coordenadas exatas, nomes de operadores (LGPD), NF-e | `app/api/lotes/[id]/route.ts` |
| Alta | Configuração de cooperativa sem checagem de papel ou plano | `app/api/cooperativa/config/route.ts` |
| Média | Sem validação de entrada (nenhum schema), sem limite de tentativas no login/cadastro, cadastro revela e-mails existentes | rotas em `app/api/**` |
| Média | Proteção das páginas só no navegador (não há middleware) | `app/(app)/layout.tsx:76` |

## 3. Dados e domínio

**Modelo atual** (`prisma/schema.prisma`): User, Propriedade (1 por usuário), PropriedadeMembro, Talhao, Aplicacao, Lote, Alerta, PrecoCotacao (não usado), CooperativaConfig (só cores/logo), Account, Session.

Lacunas que impedem o produto novo:

- **Sem multi-tenant:** não há relação produtor ↔ cooperativa. `CooperativaConfig` é a marca da *própria conta* de quem a criou; associados nunca a veem. `Propriedade.userId @unique` limita a uma fazenda por produtor.
- **Sem ciclo agronômico:** talhão mistura geometria permanente com cultura/safra (texto livre). Faltam data de plantio, cultivar, ciclo, estádio, colheita prevista, produtividade.
- **Geometria fraca:** só um ponto opcional; o campo `geojson` nunca é preenchido por nenhuma tela. Clima e EUDR precisam de coordenada obrigatória e polígono.
- **Integridade:** sem índices nas chaves estrangeiras, sem `onDelete`, `numeroLote` não é único, sem trilha de auditoria.
- **Membros decorativos:** nenhuma rota lê `PropriedadeMembro`; o membro adicionado não ganha acesso a nada.

## 4. Fluxos ponta a ponta

| Fluxo | Estado |
|---|---|
| Cadastro → login | funciona; login cai no dashboard falso |
| Onboarding (5 passos) | **quebrado**: envia cultura "Soja" (enum espera `SOJA`) e alerta `tipo:"ACIMA"` (não existe) → erro sempre (`app/(app)/onboarding/page.tsx:29`, `:140`) |
| Talhão | grava um ponto; sem desenho de perímetro nem cálculo de área; mapa "pula" ao digitar |
| Aplicação | grava (com a falha de dono acima) |
| Lote / entrega | **não grava**: só existe no estado da tela (`app/(app)/rastreabilidade/[id]/page.tsx:313-353`) |
| QR e página pública | QR aponta para lote inexistente → 404 |
| Relatório EUDR | JSON real mas sem lotes nem polígonos; "PDF" é impressão do navegador; declaração de não desmatamento automática sem verificação |
| Alertas | cadastro funciona; **nada dispara** (`disparadoEm` nunca é preenchido; não há job) |
| White-label | salva mas não aparece: Tailwind v4 com `@theme inline` ignora as variáveis trocadas, 132 cores fixas no código, `useWhitelabel` nunca é usado, vale só para a conta que configurou |
| Configurações | nada é salvo (toggles de WhatsApp/e-mail são só visuais) |

## 5. Preços (risco reputacional alto)

- Milho e trigo calculados com o **futuro da soja** (ZS=F) e peso de bushel da soja → milho aparece ~2× o valor real (`lib/precos.ts:57`, `:23`).
- Basis por cooperativa **inventado** e com **variação aleatória a cada acesso** "para simular tempo real" (`app/api/precos/route.ts:35`, idem `app/api/v1/cotacoes/route.ts:45`), exibido com nomes reais (Coamo, C.Vale, Cotripal…) e selo "Melhor". Comentário "Dados reais" é falso (`lib/cooperativas.ts:1`); há erros (C.Vale em Passo Fundo/RS).
- Se a fonte cai, mostra soja 1050 e dólar 5,10 como se fossem atuais (`lib/precos.ts:73`, `:89-95`). Fonte (Yahoo) é não oficial e não permite uso comercial.

Recomendação: **desligar o painel de preços** até usar o preço oficial publicado pela própria cooperativa.

## 6. EUDR

- O regulamento se aplica em **30/12/2026** (médias e grandes) e **30/06/2027** (micro e pequenas); o app diz "2025".
- Escopo: só **soja** entre as culturas do app (milho, trigo, aveia, canola estão fora), mas o app rotula todas.
- Falta o essencial: polígono para áreas acima de 4 ha (GeoJSON, WGS‑84, 6 casas decimais), identificação do fornecedor, período de produção, código HS, e qualquer evidência de desmatamento zero (PRODES, MapBiomas, CAR).
- "Score de compliance" não tem significado (um ponto GPS + uma aplicação qualquer + NF-e "x" = 100%) e é recalculado de forma diferente em 4 rotas.

## 7. Telas, celular e acessibilidade

- Dados de demonstração aparecem em conta nova ("Fazenda São José", 342 ha, 87%) sem aviso.
- Alvos de toque de 28–36 px, inputs de 14 px (zoom no iOS), diálogos com colunas fixas que transbordam em 360 px, tabelas de 6–9 colunas.
- Mapa só com ruas (sem satélite), sem desenho, tiles públicos do OpenStreetMap (não permitidos para uso comercial em escala).
- Acessibilidade: nenhum `label` associado a campo, botões só com ícone sem nome, contraste abaixo do mínimo no texto secundário.
- Marca inconsistente: "GrãoRaiz", "GraoRaiz", "graoraiz.com", repositório "graaoraiz"; logo é um caractere Unicode.

## 8. Landing: afirmações sem respaldo (remover ou cumprir)

Depoimentos fictícios; números "resultados reais" (são os do dashboard falso); funcionamento offline; alertas e suporte por WhatsApp; integração com ERP; preços em tempo real; desenho de perímetro e área automática; painel multiprodutor e benefícios do plano Cooperativa; limites de plano não aplicados e sem pagamento; LGPD/servidores em SP sem política publicada; datas da EUDR erradas; citação atribuída ao "Art. 3" (o corte de 2020 está no Art. 2).

## 9. O que reaproveitar

| Reaproveitar como está | Reaproveitar com mudanças | Reescrever | Não existe |
|---|---|---|---|
| Shell (sidebar, header, gaveta mobile), componentes shadcn/ui, visual da landing, geração de QR, `lib/db.ts`, hash bcrypt, padrão de checagem de dono de `/api/alertas`, endpoints de leitura `/api/v1/*` | Autenticação (tipagem, papéis, tenant), API key (hash, escopo), talhão (polígono, satélite, área), aplicação (vínculo ao ciclo, clima no momento), alertas (generalizar), relatório (virar exportação honesta), página pública (campos permitidos), white-label (por cooperativa, tokens corretos) | Rotas com falha de dono, dashboard, todos os fallbacks de mock, preços e basis, score EUDR, declaração EUDR, fluxo de lote, onboarding, landing (textos) | Cooperativa → cooperados, ciclo agronômico, clima, motor de regras e agendador, WhatsApp, previsão de recebimento, ocorrências e dossiê, cobrança, migrações, testes, validação de entrada, auditoria, LGPD operacional |
