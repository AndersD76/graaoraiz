# Grão Raiz — plano do app de clima para o campo

Atualizado em 22/10/2026. Substitui os planos anteriores (arquivados em `docs/legado/`).

## Situação em 22/10/2026

**Pronto e testado:**
- **App (`apps/mobile`):** apresentação inicial, talhões (mapa open-source, GPS, cultura, plantio), tela Hoje (semáforo de pulverização, tempo firme, geada/temporal, 7 dias), hora a hora, pluviômetro com estimativa, média histórica e calendário, cartão de chuva, ocorrências, relatório da safra em PDF, avisos locais com tarefa em segundo plano, assinatura (RevenueCat), ajustes e exclusão de dados. Funciona sem internet com a última previsão.
- **Site (`apps/web`):** landing com lista de espera, privacidade, termos, exclusão de dados, /baixar e API de previsão/histórico.
- **Regras (`packages/clima`):** 43 testes.
- **Testes do app:** 4 fluxos ponta a ponta na versão web; bundles Android e iOS gerados; diagnóstico do Expo 20/20.
- Ícone e tela de abertura; textos das lojas e guia de publicação.

**Depende de contas suas:** Expo/EAS, Google Play, Apple, domínio e hospedagem do site, RevenueCat com os produtos, chave comercial do Open-Meteo (ver [PUBLICACAO.md](PUBLICACAO.md)).

## 1. O produto

**Uma frase:** o app que diz se dá para pulverizar, colher ou entrar com máquina hoje, em cada talhão — e guarda a chuva da safra.

**Para quem:** produtor de grãos (soja, milho, trigo) de pequeno e médio porte, no Sul e no Centro-Oeste, que usa WhatsApp todo dia e hoje decide olhando previsão genérica de cidade.

**Como se vende sem time:** loja de apps (busca), cartão de chuva compartilhado nos grupos de WhatsApp, conteúdo curto e assinatura paga dentro do app. Nenhuma venda consultiva, nenhuma implantação.

**O que não é:** não é mais um app de previsão (há vários grátis), não recomenda produto nem dose (não entra em receituário agronômico), não é software de gestão de fazenda.

**Diferença que precisa ser percebida em 30 segundos:**
1. Responde decisões ("pulverizar hoje das 6h às 10h"), não mostra tabelas.
2. É por talhão, não por cidade.
3. Pluviômetro com estimativa automática e cartão para compartilhar.
4. Relatório da safra em PDF para Proagro, seguro e banco.

## 2. Funcionalidades da versão 1.0 (Android)

| Tela | O que tem | Grátis | Pro |
|---|---|---|---|
| **Hoje** | Semáforo de pulverização com melhor horário e motivo; janela de tempo seco (colher/máquina); alertas de geada e temporal; previsão de 7 dias | ✅ | ✅ |
| **Pulverização 48 h** | Faixa hora a hora com cor e valores (vento na barra, rajada, ΔT, umidade, temperatura, chuva nas horas seguintes) | Só hoje | 48 h completas |
| **Chuva** | Anotar em 2 toques; estimativa nos dias sem anotação; calendário; acumulado da safra vs média; cartão para WhatsApp | ✅ | ✅ + histórico completo e exportação |
| **Talhões** | Pino no mapa ou pela localização do celular; cultura e data de plantio opcionais | 1 talhão | Ilimitados |
| **Avisos no celular** | Geada e temporal | ✅ | ✅ |
| | "Amanhã: janela de pulverização das 6h às 10h", janela seca para colheita, veranico | — | ✅ |
| **Relatório da safra** | PDF com chuva anotada + dados meteorológicos + eventos, para Proagro/seguro/banco | — | ✅ |
| **Ajustes** | Tipos de aviso e horário de silêncio; limiares de pulverização ajustáveis (Pro); conta; assinatura; exclusão de dados | ✅ | ✅ |

Sem cadastro para começar: o app abre, pede a localização e mostra o semáforo. A conta (e-mail ou Google) só é pedida para não perder os dados ou para assinar.

## 3. Regras de clima

Implementadas e testadas em `packages/clima` (25 testes passando). São determinísticas e explicáveis: cada cor vem com o motivo.

| Decisão | Regra padrão (ajustável no Pro) |
|---|---|
| Vento na barra | Modelos dão vento a 10 m; convertemos para 2 m pelo perfil da FAO-56 (× 0,748). Ideal 3–10 km/h; acima de 10 atenção; acima de 15 não aplicar; abaixo de 3 atenção (inversão térmica) |
| Rajada na barra | ≥ 15 km/h atenção; ≥ 20 km/h não aplicar |
| Delta T | Bulbo úmido pela fórmula de Stull (2011). Ideal 2–8 °C; 8–10 atenção; > 10 não aplicar; < 2 atenção |
| Umidade | ≥ 55% ideal; 45–55% atenção; < 45% não aplicar |
| Temperatura | ≤ 30 °C ideal; 30–35 atenção; > 35 não aplicar |
| Chuva após aplicar | Chovendo, ou ≥ 0,5 mm nas 2 h seguintes, ou probabilidade ≥ 60% → não aplicar; 40–60% → atenção |
| Janela de pulverização | Horas consecutivas verdes, mínimo 2 h; dia verde se há janela verde, amarelo se só há janela com cuidados |
| Janela seca | Dias seguidos com chuva < 1 mm e probabilidade < 40%, mínimo 2 dias |
| Geada | Mínima do ar ≤ 3 °C risco moderado; ≤ 1 °C risco alto |
| Temporal | Trovoada (códigos 95/96/99), rajada ≥ 60 km/h ou chuva ≥ 20 mm/h |
| Veranico | Dias seguidos com < 2 mm (anotado ou estimado); dia sem dado interrompe a contagem |

Validação antes do lançamento: revisão dos limiares por um agrônomo e comparação das janelas com o que os testadores viram no campo (seção 9).

## 4. Arquitetura

**Decisão de 22/10/2026: o app é local-first.** Tudo que dá para fazer no aparelho fica no aparelho. Isso dispensa servidor de usuários, login e banco na nuvem na versão 1.0: menos custo, menos LGPD, funciona sem sinal.

```
apps/mobile  (Expo SDK 58, React Native, expo-router)
   ├─ dados no aparelho (SQLite): talhões, anotações de chuva, ocorrências, ajustes
   ├─ previsão e chuva estimada: Open-Meteo (direto ou via apps/web), com cache e uso sem internet
   ├─ avisos: calculados no aparelho e agendados como notificações locais; tarefa em segundo plano reagenda a cada ~3 h
   ├─ relatório da safra: PDF gerado no aparelho (expo-print)
   └─ assinatura: RevenueCat + Google Play / App Store

apps/web     (Next.js)
   ├─ site: landing com lista de espera, privacidade, termos, exclusão de dados, /baixar
   └─ API: /api/previsao e /api/historico (repassam o Open-Meteo com cache e a chave comercial), /api/lista-espera

packages/clima  (regras puras em TypeScript, testadas, usadas pelo app e pelo site)
```

Supabase só entra se a lista de espera for usada (tabela `lista_espera`); sincronização entre aparelhos fica para depois do lançamento.

| Peça | Escolha | Observação |
|---|---|---|
| Previsão | Open-Meteo (licença comercial a partir do lançamento) | Chamado só pela nossa API, com cache por célula de ~0,1°; a chave nunca vai no app |
| Chuva estimada e média histórica | Open-Meteo histórico (reanálise) | Média 1991–2020 por célula, calculada uma vez |
| Mapa | Open-source: MapLibre GL JS num WebView com o estilo do OpenFreeMap (dados OpenStreetMap) | Sem chave, uso comercial permitido, roda no Expo Go; sem imagem de satélite (avaliar MapTiler/Esri com chave depois); desenho de polígono fica para depois |
| Localização | expo-location, só com o app aberto | Evita a revisão mais rígida de localização em segundo plano |
| Avisos | Notificações locais (expo-notifications) agendadas no aparelho + tarefa em segundo plano (expo-background-task) a cada ~3 h | Sem servidor de push; id estável por evento evita repetição; silêncio 21 h–6 h, exceto temporal e geada forte |
| Assinatura | RevenueCat + Google Play Billing | Exige build de desenvolvimento (EAS), não roda no Expo Go |
| Offline | Última previsão e anotações guardadas no aparelho; sincroniza quando houver sinal | Campo tem sinal ruim |
| Cartão de chuva | react-native-view-shot + expo-sharing | Link no cartão leva à página do app com referência de origem |
| Monitoramento | Sentry (erros) e PostHog (retenção e funil) | A adicionar antes do teste fechado; exige atualizar a política de privacidade |

## 5. Dados (no aparelho)

Estado do app em `apps/mobile/src/lib/estado.ts`, salvo em SQLite (chave-valor):

| Item | Campos |
|---|---|
| Talhão | id, nome, lat, lon, cultura, data de plantio |
| Anotação de chuva | talhão, data, mm (uma por talhão e dia) |
| Ocorrência | talhão, data, tipo (granizo, geada, seca, excesso de chuva, outro), observação |
| Preferências de aviso | tipos ligados, horário do aviso de pulverização, silêncio |
| Limiares de pulverização | vento, rajada, ΔT, umidade, temperatura, horas sem chuva |
| Avisos | agendados e já entregues (para nunca repetir) |
| Assinatura | Pro ativo (espelho do RevenueCat) |

Caches (por célula de ~1 km): previsão (1 h), chuva estimada da safra (6 h), série histórica 1991–2020 (permanente). A chuva estimada nunca sobrescreve a anotada.

## 6. Cobrança

- **Grátis:** útil de verdade (semáforo do dia, previsão, pluviômetro, cartão, geada e temporal) para reter e espalhar.
- **Pro (hipótese a testar):** R$ 19,90/mês ou R$ 149,90/ano, 14 dias grátis. O anual protege contra cancelamento na entressafra.
- **Conta de equilíbrio:** custo de ~US$ 75/mês (≈ R$ 400). Com o anual rendendo ~R$ 127 líquido (loja fica com 15%), ~38 assinantes anuais cobrem a operação.

## 7. Crescimento sem time

1. **Loja (ASO):** título e descrição com "pulverização", "pluviômetro", "geada", "previsão do tempo agro"; capturas de tela mostrando o semáforo, não tabelas.
2. **Cartão de chuva:** cada anotação vira imagem pronta para o grupo de WhatsApp, com o nome do app e link.
3. **Conteúdo curto semanal:** "janela de pulverização da semana" por região (Reels/Shorts/TikTok), gerado a partir dos próprios dados.
4. **Grupos de produtores:** participar e compartilhar o cartão; micro-influenciadores do agro só se sobrar orçamento.
5. **Fase 2:** páginas web "quanto choveu em [município]" para captar busca (o tema clima é o mais buscado do Brasil) e levar ao app.

Momento: a safra 2026/27 começa com Super El Niño (chuva no Sul, veranicos no Centro-Oeste); dezembro a fevereiro é pico de aplicação de fungicida na soja.

## 8. Requisitos das lojas e LGPD

- **Google Play:** conta de desenvolvedor (US$ 25). Conta **pessoal** nova exige **teste fechado com 12 testadores por 14 dias seguidos** antes da produção; conta de **organização** (CNPJ) não tem essa exigência, mas o cadastro é mais lento.
- Política de privacidade publicada (URL), formulário de segurança de dados, classificação indicativa, permissão de notificação (Android 13+), localização só em primeiro plano.
- **Exclusão de conta dentro do app e por página web** (exigência do Google para apps com conta).
- LGPD: coordenadas dos talhões são dado pessoal; coletar só o necessário, explicar o uso, permitir exportar e apagar; servidores no Brasil.
- Texto fixo nas decisões: "estimativa a partir da previsão do tempo; confira as condições no local".
- iPhone (fase 2): conta Apple US$ 99/ano; se houver login com Google, oferecer também "Entrar com Apple".

## 9. Cronograma

| Semana | Datas | Entregas | Portão |
|---|---|---|---|
| S0 | 22–25/10 | Estrutura do projeto (feito); contas: Google Play, Expo/EAS, Supabase, Firebase, RevenueCat; domínio; site com lista de espera e política de privacidade; começar a recrutar 20 testadores | — |
| S1 | 26/10–01/11 | Talhões (mapa, pino, GPS); API de previsão com cache; tela Hoje (semáforo, janela seca, 7 dias); build de desenvolvimento | — |
| S2 | 02–08/11 | Pluviômetro (anotar, estimativa, acumulado vs média, calendário); cartão de chuva; detalhe 48 h; **iniciar teste fechado até 06/11** | **G0** |
| S3 | 09–15/11 | Avisos no celular (geada, temporal, janela de amanhã, janela seca); ajustes de aviso; conta e exclusão de dados | — |
| S4 | 16–22/11 | Assinatura e paywall; relatório PDF; limiares ajustáveis; Sentry e PostHog; ficha da loja | — |
| S5 | 23–29/11 | Fim dos 14 dias de teste (~20/11) → pedido de acesso à produção (análise do Google leva dias); correções; **publicação no Android até ~30/11** | **G1** |
| — | dez–jan | Crescimento e medição | **G2** (30 dias) |
| — | jan/2027 | Decidir iPhone e próximos recursos | **G3** (60 dias) |

O teste fechado começa cedo (S2) e o app continua sendo atualizado durante ele: o relógio de 14 dias corre em paralelo ao desenvolvimento.

## 10. Portões (como garantir o resultado)

Não dá para garantir vendas; dá para só investir a etapa seguinte quando a anterior provar valor, gastando pouco.

| Portão | Critério para seguir |
|---|---|
| **G0** — interesse (até 06/11) | ≥ 100 inscritos na lista de espera e ≥ 20 testadores confirmados. Se não, rever o posicionamento antes de construir mais |
| **G1** — teste fechado (14 dias) | ≥ 12 testadores ativos (exigência do Google); ≥ 50% abrem o app 3+ dias por semana; ≥ 99% das sessões sem travamento; ≥ 70% dizem que o semáforo bateu com o que viram no campo |
| **G2** — 30 dias publicado | Retenção D7 ≥ 25% e D30 ≥ 12%; ≥ 30% dos ativos anotam chuva toda semana; ≥ 10% compartilham o cartão; ≥ 1,5% das instalações viram assinatura |
| **G3** — 60 dias | Receita recorrente ≥ custo mensal → seguir e fazer iPhone; abaixo disso, ajustar preço/oferta uma vez ou parar |

As metas de G2 são referências de mercado para apps utilitários; serão recalibradas com os números reais do teste.

## 11. Custos

| Item | Valor |
|---|---|
| Google Play (uma vez) | US$ 25 |
| Open-Meteo comercial | US$ 29/mês a partir do lançamento |
| Supabase | grátis no início; US$ 25/mês ao crescer |
| Hospedagem do site/API (uso comercial) | ~US$ 20/mês |
| Expo EAS, RevenueCat, Sentry, PostHog | planos gratuitos no início (RevenueCat cobra 1% acima de US$ 2.500/mês) |
| Domínio | ~R$ 40/ano |
| Apple (fase 2) | US$ 99/ano |

Total no lançamento: ~US$ 50–75/mês, mais US$ 25 de entrada.

## 12. Riscos

| Risco | Mitigação |
|---|---|
| Produtor não paga por app | Grátis forte para reter; Pro focado no que dá dinheiro (janela hora a hora, avisos, relatório); testar preço cedo |
| Concorrência grátis (INMET, Climatempo, cooperativas) | Diferencial é decisão por talhão + pluviômetro social + relatório, não a previsão |
| Previsão errar | Mostrar motivo e probabilidade; regras conservadoras; avisar "confira no local" |
| Atraso na aprovação do Google | Teste fechado começa na S2; ficha da loja pronta na S4 |
| Sazonalidade | Plano anual; avisos de geada no inverno; trigo e safrinha mantêm uso no ano todo |
| Responsabilidade | O app fala de condições do tempo, nunca de produto ou dose |

## 13. Decisões pendentes (suas)

1. **Nome e identificador do app** — hoje `Grão Raiz` / `com.graoraiz.app`. O identificador não muda depois de publicado.
2. **Conta Google Play pessoal ou de empresa** (CNPJ) — muda a exigência do teste fechado.
3. **Domínio** do site (necessário para a política de privacidade).
4. **Preço inicial** do Pro.

## 14. Próximos passos imediatos

- [ ] Decidir os itens da seção 13.
- [ ] Criar as contas (Google Play, Expo, Supabase, Firebase, RevenueCat).
- [ ] Criar `apps/web` com lista de espera, política de privacidade, termos e página de exclusão de conta.
- [ ] Recrutar 20 testadores (grupos de produtores, conhecidos, revendas).
- [ ] Semana 1: talhões + API de previsão + tela Hoje.
