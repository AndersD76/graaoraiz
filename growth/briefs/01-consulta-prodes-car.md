# Brief: ferramenta "Consulta de desmatamento (PRODES) e CAR do seu talhão"

- **Consultas-alvo:**
  - desmatamento prodes consulta por imóvel
  - consulta prodes pelo car
  - como consultar prodes pelo cpf
  - eudr produtor rural
- **Intenção:** ferramenta (a pessoa quer fazer a checagem agora).
- **Página:** `/consulta-prodes-car`, renderizada no servidor e indexável.
- **Ângulo diferenciado:** no top 5 há guias, ferramentas do governo difíceis de usar (TerraBrasilis) e uma única ferramenta comercial grátis. A nossa responde em linguagem do produtor:
  - "Seu talhão teve desmatamento depois de 2020?" (lei europeia);
  - "E depois de jul/2019?" (crédito rural).
- **Dado próprio:** a checagem já existe no app (`/api/conformidade`), com resultado testado em área real.

## Estrutura
- **H1:** Consulte se o seu talhão tem desmatamento no PRODES e qual é o CAR da propriedade
- **Resposta direta (40–60 palavras):** o que a consulta mostra, de onde vem o dado (INPE e SICAR) e que é uma verificação prévia, não um certificado.
- **Ferramenta:** desenhar o contorno no mapa ou colar as coordenadas → resultado. O resultado tem URL própria para compartilhar com o banco ou a trading. CTA: "Guarde no app e gere o arquivo da lei europeia".
- **H2: Quem precisa fazer essa checagem e quando.** Tabela de prazos:
  - lei europeia: 30/12/2026 e 30/06/2027;
  - crédito rural por tamanho do imóvel: 2027 e 2028.
  - TODO-VALIDAR: número da resolução do CMN (5.303 ou 5.323).
- **H2: Como ler o resultado** (livre, atenção, conferir, inconclusivo).
- **H2: Perguntas frequentes:**
  - "Desmatamento antes de 2020 conta?"
  - "E se o PRODES errar?"
  - "Preciso do CAR ativo?"
- **Links internos:** página inicial do app, `/maquinas-usadas` (no rodapé) e termos (aviso de que não é certificado).

## Dados a validar antes de publicar
- **TODO-VALIDAR:** número e data das resoluções do CMN e as datas da lei europeia (Regulamento UE 2023/1115 e alterações).
- **Uso de dados:** conferir se o INPE permite o uso em ferramenta pública. O TerraBrasilis é aberto, mas exige citação.
