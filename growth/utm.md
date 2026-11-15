# Padrão de UTM do Grão Raiz

Todo link que sai do Grão Raiz para divulgação leva os quatro parâmetros, em minúsculas, sem acento e com hífen no lugar de espaço:

| Parâmetro | O que é | Valores |
|---|---|---|
| `utm_source` | onde o link foi postado | `whatsapp`, `instagram`, `facebook`, `linkedin`, `youtube`, `email`, `cooperativa-<nome>`, `qr` |
| `utm_medium` | tipo de canal | `social`, `grupo`, `direto`, `email`, `video`, `impresso`, `parceiro` |
| `utm_campaign` | campanha | `teste-2026-11`, `maquinas-usadas`, `investidor`, `lancamento-lojas` |
| `utm_content` | qual peça ou variação | `arte-convite`, `texto-curto`, `video-60s`, `anuncio-<id>` |

Exemplos:
- Convite no grupo de WhatsApp: `https://www.appgraoraiz.com.br/?utm_source=whatsapp&utm_medium=grupo&utm_campaign=teste-2026-11&utm_content=arte-convite`
- Post no LinkedIn sobre máquinas: `https://www.appgraoraiz.com.br/maquinas-usadas?utm_source=linkedin&utm_medium=social&utm_campaign=maquinas-usadas&utm_content=post-1`

Regras:
- Nunca use UTM em link interno (de uma página do site para outra): isso apaga a origem real.
- As páginas com UTM têm `canonical` sem parâmetros, então não geram página duplicada no Google.
- A origem aparece no painel `/admin/funil` ("De onde vieram as contas") e na ficha de cada conta em `/admin/usuarios`.
