# Rastreio como Googlebot: http://localhost:3300

17 URLs (sitemap + rotas do app). robots.txt: 45 linhas. /llms.txt: HTTP 200.

| URL | HTTP | robots | canonical | título (car.) | descrição (car.) | H1 | palavras | links internos | JSON-LD | ms |
|---|---|---|---|---|---|---|---|---|---|---|
| / | 200 | index | / | 34 | 125 | 1 | 72 | 4 | Organization, WebSite, SoftwareApplication | 12 |
| /baixar | 200 | index | /baixar | 29 | 109 | 1 | 123 | 7 | — | 153 |
| /avaliar | 200 | index | /avaliar | 30 | 66 | 1 | 160 | 7 | — | 28 |
| /privacidade | 200 | index | /privacidade | 35 | 136 | 1 | 1264 | 7 | — | 12 |
| /termos | 200 | index | /termos | 25 | 135 | 1 | 988 | 8 | — | 16 |
| /excluir-dados | 200 | index | /excluir-dados | 42 | 118 | 1 | 290 | 7 | — | 26 |
| /maquinas-usadas | 200 | index | /maquinas-usadas | 45 | 147 | 1 | 211 | 20 | FAQPage, BreadcrumbList | 17 |
| /maquinas-usadas/categoria/trator | 200 | noindex, follow | /maquinas-usadas/categoria/trator | 35 | 121 | 1 | 205 | 19 | FAQPage, BreadcrumbList | 12 |
| /maquinas-usadas/categoria/colheitadeira | 200 | index | /maquinas-usadas/categoria/colheitadeira | 41 | 127 | 1 | 197 | 20 | FAQPage, BreadcrumbList | 36 |
| /maquinas-usadas/65f5a70d-8846-4353-b478-fff3d4893b5d | 200 | index | /maquinas-usadas/65f5a70d-8846-4353-b478-fff3d4893b5d | 54 | 140 | 1 | 122 | 11 | Product, BreadcrumbList | 15 |
| /maquinas-usadas/754df136-611a-4202-b339-9be68c4672df | 200 | index | /maquinas-usadas/754df136-611a-4202-b339-9be68c4672df | 55 | 135 | 1 | 118 | 11 | Product, BreadcrumbList | 8 |
| /lavoura | 200 | noindex, follow | / | 34 | 125 | 1 | 72 | 4 | Organization, WebSite, SoftwareApplication | 7 |
| /maquinas | 200 | noindex, follow | / | 34 | 125 | 1 | 72 | 4 | Organization, WebSite, SoftwareApplication | 15 |
| /entrar | 200 | noindex, follow | / | 34 | 125 | 1 | 72 | 4 | Organization, WebSite, SoftwareApplication | 16 |
| /anunciar | 200 | noindex, follow | / | 34 | 125 | 1 | 72 | 4 | Organization, WebSite, SoftwareApplication | 4 |
| /painel/funil | 308 → /admin/funil | index | — | 0 | 0 | 0 | 0 | 0 | — | 8 |
| /rota-que-nao-existe | 404 | noindex | — | 33 | 129 | 1 | 57 | 7 | — | 19 |

## Problemas
- nenhum problema crítico encontrado
