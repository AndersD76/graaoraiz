# Publicação na Google Play e na App Store

Guia prático para levar o app `apps/mobile` às duas lojas usando o EAS (builds na nuvem da Expo; não precisa de Mac nem de Android Studio).

## 1. O que já está pronto no código

- App com identificador `com.graoraiz.app` (Android e iOS), ícone, tela de abertura e nome "Grão Raiz".
- Permissões mínimas: localização só com o app aberto (com texto de justificativa no iPhone), notificações locais; localização em segundo plano e microfone bloqueados.
- Declaração de criptografia isenta no iPhone (`usesNonExemptEncryption: false`).
- Assinatura via RevenueCat com tela de planos, renovação/cancelamento explicados, restaurar compras e links de termos e privacidade (exigências das duas lojas).
- Exclusão de dados dentro do app (Ajustes → Apagar todos os meus dados).
- Atribuição dos dados meteorológicos (Open-Meteo, CC BY 4.0).
- `eas.json` com perfis `development`, `preview` e `production`; número de build incrementado automaticamente.
- Textos da ficha das lojas em [LOJA.md](LOJA.md).

## 2. O que só você pode fazer

| # | Conta / chave | Para quê | Custo |
|---|---|---|---|
| 1 | **Expo** (expo.dev) | Builds e envio às lojas pelo EAS | grátis no início |
| 2 | **Google Play Console** | Publicar no Android | US$ 25 uma vez |
| 3 | **Apple Developer Program** | Publicar no iPhone | US$ 99 por ano |
| 4 | **Domínio + site publicado** (`apps/web`) | Política de privacidade, termos e exclusão de dados (exigidos pelas lojas) | ~R$ 40/ano + hospedagem |
| 5 | **RevenueCat** + produtos de assinatura nas duas lojas | Cobrança do Pro | grátis até US$ 2,5 mil/mês |
| 6 | **Open-Meteo comercial** (no servidor `apps/web`) | Uso comercial da previsão | US$ 29/mês |

O mapa é open-source (MapLibre + OpenFreeMap/OpenStreetMap): não precisa de chave do Google Maps.

Conta pessoal ou de empresa:
- **Google Play pessoal:** exige teste fechado com **12 testadores por 14 dias seguidos** antes de liberar a produção.
- **Google Play organização (CNPJ):** não exige esse teste, mas pede número D-U-N-S e verificação da empresa.
- **Apple empresa:** também pede D-U-N-S; pessoa física é mais rápida.

## 3. Testar localmente (antes de qualquer loja)

1. **Testes automáticos** (na raiz do projeto):
   - `npm test` — regras de clima.
   - `npm run e2e -w @graoraiz/mobile` — fluxos completos do app no navegador, com capturas em `apps/mobile/e2e/capturas`.
2. **No seu celular, pelo Expo Go** (mesma rede Wi‑Fi do computador):
   - Instale o app **Expo Go** (Play Store ou App Store).
   - Na raiz do projeto rode `npm run app` e leia o QR code (Android: pelo Expo Go; iPhone: pela câmera).
   - No Expo Go a assinatura roda em modo de demonstração (sem cobrança real); o resto funciona: mapa, GPS, previsão, chuva, avisos.
3. **Build de desenvolvimento** (igual ao app da loja, inclusive compras reais em teste):
   ```bash
   cd apps/mobile
   npx expo install expo-dev-client
   npx eas-cli@latest build --profile development --platform android
   npx expo start --dev-client
   ```

## 4. Configuração inicial do EAS

```bash
npm install -g eas-cli        # ou use npx eas-cli@latest em cada comando
cd apps/mobile
eas login
eas init                      # cria o projeto na Expo e mostra o projectId
```

Cadastre em expo.dev → projeto → **Environment variables** (para development, preview e production):

| Variável | Valor |
|---|---|
| `EAS_PROJECT_ID` | o id mostrado pelo `eas init` |
| `EXPO_PUBLIC_SITE_URL` | endereço do site publicado |
| `EXPO_PUBLIC_API_URL` | endereço do `apps/web` publicado (para a previsão passar pelo servidor com a chave comercial) |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` / `_IOS_KEY` | chaves públicas do RevenueCat |

## 5. Android (Google Play)

1. No Play Console: **Criar app** → nome "Grão Raiz", idioma português (Brasil), app gratuito com compras.
2. Preencha **Conteúdo do app** com os dados de [LOJA.md](LOJA.md):
   - política de privacidade (URL do site);
   - acesso ao app (sem login);
   - anúncios (não);
   - classificação do conteúdo;
   - público-alvo (18+);
   - segurança dos dados;
   - app de notícias (não).
3. Gere o pacote:
   ```bash
   eas build --platform android --profile production
   ```
4. **A primeira versão precisa ser enviada à mão:** baixe o `.aab` no expo.dev e envie em **Testes → Teste interno** (o Google só aceita envio automático depois do primeiro manual).
5. Crie os produtos de assinatura em **Monetizar → Assinaturas** (ex.: `pro_mensal`, `pro_anual`, com teste grátis de 14 dias) e ligue-os no RevenueCat (entitlement `pro`, oferta `default` com pacotes mensal e anual).
6. **Teste fechado** com pelo menos 12 testadores por 14 dias (conta pessoal) → depois, **Solicitar acesso à produção**.
7. Próximas versões:
   ```bash
   eas build --platform android --profile production --auto-submit
   ```
   O envio vai para a faixa interna como rascunho, conforme `eas.json`.

## 6. iPhone (App Store)

1. No App Store Connect: **Meus apps → Novo app**, plataforma iOS, nome "Grão Raiz: Clima no Campo", idioma português (Brasil), bundle ID `com.graoraiz.app`.
2. Gere e envie:
   ```bash
   eas build --platform ios --profile production
   eas submit --platform ios
   ```
   O EAS cria os certificados e o perfil de distribuição na primeira vez.
3. Teste pelo **TestFlight** (até 10 mil testadores externos, com revisão rápida da Apple).
4. Crie as assinaturas em **Recursos → Compras no app → Assinaturas** (mesmo grupo, mensal e anual) e ligue no RevenueCat com a chave de compras no app (In‑App Purchase Key).
5. Preencha os metadados de [LOJA.md](LOJA.md):
   - capturas de 6,9″ (1320×2868 px);
   - rótulos de privacidade;
   - classificação 4+;
   - links de privacidade e termos (EULA) na descrição;
   - notas para o revisor.
6. Envie para revisão.

## 7. O que costuma reprovar (e como o app atende)

| Motivo comum | Situação |
|---|---|
| Sem política de privacidade acessível | Link em Ajustes e na tela de assinatura; URL na ficha |
| Assinatura sem preço/período/renovação claros | Tela de planos mostra preço da loja, período, renovação automática e como cancelar |
| Sem "Restaurar compras" | Botão na tela de assinatura e em Ajustes |
| Permissão sem justificativa | Texto de localização no iPhone; pedido de notificação com explicação antes |
| Localização em segundo plano sem necessidade | Bloqueada |
| Dados de terceiros sem atribuição | Rodapé com Open-Meteo (CC BY 4.0) |
| Promessa de precisão | Avisos de que é estimativa; confira no local |
| Funcionalidade mínima / app "vazio" | Semáforo, previsão, pluviômetro, avisos e relatório |

## 8. Checklist final antes de enviar

- [ ] Site publicado com `/privacidade`, `/termos`, `/excluir-dados` e responsável preenchido.
- [ ] Variáveis do EAS cadastradas (seção 4).
- [ ] Mapa carregando no aparelho (precisa de internet; atribuição OpenStreetMap visível).
- [ ] Produtos de assinatura ativos nas duas lojas e no RevenueCat (entitlement `pro`).
- [ ] Testes automáticos passando (`npm test` e `npm run e2e -w @graoraiz/mobile`).
- [ ] Teste em aparelho real: talhão, previsão, anotação de chuva, cartão, aviso de geada (dá para forçar mudando os limites), compra de teste e restauração.
- [ ] Capturas de tela tiradas de aparelho real (ver [LOJA.md](LOJA.md)).
