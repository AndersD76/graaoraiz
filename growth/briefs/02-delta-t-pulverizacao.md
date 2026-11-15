# Brief: guia e calculadora "Delta T na pulverização"

- **Consultas-alvo:**
  - delta t pulverização
  - tabela delta t
  - delta t como calcular
  - melhor horário para pulverizar
- **Intenção:** informacional + ferramenta (tabela e calculadora).
- **Página:** `/guia/delta-t-pulverizacao` (servidor, indexável). Pilar do cluster "Pulverização e janela de clima".
- **Ângulo diferenciado:** além da tabela, mostrar **o delta T de hoje, hora a hora, para a cidade do leitor**. As regras do app (`packages/clima`) já calculam isso. Nenhum concorrente do top 5 faz.

## Estrutura
- **H1:** Delta T na pulverização: o que é, a tabela e o melhor horário de hoje
- **Resposta direta (40–60 palavras):**
  - delta T é a diferença entre a temperatura do ar e a de bulbo úmido;
  - a faixa boa costuma ser de 2 a 8 °C (TODO-VALIDAR: referência técnica e faixa por tipo de gota).
- **Calculadora:** temperatura e umidade → delta T e semáforo (bom, cuidado, não pulverize), com a mesma regra do app.
- **Tabela:** temperatura × umidade, colorida pelo semáforo.
- **H2: Por que o delta T importa** (evaporação da gota, deriva).
- **H2: Vento, chuva e inversão térmica.**
- **H2: Perguntas frequentes:**
  - "Pode pulverizar de noite?"
  - "Delta T acima de 10?"
  - "Qual o melhor horário para herbicida?"
- **CTA:** "Receba no celular a hora certa de pulverizar no seu talhão".

## Dados a validar
- **TODO-VALIDAR:** faixas de delta T e limites de vento usados no app, com fonte técnica (bula, Embrapa ou literatura de tecnologia de aplicação).
- **Revisão técnica:** a página precisa de revisão de um agrônomo (E-E-A-T), com o nome e o registro do revisor na página.
