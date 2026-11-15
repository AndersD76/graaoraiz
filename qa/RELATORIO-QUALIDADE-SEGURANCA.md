# Relatório de qualidade e segurança: Grão Raiz

Data: 14/11/2026 · Branch: `crescimento-qualidade` · Ambiente testado: servidor de produção local (`next start`) com o banco Neon, contas e dados de teste apagados no fim. Em produção, só checagens passivas (cabeçalhos, robots, variáveis por comparação, sem imprimir valores).

## Resumo executivo

O código está em bom estado de segurança. Nenhum teste encontrou acesso a dados de outra conta (IDOR), injeção, XSS ou forja de token.

Os problemas eram de borda: endereço inventado respondendo 200, cache de anúncios de conta excluída, revelação de cadastro no "esqueci a senha", corpo gigante lido na memória, falta de limites por IP e de cabeçalhos. Todos foram corrigidos e cobertos por teste.

**Há um problema crítico fora do código, que só você resolve:**

> **A senha do banco de produção (Neon) está no histórico do repositório no GitHub, e o repositório é público.** Ela aparece nos commits `cb16478` e `6153960`, e é a mesma que o servidor do Railway usa hoje. Qualquer pessoa pode abrir o banco: contas, resumos de senha, WhatsApp dos vendedores, dados de lavoura.

**O que fazer, nesta ordem:**
1. **Neon:** console.neon.tech → projeto → *Roles* → `Reset password`.
2. **Railway:** atualizar `DATABASE_URL` com a senha nova. Posso fazer pelo CLI assim que você me passar a URL nova, ou você cola no painel.
3. **Local:** atualizar `apps/web/.env.local`.
4. **GitHub:** tornar o repositório privado (Settings → Danger Zone → Change visibility).
   - Apagar a senha do histórico não adianta depois de exposta. O que protege é a troca.
5. **Depois da troca:** conferir nos registros do Neon se houve conexão estranha (Monitoring → conexões).

## Vulnerabilidades e correções

| # | Gravidade | Problema | Situação |
|---|---|---|---|
| 1 | **Crítica** | Senha do banco de produção no histórico público do git | **Pendente: ação sua (acima)** |
| 2 | Alta | Dependências com falha alta: `@expo/cli` (com `zod` 3 vulnerável dentro) e `node-forge` | **Corrigido:** `@expo/cli` 58.1.20 e `node-forge` 1.4.3. Restam 4 moderadas em ferramentas de build (`glob`/`minimatch` via `@expo/fingerprint`); a "correção" do npm rebaixa o Expo para o SDK 52 e não foi aplicada. Nada disso roda no servidor. |
| 3 | Média | "Esqueci a senha" sem serviço de e-mail (como está em produção): respondia 200 para e-mail sem conta e 503 para e-mail cadastrado. Isso revela quem tem conta. | **Corrigido:** sem e-mail configurado, a resposta é igual para todos (`lib/email.ts`, `api/conta/recuperar`) |
| 4 | Média | Excluir a conta tirava os anúncios do banco, mas a vitrine, o sitemap e o `llms.txt` continuavam mostrando-os até o cache vencer | **Corrigido:** a exclusão limpa o cache e avisa os buscadores (`api/conta/route.ts`) |
| 5 | Média | Qualquer endereço inventado respondia 200 com a casca do app ("soft 404"): conteúdo duplicado para buscadores e uma superfície maior | **Corrigido:** só as telas reais do app (lidas das rotas do Expo) abrem o `index.html`; o resto é 404 |
| 6 | Média | API sem limite por IP nas consultas externas (PRODES/CAR, IBGE, Open-Meteo) e no cadastro: dava para esgotar cotas ou criar contas em massa | **Corrigido:** limites por IP em `proxy.ts` e no cadastro |
| 7 | Média | API aceitava chamadas de qualquer site pelo navegador | **Corrigido:** `proxy.ts` recusa `Origin` desconhecida (403) |
| 8 | Baixa | Corpo da requisição lido inteiro na memória antes de checar o tamanho | **Corrigido:** recusa pelo `Content-Length` antes de ler (`lerCorpo`) |
| 9 | Baixa | Painel quebrava (500) com corpo que não fosse formulário | **Corrigido:** responde 400 |
| 10 | Baixa | Sem cabeçalhos de segurança (HSTS, nosniff, frame-ancestors, Referrer-Policy) | **Corrigido** em `next.config.ts`; painéis com `no-referrer` e `noindex` |
| 11 | Baixa | Anúncio pausado ou removido: o buscador recebia a página com 200 | **Corrigido em parte:** 404 de verdade para buscadores e prévias de link quando o anúncio já está em cache; no primeiro acesso, ou no navegador, sai 200 com `noindex` (limite do Next com streaming, documentado) |
| 12 | Baixa | Token de sessão vale 180 dias e não é revogado ao sair | **Pendente (decisão de produto):** encurtar para 30 dias com renovação automática e guardar uma "versão de sessão" na conta para revogar |
| 13 | Baixa | Bloqueio de login por e-mail (10 erros/15 min): alguém pode travar a conta de outro por 15 minutos | Aceito: troca consciente contra força bruta |
| 14 | Info | Limites ficam na memória de cada instância e zeram no deploy | Aceito com 1 instância; com mais, mover para o banco ou Redis |
| 15 | Média | Chave do painel ia na URL (histórico do navegador, prints, referrer) | **Corrigido:** painel `/admin` com login de administrador. Sessão em cookie `httpOnly`/`SameSite=Strict` de 12 h, presa à senha, conferida no banco a cada tela e ação, e registro de cada ação. A chave do painel só serve para o primeiro acesso, enquanto não há administrador. |
| 16 | Info | CSP só com `frame-ancestors`, `base-uri`, `object-src` e `form-action` | O app Expo injeta estilos e usa workers; uma CSP completa precisa de teste dedicado |

## Testes

| Camada | Antes | Agora | Resultado |
|---|---|---|---|
| Regras de clima (`packages/clima`, Vitest) | 93 | 93 | 93 de 93 |
| Servidor (`apps/web`, Vitest) | 0 | 19: limite por IP, JSON-LD seguro, crawlers, atribuição, chave do painel, sessão do painel (vencida, adulterada, token do app recusado), origem, rotas do app | 19 de 19 |
| Autorização e segurança da API contra servidor real ([`testes/autorizacao.mjs`](testes/autorizacao.mjs)) | 0 | 66 verificações (as do painel passaram para o teste do painel) | 66 de 66 |
| Painel administrativo no navegador ([`testes/admin.mjs`](testes/admin.mjs)): primeiro acesso, login, todas as telas, ações, planilha, tema, celular, conta comum barrada, saída | 0 | 43 verificações | 43 de 43 |
| SEO e vitrine ponta a ponta (servidor real) | 0 | 24 verificações | 24 de 24 |
| App (Playwright, web) | 11 | 11 | 11 de 11 |
| Tipos e lint (app e servidor) | sim | sim | sem erro |
| CI no GitHub | não havia | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml): tipos, lint, testes, ponta a ponta e auditoria crítica a cada push | roda no próximo push |

**O que o teste de autorização cobre** (3 contas: dona, intrusa e de demonstração):

- **Visitante sem token:** 12 rotas protegidas → 401.
- **Token adulterado:** assinatura trocada, corpo trocado para outra conta, validade estendida, sem assinatura, lixo → 401.
- **Outra conta (IDOR):** não edita, não pausa, não vende, não tira do ar, não usa foto alheia, não vê os anúncios nem os dados de lavoura de outra conta. O banco confirma que nada mudou.
- **Atribuição em massa:** dono, situação, comissão e id enviados no corpo são ignorados.
- **Anúncio pausado:** só o dono vê.
- **Conta de demonstração:** não anuncia, não envia foto, não pega WhatsApp, não grava.
- **Entradas maliciosas:**
  - `<script>` no título sai escapado;
  - corpo grande → 413;
  - JSON quebrado → 400;
  - preço negativo e anúncio sem aceite da comissão são recusados;
  - injeção SQL em filtro, id e e-mail não quebra nada;
  - foto com script embutido é servida como imagem com `nosniff`.
- **Comissão:** calculada no servidor. Não dá para vender duas vezes nem editar depois de vendido.
- **Painel:** sem chave ou com chave errada → 403; com a chave, marca comissão paga.
- **Conta:**
  - "esqueci a senha" responde igual com e sem conta;
  - senha errada repetida → 429;
  - excluir a conta invalida o token e tira os anúncios da vitrine na hora;
  - a venda (comissão) fica registrada.

**Como rodar:**
1. `cd apps/web && npm run build && npx next start -p 3300`, com `AVALIACOES_CHAVE` definida.
2. Em outro terminal: `node qa/testes/autorizacao.mjs http://localhost:3300 <chave>`.

O script se recusa a rodar contra o domínio de produção.

## Qualidade (Lighthouse, celular, servidor local)

| Página | Desempenho | Acessibilidade | Boas práticas | SEO | LCP |
|---|---|---|---|---|---|
| `/` (app), antes → depois | 45 → 52 | 84 → 94 | 96 → 100 | 92 → 100 | 7,2 s → 6,4 s |
| `/maquinas-usadas` | 82 | 100 | 100 | 100 | 1,0 s |
| `/privacidade` | 87 | 100 | 100 | 100 | 0,9 s |
| `/baixar` | 86 | 100 | 100 | 100 | 0,8 s |

**O app na raiz é o ponto fraco.** O pacote principal do Expo tem 1,1 MB de JavaScript e leva mais de 3 s de processamento num celular médio.

- **Feito:**
  - imagens decorativas com `alt` vazio e fotos com descrição;
  - texto dos botões no tema escuro com contraste de 7:1 ou mais (era 2,3:1).
- **Próximo passo:** carregar sob demanda os módulos pesados (mapa, satélite, gráficos), que hoje entram no pacote da tela inicial.
- **Fora do nosso controle:** o aviso de ARIA nas abas vem da biblioteca de navegação (Expo Router).

## Pendências recomendadas

1. **Trocar a senha do Neon e fechar o repositório (crítico, ação sua).**
2. **Token de 180 dias:** reduzir e permitir revogação (item 12).
3. **Webhook de pagamento,** quando houver: assinatura verificada, idempotência por id de evento e teste automático de webhook falso e repetido.
4. **CSP completa,** testada com o app Expo.
5. **Varredura automática de logs** atrás de dado pessoal: hoje os logs só têm mensagens de erro, conferido à mão.
6. **Rodar o teste de autorização** num ambiente de homologação, com um banco separado do de produção. Hoje o "local" usa o mesmo banco do Neon, com limpeza no fim.
