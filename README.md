# Grão Raiz

App de clima para o campo: diz se dá para pulverizar, colher ou entrar com máquina hoje, em cada talhão, guarda a chuva da safra e avisa geada e temporal.

- Plano do produto: [docs/PLANO.md](docs/PLANO.md)
- Publicação nas lojas: [docs/PUBLICACAO.md](docs/PUBLICACAO.md)
- Textos da ficha das lojas: [docs/LOJA.md](docs/LOJA.md)

## Estrutura

| Pasta | O que é |
|---|---|
| `apps/mobile` | App Android/iOS em Expo (SDK 58), local-first: dados no aparelho, avisos locais, PDF no aparelho |
| `apps/web` | Site (landing com lista de espera, privacidade, termos, exclusão de dados) e API que repassa o Open-Meteo com cache |
| `packages/clima` | Regras de decisão climática em TypeScript puro, com testes |
| `docs` | Plano, publicação e ficha das lojas; `docs/legado` guarda planos antigos |
| `legado/web-v0` | Versão web anterior (rastreabilidade/EUDR), só para referência; também na tag `legado-web-v0` |

## Comandos (na raiz)

```bash
npm install                          # instala todo o monorepo
npm test                             # testes das regras de clima
npm run typecheck                    # tipos de todos os pacotes
npm run lint                         # lint de todos os pacotes
npm run app                          # app no Expo (leia o QR com o Expo Go)
npm run e2e -w @graoraiz/mobile      # testes ponta a ponta do app no navegador (capturas em apps/mobile/e2e/capturas)
npm run dev -w @graoraiz/web         # site em http://localhost:3000
```

No app, novas bibliotecas entram com `npx expo install <pacote>` dentro de `apps/mobile`, para manter versões compatíveis com o SDK.

Variáveis de ambiente: `apps/mobile/.env.example` e `apps/web/.env.example`.
