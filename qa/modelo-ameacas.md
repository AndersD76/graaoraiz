# Modelo de ameaças (STRIDE): Grão Raiz

## Ativos mais valiosos

1. **WhatsApp e nome dos vendedores:** dado pessoal de produtores, alvo de coleta para spam e golpe.
2. **Registros de venda e comissão:** receita do negócio.
3. **Contas e dados da lavoura:** localização e contorno das propriedades, caderno, seguro.
4. **Chave do painel e `AUTH_SECRET`:** quem tem, administra ou se passa por qualquer conta.
5. **Credenciais do banco (Neon):** a senha antiga ficou no histórico do git e precisa ser trocada.

## Pontos de entrada

API pública (`/api/*`), páginas públicas, painéis com chave na URL, app web no navegador, e chamadas a serviços externos (INPE, CAR, IBGE, Open-Meteo, Cepea).

## STRIDE por componente

| Componente | Ameaça | Tipo | Proteção atual | Risco que resta |
|---|---|---|---|---|
| Login e cadastro | Força bruta e enumeração de e-mails | Falsificação | 10 erros/15 min por e-mail; recuperação com resposta idêntica; **novo:** cadastro 10/h por IP | Limite em memória, por instância: some ao reiniciar (aceitável com 1 instância) |
| Token de sessão | Token forjado ou alterado | Falsificação / elevação | HMAC-SHA256 com `AUTH_SECRET` ≥ 32 caracteres, comparação em tempo constante, expira em 180 dias | Validade longa e sem revogação no logout (o token vale até expirar): encurtar para 30 dias com renovação automática; não fica em cookie (sem CSRF) |
| Anúncios | Editar ou vender anúncio de outro (IDOR) | Adulteração | Toda mutação filtra `conta_id = token` no SQL | — |
| Anúncios | Mudar comissão, situação ou dono pelo corpo (mass assignment) | Elevação | Esquema zod com lista fechada de campos; comissão vem do servidor | — |
| Contato do vendedor | Coletar os WhatsApps de todos os anúncios | Vazamento | Exige conta não demo e registra quem pediu; **novo:** 30/h por conta | Várias contas falsas: o limite de cadastro por IP ajuda |
| Fotos | Upload de arquivo malicioso ou gigante | Adulteração / DoS | Confere bytes JPEG/WebP, ≤ 900 KB, 60/h por conta, fica no banco (fora do disco) | — |
| Páginas públicas | XSS por texto do anúncio | Adulteração | React escapa o texto; JSON-LD com `<` escapado (testado) | — |
| Consultas externas (PRODES/CAR, IBGE, clima) | Abuso para esgotar cota ou derrubar o servidor | DoS | **Novo:** limites por IP no `proxy.ts`; cache de 12 h na checagem | Sem limite global entre instâncias |
| API | Chamada de outro site no navegador do usuário | Falsificação | **Novo:** `proxy.ts` recusa Origin desconhecida; token não está em cookie | — |
| Painéis | Chave vazando pela URL (histórico, referrer) | Vazamento | `timingSafeEqual`; **novo:** `Referrer-Policy: no-referrer`, `noindex`, bloqueio no robots | Chave continua na URL: trocar por login de admin no futuro |
| Site | Clickjacking e sniffing de tipo | Adulteração | **Novo:** `X-Frame-Options`, `frame-ancestors 'self'`, `nosniff`, HSTS | CSP completa (script/style) pendente |
| Webhooks de pagamento | Webhook falso ou repetido | Falsificação / repúdio | Não existe cobrança na web ainda | Ao criar: assinatura + idempotência obrigatórias |
| Banco | Senha antiga no histórico do git | Vazamento | — | **Trocar a senha do Neon** |
| Registros (logs) | Dado pessoal nos logs | Vazamento | Logs só com mensagem de erro; eventos sem e-mail/WhatsApp | Teste automático de varredura de logs pendente |
