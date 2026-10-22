# Plano de construção — Grão Raiz Clima (piloto safra 2026/27)

Base: [ANALISE.md](ANALISE.md). Data: 21/10/2026.

## 0. Objetivo e o que "garantir resultado" significa

**Objetivo:** chegar à colheita da soja (jan–abr/2027) com um piloto pago em 1 cooperativa, 1–2 unidades de recebimento e 50–200 cooperados, entregando:

1. **Para o cooperado:** avisos proativos no WhatsApp (colheita × chuva, pulverização, veranico, geada) e registro da caderneta respondendo à mensagem.
2. **Para o agrônomo:** fila diária priorizada, aprovação de recomendações e dossiê de perda pronto para assinar.
3. **Para a gestão:** previsão semanal de recebimento por unidade e mapa de cooperados em risco.

**Garantia de resultado, na prática:** não dá para garantir que a cooperativa compre. O que este plano garante é que **cada entrega só avança quando passa por um portão medido** (seção 6): testes automáticos, backtest com o clima real da safra passada, validação de um agrônomo, duas semanas de "modo sombra" e metas do piloto assinadas antes de começar. Ao fim do piloto existem números para negociar — ou um sinal claro para corrigir o rumo cedo.

**Fora do escopo do piloto** (fase 2): painel de preços de mercado, EUDR completo com checagem de desmatamento, satélite/NDVI, cobrança automática, app do produtor na web, outras culturas além de soja (milho safrinha entra depois).

## 1. Decisões de arquitetura

| Tema | Decisão | Por quê |
|---|---|---|
| Repositório | Manter `graaoraiz`, branch `pivo-clima` | Casca boa e pequena (~90 arquivos); refazer motor e modelo |
| Framework | Next.js 16 + React 19 (upgrade agora) | Next 14 tem vulnerabilidade crítica; código ainda pequeno para migrar |
| Banco | PostgreSQL gerenciado em São Paulo (Supabase ou Neon) + Prisma 6 com **migrações versionadas** | Hoje não há migrações; dados no Brasil simplificam LGPD |
| Autenticação web | next-auth 4.24.15 (corrigido) só para **equipe da cooperativa** | Cooperado não precisa de senha |
| Identidade do cooperado | **Número de WhatsApp** (E.164) + consentimento registrado | O produto vive no WhatsApp |
| Jobs agendados | Executor de jobs com repetição e idempotência (Inngest ou Trigger.dev) acionado por cron | Avaliar regras a cada 3 h, reenviar com segurança |
| Clima | Open-Meteo comercial (previsão horária, previsões históricas para backtest, reanálise) + INMET (observado) + estações da cooperativa (adaptador) | Licença comercial barata, histórico para provar acurácia |
| WhatsApp | WhatsApp Business Platform (Cloud API da Meta), direto ou via BSP | Única forma oficial de mensagens proativas |
| IA | Regras **determinísticas e auditáveis** decidem os alertas; LLM (Claude) só interpreta respostas em texto livre e redige resumos | Explicabilidade é argumento de venda e reduz risco |
| Mapa | Leaflet + camada de satélite licenciada (MapTiler ou Mapbox) | Tiles públicos do OSM não permitem uso comercial em escala |
| PDF | `@react-pdf/renderer` (já instalado) | Dossiê precisa ser PDF de verdade |
| Validação | `zod` em todas as rotas | Hoje nenhuma rota valida entrada |
| Qualidade | Vitest (unidade/integração), Playwright (ponta a ponta), GitHub Actions, Sentry | Hoje não há testes nem monitoramento |

## 2. Modelo de dados novo

Substitui o schema atual com migração inicial. Campos principais:

| Entidade | Campos-chave | Observações |
|---|---|---|
| `Cooperativa` (tenant) | nome, cnpj, marca (logo, cores), fuso, configurações de limiares | Absorve `CooperativaConfig` |
| `Unidade` | cooperativaId, nome, lat/lng, capacidade (t), secagem (t/dia) | Unidades de recebimento |
| `Usuario` | nome, email, senha (hash) | Equipe da cooperativa e da plataforma |
| `Membro` | usuarioId, cooperativaId, papel (`ADMIN`, `GESTOR`, `AGRONOMO`, `LOGISTICA`, `CREDITO`) | Autorização por papel e por tenant |
| `Produtor` | cooperativaId, nome, telefone E.164 (único por tenant), matrícula, unidadeId, agronomoId, documento (opcional, cifrado) | Cooperado |
| `Consentimento` | produtorId, tipo (`WHATSAPP`, `COMPARTILHAMENTO_DADOS`), origem, data, revogadoEm | LGPD |
| `Propriedade` | produtorId, nome, municipioIbge, car | N por produtor |
| `Talhao` | propriedadeId, nome, geometria (GeoJSON Polygon validado), centroide lat/lng (**obrigatório**), área calculada, textura do solo | Geometria permanente |
| `Ciclo` | talhaoId, safra (`2026/27` padronizado), cultura, cultivar, ciclo em dias / grupo de maturação, dataPlantio (real ou prevista), produtividadeEsperada (sc/ha), unidadeDestinoId, status (`PLANEJADO`, `PLANTADO`, `COLHIDO`, `PERDIDO`) | Estádio e colheita prevista são **calculados**, não digitados |
| `Aplicacao` | cicloId, produto, dose, unidade, data/hora, origem (`WHATSAPP`/`WEB`), condicoesTempo (vento, umidade, temperatura, chuva prevista no momento) | Prova contra deriva |
| `Entrega` (antigo Lote) | cicloId, unidadeId, data, peso, umidade, impureza, chaveNfe (44 dígitos validados), ticket | CRUD real |
| `SerieClima` | celula (grade ~0,1°), fonte, tipo (`PREVISAO`/`OBSERVADO`), geradoEm, dados horários (JSON) | Cache por célula, não por talhão |
| `Evento` | cooperativaId, alvo (produtor/talhão/ciclo), tipo, severidade, janela (início/fim), evidência (dados que justificam), regraVersao, chaveDedupe (única), status (`GERADO`→`APROVADO`→`ENVIADO`→`ENTREGUE`→`LIDO`→`RESPONDIDO`→`RESOLVIDO`/`EXPIRADO`) | Coração do produto |
| `Mensagem` | produtorId, direção, template, conteúdo, waMessageId, status, categoria de cobrança, eventoId | Log completo do WhatsApp |
| `Acao` | mensagemId, intenção (`REGISTRAR_APLICACAO`, `INFORMAR_PLANTIO`, `REGISTRAR_COLHEITA`, `REPORTAR_OCORRENCIA`, `PEDIR_AGRONOMO`, `FEEDBACK`), dados extraídos, confiança, resultado | Resposta vira registro |
| `Ocorrencia` | cicloId, tipo (granizo, seca, excesso de chuva, geada), data, fotos, descrição, área afetada | Alimenta o dossiê |
| `Dossie` | cicloId, período, conteúdo congelado, hash SHA-256, versão, aprovadoPor (agrônomo), aprovadoEm | Imutável depois de aprovado |
| `PrevisaoRecebimento` | unidadeId, semana, toneladas p10/p50/p90, geradoEm, versaoModelo | Histórico para medir erro |
| `PrecoCooperativa` | cooperativaId, unidadeId, cultura, preço, data | Preço oficial publicado pela cooperativa (fase 2) |
| `Auditoria` | quem, o quê, quando, antes/depois | Toda alteração sensível |

Regras transversais: toda consulta filtrada por `cooperativaId` (helper único de acesso), índices em todas as chaves estrangeiras, `onDelete` definido, datas em UTC com fuso da cooperativa na exibição.

## 3. Módulos a construir

Cada módulo tem critério de aceite verificável. Nada é dado como pronto sem o teste correspondente passando no CI.

### M0 — Saneamento e fundação
- Corrigir as falhas de dono: `app/api/talhoes/[id]` (GET/PUT/DELETE) e POST `app/api/aplicacoes`, com helper único de autorização.
- Remover tudo que é falso: dashboard (`app/(app)/dashboard/page.tsx`), fallbacks de demonstração em `app/(app)/rastreabilidade/**`, badge fixo do header, declaração EUDR automática, painel e API de preços (`/mercado`, `/api/precos`, `/api/v1/cotacoes`), `lib/cooperativas.ts`.
- Dependências: Next 16 + React 19, next-auth 4.24.15, Prisma 6; remover `shadcn` (CLI), `stripe`, `@stripe/stripe-js`, `resend`, `cheerio`, `@base-ui/react` até serem usados.
- Proteção de rotas no servidor (middleware/proxy), `zod` em todas as rotas, limite de tentativas em login.
- Migração inicial, `.env.example`, README real.
- Vitest + Playwright + GitHub Actions (lint, typecheck, testes, audit) + Sentry.
- Landing honesta: novo posicionamento (clima proativo para cooperativas), sem depoimentos/números inventados, datas EUDR corretas, links de Termos/Privacidade reais.

**Aceite:** teste automático para cada rota provando que usuário de uma conta/cooperativa não acessa dados de outra; `npm audit --omit=dev` sem críticas/altas; nenhuma tela logada com dado fixo ou aleatório; CI verde.

### M1 — Cooperativa, equipe e importação
- Entidades `Cooperativa`, `Unidade`, `Membro`, `Produtor`, `Consentimento`.
- Convite de equipe por e-mail com papel.
- **Importação por planilha (CSV/XLSX)** de cooperados (nome, telefone, unidade, agrônomo), propriedades/talhões (CAR, KML/Shapefile ou município + área + ponto) e plantio (cultura, cultivar, data ou semana, área). Pré-visualização com erros linha a linha antes de gravar.
- White-label por cooperativa: tokens de cor corrigidos (sem `@theme inline` fixo), logo e nome aplicados em todas as telas e nas mensagens.

**Aceite:** importar uma planilha de 200 cooperados com erros propositais → erros apontados corretamente, linhas válidas gravadas; testes de isolamento entre duas cooperativas.

### M2 — Ciclo agronômico
- Talhão com desenho de polígono sobre satélite, importação KML/CAR, área calculada, centroide obrigatório.
- `Ciclo` por safra; fenologia v1 da soja por **frações do ciclo da cultivar** (VE, R1, R5, R7, R8) validadas pelo agrônomo parceiro; v2 por graus-dia.
- Colheita prevista = plantio + ciclo ajustado; recalculada a cada mudança.

**Aceite:** testes unitários de fenologia com casos conferidos pelo agrônomo; polígonos inválidos rejeitados (anel aberto, autointerseção, coordenadas fora do Brasil).

### M3 — Clima
- Ingestão por **célula de grade** (deduplica talhões vizinhos): previsão horária 7–16 dias (chuva, probabilidade, vento, rajada, umidade, temperatura, ponto de orvalho, evapotranspiração) a cada 3 h; observado diário (INMET da estação mais próxima + reanálise).
- Adaptador para estações da cooperativa (API ou CSV), com prioridade sobre o modelo quando existir estação próxima.
- Arquivo histórico de previsões para **backtest**.
- Monitor de saúde: alerta interno se uma fonte falhar; **nunca** usar valor padrão silencioso.

**Aceite:** job idempotente (rodar duas vezes não duplica); dados ausentes viram estado "sem dados", não números inventados; painel interno de cobertura por célula.

### M4 — Motor de regras e alertas
Regras v1 (limiares configuráveis por cooperativa; valores iniciais a validar com o agrônomo):

| Regra | Disparo (padrão inicial) | Para quem |
|---|---|---|
| R1 Janela de colheita | Ciclo em maturação (≥ R7) e 72 h com chuva < 2 mm e probabilidade < 40%; prioridade alta se chuva ≥ 10 mm com ≥ 60% prevista em 3–5 dias | Cooperado + logística |
| R2 Janela de pulverização | Próximas 48 h: vento 3–10 km/h, rajada < 20 km/h, delta T 2–8 °C, umidade ≥ 50%, temperatura ≤ 30 °C, sem chuva nas 2 h seguintes; só quando há aplicação planejada ou pedido | Cooperado |
| R3 Veranico em fase crítica | Estádio R1–R5 e ≥ 10 dias com < 2 mm (observado + previsto) | Cooperado + agrônomo + crédito |
| R4 Excesso de chuva | ≥ 100 mm em 7 dias em R7–R8 (qualidade/colheita) ou no plantio | Cooperado + logística |
| R5 Geada | Mínima prevista ≤ 3 °C em 72 h em culturas sensíveis | Cooperado |
| R6 Calor na floração | Máxima ≥ 35 °C por ≥ 3 dias em R1–R3 | Cooperado + agrônomo |
| R7 Coleta de dados | Talhão sem plantio confirmado após a janela típica; ciclo maduro sem colheita registrada | Cooperado |
| R8 Prazo de comunicação de perda | Após ocorrência registrada, lembrar aviso imediato ao banco/cooperativa (Proagro/seguro) | Cooperado + agrônomo |

Orquestração:
- Cada disparo gera um `Evento` com **evidência** (os números que justificam) e **chave de deduplicação** (talhão + regra + janela).
- Priorização e limites: no máximo N mensagens por cooperado por dia, talhões agrupados numa mensagem, silêncio das 21 h às 6 h, cancelamento automático se a previsão mudar.
- **Modo sombra:** eventos gerados e mostrados ao agrônomo sem enviar; ele marca "enviaria / não enviaria".
- **Backtest:** reexecutar as regras sobre as previsões arquivadas da safra 2025/26 e comparar com o que de fato aconteceu.

**Aceite:** cobertura de testes ≥ 90% no motor; backtest com relatório de acertos/erros por regra; nenhum evento duplicado em execuções repetidas.

### M5 — WhatsApp
- Conta WhatsApp Business verificada, número e nome de exibição aprovados (**iniciar na semana 0** — depende da Meta).
- Modelos (templates) de utilidade aprovados: boas-vindas/consentimento, R1–R8, confirmação de plantio, resumo semanal. Exemplo R1: "{{nome}}, talhão {{talhao}}: tempo firme de {{inicio}} a {{fim}}. Chuva provável a partir de {{dia}} ({{prob}}%). Sugestão: priorize a colheita deste talhão." Botões: "Vou colher", "Falar com agrônomo", "Não ajudou".
- Consentimento por link/QR distribuído pela cooperativa; opt-out por "PARAR" em qualquer momento.
- Webhook de entrada: status de entrega/leitura e respostas.
- Respostas por **botão** (determinístico) primeiro; texto livre interpretado por LLM com saída estruturada e confiança — abaixo do limiar vai para a fila do agrônomo. Áudio e foto: foto entra já (ocorrência); áudio com transcrição na fase 2.
- Ações: "Já apliquei" → pergunta produto e dose → grava `Aplicacao` com as condições do tempo daquela hora; "Colhi" → grava data; "Caiu granizo" + foto → `Ocorrencia`.
- Plano B se a Meta atrasar: agrônomo envia pelo WhatsApp Business comum a partir da fila do sistema (piloto não para).

**Aceite:** 10 números de teste: entrega ≥ 98%, resposta → registro em ≤ 5 s, opt-out efetivo, zero envio fora do horário, reenvio sem duplicar.

### M6 — Painel do agrônomo
- Fila do dia: cooperados a atender, motivo e evidência, ordenados por risco.
- Aprovar/ajustar/descartar eventos (no modo sombra e em produção para tipos sensíveis).
- Ficha do cooperado: talhões no mapa, ciclos, linha do tempo de mensagens, aplicações, ocorrências.
- Configuração de limiares por região/cultura.

**Aceite:** teste ponta a ponta do fluxo aprovar → enviar → resposta aparece na ficha.

### M7 — Painel da gestão
- **Previsão de recebimento por unidade e semana (p10/p50/p90):** soma de área × produtividade esperada × participação histórica de entrega, distribuída a partir da maturação, descontando dias com chuva prevista (além do horizonte da previsão, probabilidade climatológica); incerteza por simulação.
- Backtest com o recebimento diário real da safra 2025/26 fornecido pela cooperativa; erro semanal (MAPE) exibido por unidade.
- Mapa de risco (veranico/excesso de chuva por fase), lista para crédito, engajamento (convidados, consentidos, responderam).

**Aceite:** backtest reproduzível com relatório; previsão regenerada diariamente com histórico guardado para medir erro real durante o piloto.

### M8 — Ocorrências e dossiê
- Registro de ocorrência pelo WhatsApp (foto com data e localização) ou pela web.
- Dossiê em PDF: identificação, talhão (mapa), ciclo e estádio na data do evento, série de chuva/temperatura versus normal, sequência de dias secos, ocorrências com fotos, aplicações, campo de parecer do agrônomo; conteúdo congelado com hash SHA-256 e versão.
- Texto fixo: "documento de apoio; não substitui o laudo do profissional habilitado".

**Aceite:** um agrônomo real aprova o modelo de dossiê com um caso da safra passada.

### M9 — Segurança, LGPD e operação
- Cooperativa como controladora, Grão Raiz como operador: contrato de tratamento de dados, Termos e Política de Privacidade publicados.
- Página pública do lote com lista de campos permitidos (sem coordenadas exatas nem nomes de operadores).
- API key com hash, escopo e revogação.
- Backups diários testados, Sentry, logs estruturados, painel de custo de mensagens.

### Fase 2 (depois do piloto ou em paralelo se sobrar fôlego)
- **Preço da cooperativa** (tabela diária oficial por unidade) e alerta de preço-meta.
- **EUDR honesto:** exportação GeoJSON por entrega de soja no formato do sistema europeu (WGS‑84, 6 casas, polígono > 4 ha), sem declaração automática; checagem opcional de sobreposição com alertas de desmatamento.
- ZARC via API Agritec da Embrapa (conformidade da data de plantio no dossiê).
- Satélite (NDVI) para produtividade esperada e evidência de perda.
- Transcrição de áudio, resumo semanal por IA, cobrança.

## 4. Cronograma

Hoje é 21/10/2026. A soja precoce começa a ser colhida no fim de dezembro; o grosso, de janeiro a março.

| Semana | Datas | Entregas | Portão |
|---|---|---|---|
| S0 | 22–25/10 | Decisões da seção 9; abrir verificação Meta e número; contato e pedido de dados à cooperativa (anexo A); branch `pivo-clima` | — |
| S1 | 26/10–01/11 | M0 completo | **G0** |
| S2 | 02–08/11 | M1 (tenant, equipe, importação) + M2 (polígono, ciclo, fenologia) | — |
| S3 | 09–15/11 | M3 (clima) + M4 (regras v1, orquestração, backtest) | **G1** |
| S4 | 16–22/11 | M5 (WhatsApp em homologação) + M6 (painel do agrônomo); modo sombra com dados reais | **G2** |
| S5 | 23–29/11 | M7 (previsão de recebimento + backtest) + M8 (ocorrências) | **G3** |
| S6 | 30/11–06/12 | M8 (dossiê) + M9; treinamento dos agrônomos; checklist de produção | **G4** |
| S7 | 07–13/12 | Piloto fase A: consentimentos, confirmação de plantio, alertas de pulverização/veranico/calor | — |
| — | dez–abr | Piloto fase B: colheita, previsão de recebimento, dossiês; revisão quinzenal com a cooperativa | Metas do piloto |
| — | abr–mai/2027 | Relatório do piloto e proposta comercial 2027/28 | Decisão de compra |

**Caminho crítico:** verificação da Meta e aprovação de templates; recebimento dos dados da cooperativa (cooperados, talhões, plantio, recebimento histórico); disponibilidade do agrônomo parceiro para validar regras. O cronograma assume 1 desenvolvedor em tempo integral com apoio do Claude Code; com menos dedicação, cortar R5/R6 e o dossiê para depois de janeiro, mantendo R1–R4, WhatsApp e previsão de recebimento.

## 5. Interfaces que o piloto entrega

- **Cooperado:** só WhatsApp (marca da cooperativa no texto e no nome de exibição, se a cooperativa usar número próprio).
- **Agrônomo (web, celular):** fila do dia, ficha do cooperado, aprovação, dossiê.
- **Gestão (web):** previsão de recebimento, risco, engajamento, importação, equipe, marca.
- **Plataforma (interna):** saúde das fontes de clima, filas, custo de mensagens, versões de regras.

## 6. Portões de qualidade e metas

| Portão | Critério para passar |
|---|---|
| **G0** — fundação | 100% das rotas com teste de isolamento passando; sem vulnerabilidade crítica/alta em produção; zero dado falso na área logada; CI verde |
| **G1** — regras | Backtest na safra 2025/26 da região do piloto; agrônomo avalia amostra de 50 alertas e considera ≥ 80% corretos e úteis; ajustes registrados com nova versão das regras |
| **G2** — WhatsApp | Entrega ≥ 98%, resposta → registro ≤ 5 s, opt-out ok, nenhuma mensagem fora do horário, nenhuma duplicada |
| **G3** — recebimento | Backtest com recebimento real da cooperativa; erro semanal por unidade publicado e meta do piloto definida **com** a cooperativa a partir desse número |
| **G4** — pronto para produção | 2 semanas de modo sombra com ≥ 80% de "enviaria"; backups restaurados com sucesso; termos e contrato de dados assinados |

**Metas do piloto** (propor no contrato; valores finais combinados com a cooperativa):

| Dimensão | Indicador | Proposta inicial |
|---|---|---|
| Adoção | Convidados que deram consentimento em 3 semanas | ≥ 50% |
| Engajamento | Cooperados ativos que respondem ao menos 1 mensagem/mês | ≥ 60% |
| Qualidade | Alertas avaliados como úteis (botão) | ≥ 70% |
| Dados | Talhões com plantio confirmado | ≥ 80% |
| Logística | Erro semanal da previsão de recebimento | meta definida no G3 |
| Assistência técnica | Horas economizadas por agrônomo por semana | medir (linha de base na S6) |
| Negócio | Decisão sobre contrato 2027/28 | até maio/2027 |

**Critérios de correção de rumo:** consentimento < 30% em 3 semanas → rever convite e abordagem com os agrônomos; utilidade < 50% → rever regras e limiares; previsão de recebimento sem ganho sobre o método atual da cooperativa → reposicionar o módulo e concentrar em alertas e dossiê.

## 7. Custos estimados do piloto (por mês, a confirmar nas tabelas oficiais)

| Item | Estimativa |
|---|---|
| Hospedagem do app e jobs | US$ 20–50 |
| PostgreSQL + armazenamento de fotos | ~US$ 25 |
| Open-Meteo comercial (plano Standard) | US$ 29 |
| WhatsApp (utilidade ≈ US$ 0,007 por mensagem no Brasil; fontes divergem) | ~US$ 80–100 na safra inteira para 200 cooperados × 3 msgs/semana × 20 semanas, mais margem do BSP se usar |
| LLM para respostas em texto livre | dezenas de dólares |
| Camada de satélite do mapa | plano gratuito provavelmente suficiente |
| Embrapa Agritec (fase 2) | R$ 250 por 10 mil requisições |

Ordem de grandeza: **menos de US$ 200/mês** no piloto, sem contar pessoas.

## 8. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Meta demora para verificar/aprovar | Iniciar na S0; plano B manual pelo agrônomo a partir da fila do sistema |
| Cooperativa demora a entregar dados | Lista objetiva (anexo A); começar com o que houver; R7 coleta plantio pelo WhatsApp |
| Baixa adesão de cooperados | Convite feito pelo agrônomo e na unidade; mensagens curtas com botões; nada de app para instalar |
| Previsão errar | Comunicar probabilidade; regras conservadoras; cancelar alerta se a previsão mudar; backtest antes de enviar |
| Responsabilidade por recomendação | Texto de sugestão; decisão do produtor; defensivos sempre via agrônomo (receituário) |
| LGPD | Contrato de tratamento, consentimento registrado, minimização de dados, página pública restrita |
| Escopo crescer | Preços, EUDR completo e satélite ficam na fase 2 por regra |
| Capacidade de desenvolvimento | Cortes pré-definidos na seção 4 |

## 9. Decisões pendentes (suas)

1. **Cooperativa do piloto** — quem você consegue acessar? (preferência: média, PR/SC/RS, com histórico de recebimento disponível).
2. **Número de WhatsApp:** nosso (mais rápido) ou da cooperativa (marca dela, depende da conta Meta dela).
3. **Agrônomo parceiro** para validar regras, fenologia e dossiê.
4. **Hospedagem:** Vercel + Supabase (São Paulo) como padrão, ou outra preferência.
5. **Nome comercial:** manter "Grão Raiz" e padronizar a grafia.

## 10. Primeira semana (S0–S1), tarefa a tarefa

- [ ] Criar branch `pivo-clima`.
- [ ] Abrir conta Meta Business, iniciar verificação e reservar número.
- [ ] Enviar à cooperativa o pedido de dados (anexo A) e proposta de piloto.
- [ ] Helper `exigirDono`/`exigirTenant` e correção de `app/api/talhoes/[id]/route.ts` e `app/api/aplicacoes/route.ts`, com testes.
- [ ] Remover dashboard falso, fallbacks de demonstração, badge fixo, declaração EUDR automática, preços sintéticos e `lib/cooperativas.ts`.
- [ ] Corrigir onboarding (enum de cultura, tipo de alerta, formato de safra) ou removê-lo até o novo fluxo.
- [ ] Atualizar Next 16/React 19, next-auth 4.24.15, Prisma 6; remover dependências sem uso; `npm audit` limpo.
- [ ] Middleware/proxy de autenticação; `zod` nas rotas existentes.
- [ ] Migração inicial do Prisma; `.env.example`; README.
- [ ] Vitest, Playwright, GitHub Actions, Sentry.
- [ ] Landing honesta com o novo posicionamento.

## Anexo A — Dados a pedir à cooperativa

1. Cooperados do piloto: nome, telefone celular, matrícula, unidade de entrega, agrônomo responsável.
2. Áreas: CAR ou arquivo de talhões (KML/Shapefile); se não houver, município + área + localização aproximada.
3. Plantio 2026/27: cultura, cultivar, data (ou semana) e área por talhão — normalmente existe nos registros da assistência técnica ou na venda de sementes.
4. Recebimento das safras 2024/25 e 2025/26 por unidade e por dia (toneladas) — para o backtest da previsão.
5. Unidades: localização, capacidade de recebimento e de secagem.
6. Estações meteorológicas próprias, se houver: localização e acesso aos dados.
7. Pessoa de contato em cada área: assistência técnica, grãos/logística, TI.
