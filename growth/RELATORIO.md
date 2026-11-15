# Relatório: visibilidade orgânica (SEO + GEO + distribuição)

Data: 14/11/2026 · Branch: `crescimento-qualidade` (ainda não publicado em produção) · Site: https://www.appgraoraiz.com.br

## Resumo

O site era invisível para buscadores e para as IAs. Três motivos:

- **Conteúdo só existia via JavaScript.** O app Expo entrega uma casca vazia ao robô.
- **Nada indexado.** O domínio não está no Search Console nem no Bing.
- **O endereço do Railway duplicava o site.**

O que foi feito:

- **Páginas no servidor para o dado mais valioso:** os anúncios de máquinas.
- **Dados estruturados** em todas as páginas públicas.
- **Sitemap real, robots com crawlers de IA, `llms.txt` e IndexNow.**
- **Um host canônico:** o endereço do Railway redireciona para o www.
- **404 de verdade:** um endereço inventado não abre mais o app.
- **Medição** no próprio banco.

O que falta depende de você: verificar o domínio no Google e no Bing, a chave do IndexNow e o redirect do domínio sem www.

## O que foi implementado

### Fase 0: diagnóstico

- [`diagnostico.md`](diagnostico.md): 13 problemas priorizados e a classificação de todas as rotas.
- [`mapa-intencao.csv`](mapa-intencao.csv): 22 consultas em 6 grupos de intenção.
- [`rastreio-local.md`](rastreio-local.md): rastreio completo como Googlebot, com o script [`scripts/rastrear.mjs`](scripts/rastrear.mjs), reutilizável.

### Fase 1: técnico

| Item | Onde |
|---|---|
| Páginas públicas no servidor: `/maquinas-usadas`, `/maquinas-usadas/categoria/<c>`, `/maquinas-usadas/<id>`. HTML completo, cache com invalidação a cada mudança de anúncio. | `apps/web/app/maquinas-usadas/`, `lib/vitrine.ts`, `components/vitrine-maquinas.tsx` |
| Título ≤ 60 e descrição ≤ 155 caracteres; `canonical` absoluto; prévia (Open Graph) com a foto do anúncio | `generateMetadata` das páginas; `privacidade` e `termos` encurtadas |
| `noindex` em páginas rasas: categoria vazia, anúncio vendido, telas do app e painéis | `next.config.ts`, metadados das páginas |
| **404 de verdade:** só as telas reais do app (lidas de `apps/mobile/src/app`) abrem o `index.html`. O resto responde 404. Antes, qualquer endereço respondia 200 com o mesmo título ("soft 404"). | `next.config.ts` (`telasDoApp`) + teste em `next.config.test.ts` |
| Redirect 308 de qualquer host (ex.: Railway) para o www. A API fica de fora, para os apps antigos. | `next.config.ts` |
| Sitemap com as datas reais do banco: páginas fixas, categorias com anúncio e cada anúncio | `app/sitemap.ts` |
| robots.txt: crawlers de busca e de IA liberados com nome; conta, painéis e API bloqueados | `app/robots.ts` |
| Raiz do app com `canonical`, JSON-LD e um bloco de conteúdo e links para quem não roda JavaScript | `scripts/montar-app.mjs` |
| Cabeçalhos de segurança (HSTS, nosniff, Referrer-Policy, frame-ancestors) | `next.config.ts` |

### Fase 2: conteúdo

Quatro briefs prontos para escrever, priorizados pela concorrência mais fraca e pelo encaixe com o produto. Estão em [`briefs/`](briefs/):

1. **Consulta PRODES/CAR por imóvel:** ferramenta grátis. O app já faz essa checagem.
2. **Delta T na pulverização:** calculadora com a mesma regra do app.
3. **Como comprovar perda no Proagro:** checklist prático.
4. **Pluviômetro digital.**

Nada foi publicado. Os temas 2 e 3 precisam de revisão técnica (agrônomo) e jurídica antes.

### Fase 3: GEO (respostas de IA)

- **Dados estruturados:**
  - Organization, WebSite e SoftwareApplication na raiz.
  - Product/Offer e BreadcrumbList em cada anúncio.
  - FAQPage só onde a pergunta está visível na página.
- **Resposta direta no primeiro parágrafo** de cada anúncio: o quê, onde, quanto e quem vende.
- **`/llms.txt` e `/llms-full.txt`:** resumo do produto e lista dos anúncios ativos em Markdown.
- **Robots:** crawlers de busca das IAs (OAI-SearchBot, PerplexityBot, Claude-SearchBot…) liberados com nome. Os de treino também estão liberados; para bloquear, mude o grupo `CRAWLERS_TREINO` em `lib/seo.ts`.
- **Texto canônico da marca** para repetir em todo perfil: [`entidade.md`](entidade.md).
- **Visitas de crawlers de IA** passam a ser contadas (`crawler_ai_hit`) e aparecem em `/admin/funil`.

### Fase 4: distribuição

- **IndexNow:** cada anúncio criado, editado, pausado, vendido ou removido avisa o Bing, o Yandex e os outros na hora (`lib/indexnow.ts`). Liga quando a chave estiver no servidor.
- **Link compartilhado:** o "Mandar para alguém" do anúncio usa a página pública, que mostra foto, preço e cidade na prévia do WhatsApp.
- **Rodapé:** link para "Máquinas usadas à venda".
- **Padrão de UTM** para WhatsApp, Instagram e grupos: [`utm.md`](utm.md).

### Fase 5: medição

- **Eventos** em `app.evento`: o rastro dos crawlers de IA, os envios ao IndexNow e o funil completo (ver o relatório de conversão).
- **Painel** em `/admin/funil` (com login de administrador):
  - funil semanal;
  - origem dos cadastros;
  - visitas de crawlers de IA;
  - respostas do IndexNow.
- **Presença nas respostas de IA:** modelo de acompanhamento mensal em [`share-of-voice.csv`](share-of-voice.csv). É manual; a medição automática exige as APIs pagas das plataformas.

## Verificação feita (servidor local de produção, banco real, dados de teste apagados no fim)

- **Teste ponta a ponta da vitrine e do SEO:** 24 de 24 verificações.
  - JSON-LD Product com preço;
  - `og:image`, `canonical` e H1 no HTML;
  - cache invalidado;
  - categoria vazia em `noindex`;
  - sitemap e `llms.txt`;
  - cabeçalhos;
  - `noindex` nas telas do app;
  - robots;
  - primeiro toque gravado.
- **Rastreio como Googlebot:** [`rastreio-local.md`](rastreio-local.md), depois das correções de soft 404 e descrições.
- **Lighthouse (celular):**
  - vitrine e páginas de texto com SEO e acessibilidade 100 e LCP ≤ 1 s;
  - a raiz (app) subiu para SEO 100 e acessibilidade 94, mas segue lenta (LCP 6,4 s) pelo peso do JavaScript do Expo;
  - detalhes em [`lighthouse/README.md`](lighthouse/README.md).

## Ações manuais (só você pode fazer), em ordem

1. **Publicar esta branch** (merge em `app-clima`). O Railway publica sozinho.
2. **Google Search Console:**
   - adicionar a propriedade de domínio `appgraoraiz.com.br`;
   - verificar pelo registro TXT no DNS;
   - enviar `https://www.appgraoraiz.com.br/sitemap.xml`.
3. **Bing Webmaster Tools:** importar do Search Console, que é mais rápido, e enviar o mesmo sitemap.
4. **Chave do IndexNow no Railway:**
   - criar a variável `INDEXNOW_KEY` com 32 letras e números aleatórios;
   - conferir depois que `https://www.appgraoraiz.com.br/indexnow.txt` mostra a chave.
5. **Domínio sem www:** `appgraoraiz.com.br` não abre. No provedor de DNS, criar o redirecionamento 301 para `https://www.appgraoraiz.com.br`.
6. **E-mail de contato no domínio novo:** o rodapé mostra `contato@graoraiz.com.br`, que não funciona. Depois de criar o e-mail, definir `NEXT_PUBLIC_CONTATO_EMAIL` no Railway.
7. **Perfis oficiais:** criar LinkedIn e Instagram com o texto de [`entidade.md`](entidade.md) e me passar os links para o `sameAs` do JSON-LD.

## TODO-VALIDAR (nada foi inventado; isto precisa de fonte ou de dado seu)

- **CNPJ e endereço comercial**, para a página "Sobre" e o JSON-LD (`entidade.md`).
- **Número da resolução do CMN** sobre fotos georreferenciadas no Proagro (5.303 ou 5.323?): conferir no site do Banco Central antes de citar (brief 03).
- **Prazos de comunicação de perda** (Manual de Crédito Rural e seguradoras), brief 03.
- **Faixas de delta T e limites de vento** usados no app, com fonte técnica e revisor (brief 02).
- **Volume de busca:** não há fonte paga. O mapa de intenção usa o autocompletar, que é qualitativo.

## Linha de base (14/11/2026) e metas de 90 dias

| Indicador | Hoje (medido) | Meta em 90 dias |
|---|---|---|
| Páginas no índice do Bing (`site:`) | 0 | Todas as páginas públicas e anúncios ativos |
| Páginas no índice do Google | sem acesso (TODO-VALIDAR no Search Console) | Idem, com o relatório "Páginas" sem erro |
| Anúncios ativos | 0 | Definir com você (é o que mais pesa no SEO de máquinas) |
| Contas reais (sem demonstração) | 1 | Medir em `/admin` a partir da publicação |
| Cliques orgânicos | sem dado | Ter 4 semanas de série no Search Console para fixar a meta |
| Citação nas respostas de IA (10 perguntas de `share-of-voice.csv`) | não medido | Primeira medição na semana da publicação; meta: aparecer em ao menos 1 |
| LCP da raiz no celular (Lighthouse local) | 6,4 s | < 2,5 s (exige carregar o mapa e o satélite sob demanda) |

As metas de tráfego não têm número de propósito: sem Search Console não há base para estimar.

## Riscos

- **A raiz continua sendo um app em JavaScript.** O Google renderiza, mas devagar; as IAs em geral não. Por isso o conteúdo que deve ranquear fica em páginas do servidor (vitrine e futuros guias), não no app.
- **Páginas de anúncio com pouco estoque** podem parecer rasas. A categoria vazia já sai do índice; com poucos anúncios, a vitrine deve ser divulgada mais por WhatsApp do que por busca.
- **Conteúdo agronômico e jurídico sem revisão** pode prejudicar a confiança da marca (E-E-A-T). Os briefs exigem um revisor nomeado.
- **Liberar crawlers de treino** é decisão de negócio. Hoje estão liberados, para a marca aparecer nas IAs; dá para fechar em uma linha.
