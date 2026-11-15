# Relatório: motor de conversão

Data: 14/11/2026 · Branch: `crescimento-qualidade` · Diagnóstico completo em [`funil-diagnostico.md`](funil-diagnostico.md)

## Resumo

Antes, o funil não era medido em nenhum ponto. E não existe como pagar na web.

O que foi feito:

- **Medição do funil inteiro** no próprio banco, sem empresa de fora e sem dado pessoal.
- **Origem de cada cadastro:** primeiro e último link de entrada.
- **Painel do funil.**
- **Página pública por anúncio**, com a prévia certa no WhatsApp.
- **Correções de atrito e de segurança** nos fluxos de conta.

O próximo salto de receita depende de uma decisão sua: o provedor de pagamento.

## Linha de base real (banco de produção, 14/11/2026)

| Indicador | Valor |
|---|---|
| Contas reais (sem a de demonstração) | 1 |
| Contas com dados de lavoura salvos | 2 (inclui a de demonstração) |
| Anúncios de máquinas | 0 |
| Vendas registradas | 0 |
| Avaliações da versão de teste | 0 |

Com esse volume, **não há como fazer teste A/B**: nenhum experimento chega a um resultado confiável. As primeiras semanas devem ser usadas para trazer gente (WhatsApp, grupos de produtores, cooperativas) e olhar o funil a cada semana.

## O que foi implementado

| Item | Onde |
|---|---|
| 13 eventos `objeto_ação`, com lista fechada. Os de dinheiro e conta nascem no servidor; os de uso, no app via `POST /api/eventos`. | `lib/telemetria.ts`, `app/api/eventos/`, `apps/mobile/src/lib/eventos.ts` |
| Momento aha medido: a primeira previsão do próprio talhão, uma vez por aparelho | `apps/mobile/src/app/(tabs)/index.tsx` |
| Atribuição de primeiro e último toque (UTM, referrer e página de entrada), gravada no navegador e salva no cadastro | `app/layout.tsx`, `apps/mobile/src/lib/atribuicao.ts`, `app.conta.origem` |
| Painel `/painel/funil?chave=…` com:<br>- funil semanal das últimas 8 semanas;<br>- origem dos cadastros;<br>- crawlers de IA;<br>- IndexNow | `app/painel/funil/page.tsx` |
| Link do anúncio compartilhado leva à página pública, com foto, preço e cidade na prévia | `apps/mobile/src/lib/maquinas.ts`, `app/maquinas-usadas/[id]` |
| Página pública do anúncio com a resposta direta, ficha técnica, dicas de segurança, parecidos e botão "Falar com o vendedor" | `app/maquinas-usadas/[id]/page.tsx` |
| Política de privacidade passou a explicar a medição de uso e a origem do cadastro, com base legal e prazo | `app/privacidade/page.tsx` |
| Padrão de UTM para divulgação | [`utm.md`](utm.md) |

Taxonomia completa: [`eventos.md`](eventos.md).

## Pagamento na web: comparação

**Regras para escolher:**
- Funcionar com **pessoa física**.
- Ter **Pix**.
- Ter **assinatura recorrente**.
- Ter **webhook com verificação de autenticidade**.

Taxas conferidas em 14/11/2026 em páginas públicas. Elas mudam e podem ser negociadas: **confirme no painel de cada um antes de decidir**.

| | Mercado Pago | Asaas | Stripe |
|---|---|---|---|
| Pix | 0,99% por recebimento online (página oficial de tarifas) | R$ 1,99 por Pix recebido; R$ 0,99 nos 3 primeiros meses (tabela pública) | 1,19%, **só por convite** (fonte de terceiro, citando a tabela da Stripe) |
| Cartão de crédito | 4,98% para receber na hora; menos se esperar 14 ou 30 dias (página oficial) | R$ 0,49 + 2,99% à vista (tabela pública; contrato pode mudar) | 3,99% + R$ 0,39 (fonte de terceiro, citando a tabela da Stripe) |
| Assinatura recorrente | Sim (planos de assinatura); taxa específica: **TODO-VALIDAR** | Sim (boleto, cartão e Pix por fatura) | Sim (Stripe Billing) |
| Pix Automático (débito recorrente) | **TODO-VALIDAR** | **TODO-VALIDAR** | **TODO-VALIDAR** |
| Conta de pessoa física (CPF) | Sim | **TODO-VALIDAR** | **TODO-VALIDAR** |
| Webhook verificável | Assinatura HMAC no cabeçalho `x-signature` | Token de acesso no cabeçalho, definido por você | Assinatura com segredo (`Stripe-Signature`) |
| Cobrar a comissão do vendedor | Link ou cobrança Pix | Cobrança Pix ou boleto pela API | Link de pagamento ou fatura |

Fontes:
- [Mercado Pago: tarifas](https://www.mercadopago.com.br/developers/pt/support/taxas-de-servico-para-transacoes_37740)
- [Mercado Pago: tabela](https://www.mercadopago.com.br/knowledge-hub/tabela-taxas-tarifas_45243)
- [Asaas: preços e taxas](https://www.asaas.com/precos-e-taxas)
- [Stripe: Pix](https://stripe.com/payment-method/pix)
- [Calculadora Sellfy (preços da Stripe Brasil)](https://sellfy.com/pt/ferramentas/calculadora-de-taxas-do-stripe/)

**Recomendação: Mercado Pago ou Asaas.**
- Os dois aceitam Pix e assinatura.
- Têm o Pix mais barato para valores pequenos.
- O Mercado Pago aceita pessoa física e é conhecido do produtor.
- A Stripe só compensa se a cobrança internacional importar; o Pix nela é por convite.

**Como entra no código (depois da sua escolha):**
1. `POST /api/pagamento/assinar` cria a assinatura no provedor e devolve o link. Evento `checkout_started`.
2. `POST /api/pagamento/webhook`:
   - confere a assinatura do provedor;
   - grava o id do evento numa tabela com chave única (idempotência);
   - só então libera o Pro e registra `payment_succeeded`, `subscription_renewed` ou `subscription_canceled`.
   - **Nenhuma** liberação do Pro pode vir do navegador.
3. **Comissão:** quando o vendedor marca "vendi", o servidor cria uma cobrança Pix da comissão. O webhook marca como paga, no lugar do botão manual do painel.
4. **Nos apps das lojas,** a assinatura continua pela Google Play e pela App Store (RevenueCat). As regras das lojas para pagamento fora delas: **TODO-VALIDAR** antes de mostrar o link da web dentro do app.

## Outras ações pendentes (precisam de chave ou decisão sua)

| Ação | Por quê | O que fazer |
|---|---|---|
| **Resend (e-mail)** | Sem a chave, o "esqueci a senha" não funciona em produção. Hoje responde "indisponível" igual para todos, sem revelar quem tem conta. | Criar a conta, verificar o domínio `appgraoraiz.com.br` e definir `RESEND_API_KEY` e `EMAIL_REMETENTE` no Railway. Depois dá para mandar o e-mail de boas-vindas e o lembrete de quem criou conta e não cadastrou talhão. |
| **E-mail de contato** | O rodapé mostra `contato@graoraiz.com.br`, que não funciona. | Criar o e-mail e definir `NEXT_PUBLIC_CONTATO_EMAIL`. |
| **PostHog (gravação de sessão e experimentos)** | Útil quando houver volume. Grava a tela da pessoa: exige consentimento (LGPD) e um aviso de cookies. | Ainda não. Rever quando passar de algumas centenas de contas por mês. A medição própria já cobre o funil. |
| **Login com Google ou link mágico** | Tira a senha do caminho, que é o maior atrito do cadastro no celular. | Depende do e-mail (link mágico) ou de um cliente OAuth do Google. |
| **Prova social** | Depoimentos e número de produtores convencem, mas não podem ser inventados. | Entram quando houver avaliações reais em `/avaliacoes`. |
| **Limpeza dos eventos com mais de 24 meses** | Prazo declarado na política de privacidade. | Rotina simples quando a tabela tiver um ano; não há dado antigo hoje. |

## Experimentos para quando houver volume (ordem sugerida)

Cada um com hipótese, métrica e critério de parada; nenhum roda com menos de 100 pessoas por versão.

1. **Chamada para a conta na tela Hoje** (que já abre sem login com o tempo de onde a pessoa está).
   - Testar o texto do botão pelo benefício ("Receba o aviso de geada do seu talhão") contra o atual.
   - Métrica: `signup_completed` / `app_opened`.
   - Os dados continuam só na conta, no Neon, como você decidiu.
2. **Anunciar em 3 passos com foto primeiro.**
   - Métrica: `listing_created` / visitas à tela de anunciar.
3. **Cartão da chuva no WhatsApp com link UTM.**
   - Métrica: cadastros com `utm_source=whatsapp`.

## Riscos

- **Pouco volume:** qualquer número semanal oscila muito. Olhe a tendência em 4 semanas, não a variação de uma.
- **Sem pagamento, não há receita da assinatura na web.** A comissão continua manual até o provedor entrar.
- **Medição só do lado do app para alguns eventos** (aha, avisos): bloqueadores e falhas de rede perdem uma parte. Os eventos de dinheiro são todos do servidor.
