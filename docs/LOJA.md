# Ficha das lojas — textos prontos

## Google Play

**Nome do app** (até 30): `Grão Raiz: clima p/ pulverizar`

**Descrição curta** (até 80): `Saiba se dá para pulverizar hoje, anote a chuva e receba aviso de geada.`

**Categoria:** Clima · **Tags:** agricultura, previsão do tempo, chuva

**Descrição completa:**

> O Grão Raiz responde o que importa no campo: dá para pulverizar hoje? Quando vem tempo firme para colher? Vai gear esta noite?
>
> **Semáforo de pulverização**
> Verde, amarelo ou vermelho para cada hora, com o melhor horário do dia e o motivo quando não dá. O app considera o vento na altura da barra (convertido do vento dos modelos), as rajadas, o delta T, a umidade, a temperatura e a chuva nas horas seguintes à aplicação.
>
> **Por talhão, não por cidade**
> Marque suas lavouras no mapa de satélite ou pela localização do celular. A previsão é feita para o ponto de cada talhão.
>
> **Colheita e máquinas**
> Veja a próxima janela de tempo firme (dias seguidos sem chuva) para colher ou entrar com máquina.
>
> **Pluviômetro no celular**
> Anote a chuva em dois toques. Nos dias sem anotação, o app estima a chuva com dados meteorológicos. Acompanhe o acumulado da safra comparado com a média histórica e compartilhe o cartão de chuva no grupo do WhatsApp.
>
> **Avisos no celular**
> Risco de geada na tarde anterior e de temporal com algumas horas de antecedência, mesmo com o app fechado.
>
> **Grão Raiz Pro**
> Talhões ilimitados, pulverização hora a hora para 48 horas, aviso na véspera quando houver janela de pulverização, aviso de tempo firme e de veranico, limites ajustáveis e relatório da safra em PDF para Proagro, seguro e banco. Assinatura mensal ou anual com 14 dias grátis; cancele quando quiser na Google Play.
>
> **Sem cadastro.** Seus talhões e anotações ficam no seu celular.
>
> O app mostra estimativas a partir de modelos meteorológicos e não recomenda produtos nem doses: confira as condições no local e siga a orientação do seu agrônomo.
>
> Dados meteorológicos: Open-Meteo.com (CC BY 4.0).

**Contato:** e-mail de suporte, site e URL da política de privacidade (`/privacidade`).

### Segurança dos dados (formulário do Play Console)

| Pergunta | Resposta |
|---|---|
| O app coleta ou compartilha dados do usuário? | Sim (coleta) |
| Dados criptografados em trânsito? | Sim (HTTPS) |
| O usuário pode pedir exclusão? | Sim — dentro do app (Ajustes) e pela página `/excluir-dados` |
| **Local aproximado** | Coletado · não compartilhado · processado de forma efêmera · obrigatório para a previsão · finalidade: funcionalidade do app |
| **Histórico de compras** | Coletado (pela loja/RevenueCat) · não compartilhado · finalidade: funcionalidade do app / gestão da assinatura |
| Local exato, contatos, fotos, identificadores de publicidade | Não coletados (o local exato fica só no aparelho; o servidor recebe a coordenada arredondada) |

### Outros itens do "Conteúdo do app"

- **Acesso ao app:** todas as funções disponíveis sem login.
- **Anúncios:** não contém anúncios.
- **Classificação:** questionário IARC — sem violência, sem conteúdo sensível → Livre.
- **Público-alvo:** 18 anos ou mais.
- **Política de privacidade:** URL do site `/privacidade`.

## App Store

| Campo | Texto |
|---|---|
| Nome (até 30) | `Grão Raiz: Clima no Campo` |
| Subtítulo (até 30) | `Pulverização, chuva e geada` |
| Palavras-chave (até 100) | `pulverização,pluviômetro,chuva,geada,previsão,agro,soja,milho,trigo,delta t,vento,colheita` |
| Texto promocional (até 170) | `Semáforo de pulverização por talhão, pluviômetro com estimativa automática e aviso de geada. Feito para quem planta grãos.` |
| Categoria | Clima (principal) · Produtividade (secundária) |
| Classificação | 4+ |
| URL de suporte / marketing | site publicado |
| Política de privacidade | site `/privacidade` |
| Descrição | a mesma da Google Play, trocando "Google Play" por "App Store" e acrescentando ao final: "Termos de uso: <site>/termos" |

### Rótulos de privacidade (App Privacy)

| Tipo de dado | Uso | Vinculado ao usuário? | Rastreamento? |
|---|---|---|---|
| Localização aproximada | Funcionalidade do app | Não | Não |
| Histórico de compras | Funcionalidade do app | Não | Não |

### Notas para o revisor

> O app não tem login. Para ver todas as telas: toque em "Começar", use "Estou no talhão: usar minha localização" (ou toque no mapa) e continue. A tela Hoje mostra o semáforo de pulverização; a aba Chuva permite anotar milímetros e gerar o cartão; o Pro (assinatura) libera talhões extras, 48 horas e o relatório em PDF.

## Capturas de tela

Tire de um aparelho real, com um talhão de verdade:
- **Android:** proporção até 2:1, mínimo 1080 px no lado menor.
- **iPhone:** 1320×2868 px (6,9″).

Sequência sugerida, com uma frase curta no topo de cada:
1. **Hoje** — "Dá para pulverizar? O app responde por talhão."
2. **Hora a hora** — "Vento na barra, delta T e chuva, hora a hora."
3. **Chuva** — "Seu pluviômetro no celular, com a média da safra."
4. **Cartão de chuva** — "Compartilhe a chuva no grupo."
5. **Aviso de geada** (notificação) — "Aviso de geada na tarde anterior."
6. **Relatório em PDF** — "Relatório da safra para Proagro e seguro."
7. **Talhões no mapa** — "Marque a lavoura no mapa de satélite."

As capturas geradas pelos testes automáticos (`apps/mobile/e2e/capturas`) servem para conferência, não para a loja: são da versão web.

## Mensagem para recrutar testadores (WhatsApp)

> Estou lançando o **Grão Raiz**, um app que diz se dá para pulverizar hoje no seu talhão, guarda a chuva da safra e avisa geada. Preciso de produtores para testar no Android por 2 semanas, de graça. Topa? Me manda o e-mail da sua conta Google que eu te envio o convite.
