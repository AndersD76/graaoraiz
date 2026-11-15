# Diagnóstico do funil de conversão: Grão Raiz

Data: 14/11/2026 · Modelo: freemium (Pro R$ 29,90/mês ou R$ 249,90/ano, hoje liberado de graça na web) + comissão de 3% nos classificados de máquinas.

## O funil real, tirado do código

```
Busca/WhatsApp/rede social
  → página de entrada
      ├─ / (app no navegador): Hoje mostra o tempo de onde a pessoa está, sem conta
      └─ /maquinas-usadas/<id> (nova página pública)
  → CTA: "Cadastre seu talhão", "Anunciar máquina", "Falar com o vendedor"
  → cadastro (/entrar: nome, e-mail, senha)        [conta só é pedida para talhão, anúncio e contato]
  → onboarding: desenhar/marcar o talhão + cultura → pedido de avisos
  → MOMENTO AHA: a previsão e o "vigia diz" do próprio talhão
  → oferta: assinatura Pro (paywall)                [na web, Pro liberado: não há cobrança]
  → classificados: anunciar (grátis) → contato pelo WhatsApp → venda → comissão (PIX manual)
```

## Fricções, priorizadas por ICE (impacto × confiança × facilidade, 1–10)

| # | Fricção | I | C | F | ICE | Situação |
|---|---|---|---|---|---|---|
| 1 | **Não há como pagar na web**: nenhum provedor (Pix, cartão). A receita da assinatura só existe nas lojas, que ainda não estão no ar. | 10 | 9 | 4 | 360 | Pendente: escolher provedor (comparação no RELATORIO-CONVERSAO.md) |
| 2 | Nenhuma medição: não dava para saber quantos visitantes viram conta, nem de onde vinham. | 9 | 10 | 8 | 720 | **Corrigido:** eventos do funil em `app.evento` + atribuição no cadastro |
| 3 | Link de anúncio compartilhado caía na SPA sem prévia (foto e preço não apareciam no WhatsApp). | 7 | 8 | 9 | 504 | **Corrigido:** link para a página pública com Open Graph do anúncio |
| 4 | Cadastro sem login social nem link mágico; só e-mail e senha. | 6 | 7 | 5 | 210 | Pendente (exige conta Google OAuth e e-mail transacional) |
| 5 | "Esqueci a senha" sem e-mail em produção (Resend sem chave). | 7 | 9 | 8 | 504 | Pendente: chave da Resend (ação manual) |
| 6 | Comissão cobrada à mão: o vendedor marca "vendi" e o PIX é combinado pelo WhatsApp. | 6 | 7 | 5 | 210 | Pendente: cobrança automática junto com o provedor de pagamento |
| 7 | Sem prova social (depoimentos, número de produtores). | 5 | 6 | 7 | 210 | Não dá para inventar: entra quando houver avaliações reais (painel /avaliacoes) |
| 8 | E-mail de contato do rodapé no domínio antigo (contato@graoraiz.com.br não funciona). | 6 | 10 | 9 | 540 | Pendente: definir o e-mail real (NEXT_PUBLIC_CONTATO_EMAIL) |

## Eventos: o que existia e o que foi criado

Antes: nenhum evento de produto. Só os registros técnicos do Railway.

Agora: taxonomia em [`eventos.md`](eventos.md). O cadastro, o anúncio, o contato, a venda e a avaliação são registrados **no servidor**, que é a fonte de verdade. O que só o app vê (abriu, talhão criado, aha, avisos, anúncio visto) vai por `POST /api/eventos`, com lista fechada de nomes. Painel em `/painel/funil?chave=…`.

## Lacunas que continuam

- Compra: não existe evento `payment_succeeded` porque não existe cobrança na web. Ele deve nascer do webhook do provedor, validado por assinatura e idempotente.
- Session replay e experimentos (PostHog): dependem da sua aprovação de chave e de consentimento LGPD.
