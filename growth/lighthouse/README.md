# Lighthouse (celular, servidor local de produção)

Data: 14/11/2026 · Lighthouse 13.6.0, perfil de celular padrão (rede 4G lenta simulada e CPU 4× mais lenta) · Os JSON completos ficam só na máquina (`*.json`, fora do git).

| Página | Desempenho | Acessibilidade | Boas práticas | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| `/` (app, antes das correções) | 45 | 84 | 96 | 92 | 7,2 s | 2.120 ms | 0,043 |
| `/` (app, depois) | 52 | 94 | 100 | 100 | 6,4 s | 1.200 ms | 0,043 |
| `/maquinas-usadas` | 82 | 100 | 100 | 100 | 1,0 s | 680 ms | 0 |
| `/privacidade` | 87 | 100 | 100 | 100 | 0,9 s | 520 ms | 0 |
| `/baixar` | 86 | 100 | 100 | 100 | 0,8 s | 570 ms | 0 |

## Correções feitas na raiz

- Imagens decorativas com `alt` vazio; fotos de anúncio e de ocorrência com descrição.
- Botão principal no tema escuro: texto branco sobre verde claro (contraste 2,3:1) virou texto quase preto (8,6:1). No botão vermelho: 6,9:1.
- O pedido de evento ia para o endereço errado em builds sem `NEXT_PUBLIC_SITE_URL` (erro no console). Em produção a variável está definida.

## O que falta na raiz

- **Peso do JavaScript:** o pacote principal do Expo tem 1,1 MB (mais 425 KB comuns). Mais de 3 s de processamento num celular médio. Próximo passo: carregar sob demanda o mapa, o satélite e os gráficos, que hoje entram na tela inicial.
- **Aviso de ARIA nas abas** (`role="tab"` sem `tablist`): vem do Expo Router, não do nosso código.

As páginas do servidor (vitrine e textos) já estão boas. Por isso o conteúdo que deve ranquear fica nelas, não no app.
