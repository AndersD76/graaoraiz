# Passo a passo para publicar nas lojas

**Como usar:** faça na ordem e, a cada passo, mande o que está em **Me avise**. Diga o número do passo (ex.: "fiz o 2.3").

**Segurança:** nunca cole senha ou chave no chat. Quando um passo pede uma chave, salve no arquivo `apps/web/.env.local`, na linha indicada, e me avise. Eu leio de lá sem mostrar na tela.

**Prazo estimado:** Google, cerca de 3 semanas (o teste fechado obrigatório dura 14 dias). Apple, cerca de 1 semana depois da conta ativa.

---

## Etapa 1 — Decisões (hoje, 5 minutos)

**1.1 Pessoa física ou empresa (CNPJ)?**
- **Física:** mais rápido. Nas lojas aparece o seu nome como vendedor. No Google, obriga um teste fechado com 12 pessoas por 14 dias seguidos antes de publicar.
- **Empresa:** aparece o nome da empresa. Precisa do número D-U-N-S nas duas lojas (grátis, de alguns dias a 2 semanas). O Google dispensa o teste de 14 dias.

**1.2 Lançar grátis ou já cobrando?** Recomendo grátis, com todos os módulos liberados. A revisão fica mais simples e não precisa de banco nem impostos agora. A assinatura entra numa atualização.

**1.3 Responsável pelos dados** (aparece na política de privacidade): nome completo ou razão social, o CNPJ se for empresa, e cidade/UF.

**Me avise:** as três respostas.

---

## Etapa 2 — Domínio e e-mail (1 dia)

O graoraiz.com.br está à venda (não é seu) e o graoraiz.com já tem dono. Livres em 03/11: **graoraiz.app.br** (recomendo), graoraiz.app, graoraizapp.com.br e appgraoraiz.com.br.

1. **Registre** em [registro.br](https://registro.br): entra com CPF ou CNPJ, cerca de R$ 40 por ano.
2. **Crie uma conta grátis na Cloudflare** ([dash.cloudflare.com](https://dash.cloudflare.com)) → "Adicionar site" → seu domínio → plano Free. Ela mostra 2 servidores DNS.
3. **No registro.br**, abra o domínio → "Alterar servidores DNS" → troque pelos 2 da Cloudflare. A troca leva algumas horas.
4. **Na Cloudflare**: Email → Email Routing → crie `contato@seudominio` encaminhando para o seu Gmail. Confirme o e-mail que chegar.

**Me avise:** qual domínio e quando a Cloudflare mostrar "Ativo". Aí eu ligo o domínio ao servidor e te passo os registros de DNS para criar.

---

## Etapa 3 — E-mail do "esqueci a senha" (30 minutos, depois da etapa 2)

1. Crie uma conta em [resend.com](https://resend.com) (grátis até 3 mil e-mails por mês).
2. Domains → Add Domain → seu domínio. Ela mostra alguns registros DNS:
   - se aparecer o botão de configurar pela Cloudflare, use;
   - senão, crie cada um na Cloudflare (DNS → Add record), copiando tipo, nome e valor.
3. Clique em Verify até ficar "Verified".
4. API Keys → Create API Key (acesso "Sending"). Cole a chave (começa com `re_`) em `apps/web/.env.local`, na linha `RESEND_API_KEY=`.

**Me avise:** "Resend pronta". Eu coloco no servidor e testo o "esqueci a senha".

---

## Etapa 4 — Google Play (comece logo: o teste dura 14 dias)

1. **Crie a conta** em [play.google.com/console/signup](https://play.google.com/console/signup): US$ 25, uma vez só.
   - Escolha pessoal ou organização, conforme o 1.1.
   - Envie o documento de identidade.
   - Confirme o celular Android pelo app "Google Play Console". A aprovação pode levar alguns dias.
2. **Junte 15 a 20 testadores** com celular Android e anote o Gmail de cada um. O Google exige 12 ativos por 14 dias seguidos; com folga, ninguém que desista derruba o teste. O grupo do convite é um bom lugar.
3. **Com a conta aprovada**, crie o app: Criar app → nome "Grão Raiz", Português (Brasil), App, Gratuito. Aceite as declarações.
4. **Registre o pacote `com.graoraiz.app`**, se o console pedir. Pela regra nova do Google, desde setembro de 2026 o Android no Brasil só instala app de desenvolvedor verificado, inclusive o APK de teste.

**Me avise:** conta aprovada, app criado e a lista de e-mails dos testadores. Então eu gero o pacote (.aab) e te guio no envio, que da primeira vez precisa ser à mão, e na criação do teste fechado.

---

## Etapa 5 — Apple

O projeto já tem um Apple ID (daniel.anders@brturbo.com.br) e um Team ID (53JA8M2JRZ) configurados.

1. **Confira a assinatura**: entre em [developer.apple.com/account](https://developer.apple.com/account) com esse Apple ID e veja se o Apple Developer Program está ativo.
   - Se não estiver, inscreva-se (US$ 99 por ano), de preferência pelo app "Apple Developer" no iPhone, que verifica a identidade mais rápido.
   - Para empresa, peça antes o D-U-N-S em [developer.apple.com/enroll/duns-lookup](https://developer.apple.com/enroll/duns-lookup).
2. **Gere a chave de acesso**: em [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → Usuários e acesso → Integrações → API do App Store Connect → gere uma chave com acesso "Admin".
   - Baixe o arquivo `.p8`; só dá para baixar uma vez.
   - Guarde numa pasta fora do projeto, ex.: `C:\chaves\`.
   - Anote o Key ID e o Issuer ID, que aparecem na mesma tela.
   - Com essa chave, eu crio o app, os certificados e as versões de teste sem pedir a sua senha.

**Me avise:** se a assinatura está ativa, o caminho do arquivo `.p8`, o Key ID e o Issuer ID. Esses dois IDs podem ir no chat; o arquivo, não.

---

## Etapa 6 — Licenças e segurança (em paralelo)

1. **Satélite (Esri):** crie uma conta grátis no [ArcGIS Location Platform](https://location.arcgis.com). Gere uma chave de API com acesso a "Basemaps" e cole em `apps/web/.env.local`, numa linha nova `ARCGIS_API_KEY=`.
2. **Previsão (Open-Meteo):** enquanto o app for grátis e sem anúncio, o plano gratuito atende. Quando começar a cobrar, contrate o plano comercial ([open-meteo.com/en/pricing](https://open-meteo.com/en/pricing), cerca de US$ 29 por mês) e cole a chave em `OPEN_METEO_API_KEY=`.
3. **Preços (Cepea):** peça autorização para mostrar os indicadores no app, pelo "Fale conosco" do site do Cepea. Eu escrevo o texto se quiser.
4. **Senha do banco (Neon):** ela apareceu no histórico antigo do git, então troque.
   - Em [console.neon.tech](https://console.neon.tech) → projeto → Roles → resetar a senha.
   - Copie a nova connection string para `apps/web/.env.local`, na linha `DATABASE_URL=`.

**Me avise:** quando cada chave estiver salva e quando o Cepea responder. Na troca da senha do banco, eu atualizo o servidor na hora.

---

## Etapa 7 — Teste no seu celular

Quando eu avisar, instale o APK de teste pelo link que eu mandar e confira:
- [ ] entrar, criar conta e usar sem conta;
- [ ] marcar o talhão pelo GPS e desenhar o contorno;
- [ ] previsão, "O vigia diz" e a cidade no topo;
- [ ] permitir avisos e receber uma notificação (dá para forçar baixando o limite de geada em Ajustes);
- [ ] satélite, EUDR e crédito, dossiê em PDF e compartilhar no WhatsApp;
- [ ] foto de ocorrência pela câmera;
- [ ] fechar o app, abrir no dia seguinte e ver se atualizou.

**Me avise:** print de tudo que der errado ou estranho.

---

## Etapa 8 — Envio e revisão (eu preparo, você clica)

**Google:**
1. Subir o .aab no teste fechado, colar os e-mails dos testadores e mandar a eles o link de participação. Eles aceitam e instalam.
2. Preencher o "Conteúdo do app": privacidade, segurança dos dados, classificação, público-alvo. Eu te passo cada resposta.
3. Depois de 14 dias, "Solicitar acesso à produção". O Google faz perguntas sobre o teste; eu te ajudo a responder.

**Apple:** capturas, textos e rótulos de privacidade (eu te passo), teste no TestFlight e envio para revisão, com a conta de demonstração nas notas ao revisor.

---

## O que eu faço enquanto isso

- [ ] "Usar sem conta" (conta opcional) e textos de Ajustes corretos.
- [ ] Política de privacidade e página de exclusão de conta atualizadas (conta, nuvem, PRODES/CAR, IBGE, servidores nos EUA).
- [ ] App das lojas apontando para o servidor e o domínio novo, versão 1.0.0, texto da localização precisa no iPhone.
- [ ] Ficha das lojas, formulários de privacidade e notas ao revisor.
- [ ] Capturas de tela do iPhone e do Android e imagem de destaque do Google.
- [ ] APK de teste para a etapa 7.
