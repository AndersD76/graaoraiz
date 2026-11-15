# Diagnóstico de visibilidade orgânica (SEO + GEO): Grão Raiz

Data: 14/11/2026 · Produção: https://www.appgraoraiz.com.br · Branch do trabalho: `crescimento-qualidade`

## Como o site é montado (stack)

- **Servidor:** Next.js 16 (App Router, Cache Components) em `apps/web`, publicado no Railway (serviço `graaoraiz`, branch `app-clima`), com banco PostgreSQL no Neon.
- **App:** feito em Expo (React Native Web), exportado como SPA para `apps/web/public` e servido na raiz `/`. As rotas do app (`/lavoura`, `/maquinas`, `/maquina/<id>`…) caem no `index.html` (rewrite de fallback).
- **Renderização:**
  - Páginas do Next (`/privacidade`, `/termos`, `/excluir-dados`, `/baixar`, `/avaliar`): HTML no servidor (SSG/SSR).
  - O app: **só no navegador (CSR)**. O HTML que o buscador recebe em `/` e em todas as rotas do app é uma casca vazia com `<div id="root">`.

## Problemas encontrados, por impacto × esforço

| # | Problema | Impacto | Esforço | Situação |
|---|---|---|---|---|
| 1 | **O site não está indexado** no Bing/Yahoo (`site:appgraoraiz.com.br` sem resultado); sem Search Console nem Bing Webmaster verificados. | Crítico | Baixo (ação manual) | Pendente: depende de você (RELATORIO.md, ações manuais) |
| 2 | Conteúdo indexável só existe via JavaScript: `/` e `/maquinas/*` chegam vazios ao robô. Os anúncios de máquinas, que são o dado próprio mais valioso, não podem ser lidos. | Crítico | Médio | **Corrigido:** páginas públicas no servidor em `/maquinas-usadas`, `/maquinas-usadas/categoria/<categoria>` e `/maquinas-usadas/<id>` |
| 3 | Conteúdo duplicado entre hosts: o endereço do Railway (`graaoraiz-production.up.railway.app`) responde 200 com o mesmo site. | Alto | Baixo | **Corrigido:** redirect 308 para o www (a API fica de fora, para apps antigos) |
| 4 | O domínio sem www (`appgraoraiz.com.br`) não abre (erro de conexão). | Alto | Baixo (DNS) | Pendente: criar redirect no provedor de DNS |
| 5 | Rotas do app (telas de conta, lavoura etc.) eram indexáveis com conteúdo vazio, título idêntico e sem canonical. | Médio | Baixo | **Corrigido:** `X-Robots-Tag: noindex, follow` nessas rotas e `canonical` na raiz |
| 6 | Sem dados estruturados. | Médio | Baixo | **Corrigido:** Organization + WebSite + SoftwareApplication na raiz; Product/Offer + BreadcrumbList nos anúncios; FAQPage só onde a FAQ está visível |
| 7 | Sitemap com 7 URLs fixas, incluindo `/maquinas` (casca vazia), sem anúncios. | Médio | Baixo | **Corrigido:** sitemap com páginas fixas, categorias com anúncio e cada anúncio, com a data real do banco |
| 8 | robots.txt genérico, sem tratar crawlers de IA. | Médio | Baixo | **Corrigido:** crawlers de busca e de IA liberados explicitamente; área logada e painéis bloqueados |
| 9 | Sem `llms.txt` nem IndexNow. | Médio | Baixo | **Corrigido:** `/llms.txt`, `/llms-full.txt` e IndexNow disparado a cada anúncio criado, editado, vendido ou removido (falta a chave no servidor) |
| 10 | Prévia do link de um anúncio no WhatsApp era genérica (o link levava à SPA). | Médio | Baixo | **Corrigido:** o "Mandar para alguém" agora usa a página pública, com foto, preço e cidade |
| 11 | Nenhum conteúdo para as buscas informacionais do produtor (delta T, Proagro, EUDR, alerta de geada). | Alto | Alto | Briefs para revisão em `growth/briefs/` (nada publicado sem sua revisão) |
| 12 | Sem página "Sobre" com responsável, CNPJ e contato (E-E-A-T); e-mail de contato no domínio antigo. | Médio | Baixo | Pendente: dados reais (TODO-VALIDAR) |
| 13 | Core Web Vitals da raiz: o app é um bundle grande de JavaScript (Expo). | Médio | Alto | Medido: LCP 6,4 s no celular, SEO 100, acessibilidade 94 ([`lighthouse/README.md`](lighthouse/README.md)) |

## Rotas públicas e classificação

| Rota | Tipo | Antes | Agora |
|---|---|---|---|
| `/` | App (SPA) | indexável, casca vazia | indexável, com canonical, JSON-LD e conteúdo de reserva sem JS |
| `/maquinas-usadas` | Página do servidor | não existia | indexável, lista real + FAQ |
| `/maquinas-usadas/categoria/<c>` | Página do servidor | não existia | indexável quando há anúncio; `noindex` quando vazia (página rasa) |
| `/maquinas-usadas/<id>` | Página do servidor | não existia | indexável enquanto à venda; vendido fica `noindex` |
| `/baixar`, `/avaliar` | Página do servidor | indexável | indexável |
| `/privacidade`, `/termos`, `/excluir-dados` | Página do servidor | indexável | indexável |
| `/maquinas`, `/maquina/<id>`, `/lavoura`, `/chuva`, `/caderno`, `/entrar`, `/ajustes`, `/anunciar`, `/meus-anuncios` e demais telas | App (SPA) | indexável, vazia, duplicada | `noindex, follow` (e bloqueio no robots para as telas de conta) |
| `/admin/*` (antes `/painel/*` e `/avaliacoes`) | Painel administrativo com login | indexável por engano | `noindex, nofollow`, bloqueado no robots, sem referrer |
| `/api/*` | API | bloqueado no robots | igual |

## Mapa de intenção

Pesquisa feita em 14/11/2026 no Yahoo Brasil (índice do Bing) e no autocompletar do Google. O Google bloqueou a coleta automática, então não deu para ver a visão geral de IA nem o "As pessoas também perguntam". Não há fonte de volume de busca; a demanda é qualitativa, pelo autocompletar.

Arquivo: [`mapa-intencao.csv`](mapa-intencao.csv) (22 consultas em 6 clusters).

**Melhores oportunidades** (resultados fracos e encaixe direto com o produto):
1. **Consulta PRODES/CAR por imóvel**: só uma ferramenta comercial grátis no top 5. O app já faz essa checagem.
2. **Pluviômetro digital / anotar chuva**: concorrência fraca.
3. **Delta T na pulverização**: 3ª sugestão do Google para "delta t"; ranqueiam tabelas e calculadoras.
4. **Como comprovar perda no Proagro / prazo de comunicação**: dominado por escritórios de advocacia; casa com o dossiê do app.
5. **"Pulverizar hoje em {cidade}"**: o Bing mostra páginas de previsão por cidade do RS (Passo Fundo, Panambi). Dá para fazer com dado próprio (regras de pulverização por município).

**Máquinas usadas:** 100% classificados grandes (MF Rural, OLX, Agrofy, Tratores e Colheitadeiras). Ganhar exige volume de anúncios; as páginas por categoria já existem, e as páginas por estado entram quando houver anúncios.

## O que não foi possível medir nesta rodada

- **Search Console:** sem acesso (o domínio não está verificado). Sem histórico de consultas, cliques e indexação.
- **Bing Webmaster Tools:** sem acesso.
- **Respostas de IA (Google AI Overviews, ChatGPT, Perplexity):** precisam de chaves de API das plataformas com busca; ver o painel de share of voice no RELATORIO.md.
