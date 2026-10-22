# Grão Raiz — app (Expo SDK 58)

App Android/iOS local-first: talhões, anotações e ajustes ficam no aparelho (SQLite); previsão e chuva estimada vêm do Open-Meteo (direto ou via `apps/web`); avisos são notificações locais reagendadas por uma tarefa em segundo plano; o relatório da safra é gerado em PDF no aparelho.

## Rodar

```bash
npm run start            # Expo; leia o QR com o Expo Go no celular
npm run typecheck
npm run lint
npm run e2e              # exporta a versão web e roda os testes ponta a ponta (Playwright)
npm run icones           # regera os ícones a partir de scripts/gerar-icones.ps1
```

## Onde fica cada coisa

| Caminho | Conteúdo |
|---|---|
| `src/app/(tabs)` | Abas Hoje, Chuva, Talhões, Ajustes |
| `src/app/*.tsx` | Apresentação, talhão, hora a hora, cartão de chuva, relatório, assinatura |
| `src/lib/estado.ts` | Estado do app e ações (persistido no aparelho) |
| `src/lib/dados-clima.ts` | Previsão, chuva estimada e média histórica, com cache e uso sem internet |
| `src/lib/avisos.ts` · `tarefa-fundo.ts` | Agendamento dos avisos e atualização em segundo plano |
| `src/lib/assinatura.ts` | RevenueCat (Pro) |
| `src/components` | Interface (`ui.tsx`), cartões de clima, calendário, mapa, formulário do talhão |
| `*.web.ts(x)` | Versões web simplificadas, usadas só nos testes no navegador |
| `e2e/` | Testes ponta a ponta com respostas falsas do Open-Meteo |

Configuração por variáveis de ambiente: veja `.env.example`. Publicação: `../../docs/PUBLICACAO.md`.
