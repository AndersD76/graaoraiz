# Eventos do funil (objeto_ação)

Tabela: `app.evento` no Neon (`id, nome, origem, conta_id, sessao, pagina, propriedades jsonb, criado_em`). Ela é migrável para um serviço central com `INSERT ... SELECT`.

**Regras:**
- Sem e-mail, senha, WhatsApp ou CPF nas propriedades.
- `conta_id` é apagado (`on delete set null`) quando a conta é excluída.

| Evento | Onde nasce | Propriedades | Etapa |
|---|---|---|---|
| `app_opened` | app (abertura) | plataforma | visita |
| `signup_completed` | **servidor** (`/api/conta/cadastro`) | primeiro, ultimo (atribuição) | cadastro |
| `login_succeeded` | **servidor** (`/api/conta/entrar`) | demo | retorno |
| `field_created` | app (onboarding e novo talhão) | primeiro, cultura, plataforma | onboarding |
| `aha_reached` | app (1ª previsão do próprio talhão, uma vez por aparelho) | plataforma | **momento aha** |
| `alerts_enabled` | app (permissão de notificação concedida) | plataforma | ativação |
| `listing_viewed` | app (tela do anúncio) | anuncio | classificados |
| `listing_created` | **servidor** | anuncio, categoria, preco, uf | classificados |
| `seller_contacted` | **servidor** (pedido do WhatsApp) | anuncio | classificados |
| `listing_sold` | **servidor** | anuncio, valor, comissao | receita (comissão) |
| `feedback_submitted` | **servidor** (`/api/avaliacao`) | nota, origem | satisfação |
| `crawler_ai_hit` | **servidor** (`proxy.ts`, pelo user-agent) | bot | visibilidade em IA |
| `indexnow_sent` | **servidor** | status ou erro, urls | indexação |

**Atribuição:**
- `app.conta.origem` guarda `{ primeiro, ultimo }` com `utm_*`, `referrer`, `landing` e `em`.
- O primeiro toque é gravado no navegador na primeira visita, tanto nas páginas públicas do site quanto no app. O último muda quando a pessoa volta por outro link.
- Os dois só vão ao servidor se a pessoa criar conta.

**Ainda não existe:** `checkout_started`, `payment_succeeded`, `subscription_renewed` e `subscription_canceled`. Dependem do provedor de pagamento e devem nascer do webhook.
