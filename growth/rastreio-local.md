# Rastreio como Googlebot: http://localhost:3300

17 URLs (sitemap + rotas do app). robots.txt: 48 linhas. /llms.txt: HTTP 200.

| URL | HTTP | robots | canonical | título (car.) | descrição (car.) | H1 | palavras | links internos | JSON-LD | ms |
|---|---|---|---|---|---|---|---|---|---|---|
| / | 200 | index | http://localhost:3000/ | 34 | 125 | 1 | 72 | 4 | Organization, WebSite, SoftwareApplication | 16 |
| /baixar | 200 | index | /baixar | 29 | 109 | 1 | 123 | 7 | — | 32 |
| /avaliar | 200 | index | /avaliar | 30 | 66 | 1 | 160 | 7 | — | 29 |
| /privacidade | 200 | index | /privacidade | 35 | 136 | 1 | 1264 | 7 | — | 10 |
| /termos | 200 | index | /termos | 25 | 135 | 1 | 988 | 8 | — | 13 |
| /excluir-dados | 200 | index | /excluir-dados | 42 | 118 | 1 | 290 | 7 | — | 25 |
| /maquinas-usadas | 200 | index | /maquinas-usadas | 45 | 147 | 1 | 211 | 20 | FAQPage, BreadcrumbList | 7 |
| /maquinas-usadas/categoria/trator | 200 | noindex, follow | /maquinas-usadas/categoria/trator | 35 | 121 | 1 | 205 | 19 | FAQPage, BreadcrumbList | 16 |
| /maquinas-usadas/categoria/colheitadeira | 200 | index | /maquinas-usadas/categoria/colheitadeira | 41 | 127 | 1 | 197 | 20 | FAQPage, BreadcrumbList | 36 |
| /maquinas-usadas/ee9057ba-ee76-4fc7-b2aa-337ad9bc7c2d | 200 | index | /maquinas-usadas/ee9057ba-ee76-4fc7-b2aa-337ad9bc7c2d | 54 | 140 | 1 | 122 | 11 | Product, BreadcrumbList | 21 |
| /maquinas-usadas/ae19f747-87f3-4642-bb2b-4d82ff0c61fb | 200 | index | /maquinas-usadas/ae19f747-87f3-4642-bb2b-4d82ff0c61fb | 55 | 135 | 1 | 118 | 11 | Product, BreadcrumbList | 17 |
| /lavoura | 200 | noindex, follow | http://localhost:3000/ | 34 | 125 | 1 | 72 | 4 | Organization, WebSite, SoftwareApplication | 18 |
| /maquinas | 200 | noindex, follow | http://localhost:3000/ | 34 | 125 | 1 | 72 | 4 | Organization, WebSite, SoftwareApplication | 9 |
| /entrar | 200 | noindex, follow | http://localhost:3000/ | 34 | 125 | 1 | 72 | 4 | Organization, WebSite, SoftwareApplication | 9 |
| /anunciar | 200 | noindex, follow | http://localhost:3000/ | 34 | 125 | 1 | 72 | 4 | Organization, WebSite, SoftwareApplication | 18 |
| /painel/funil | 200 | noindex, nofollow / noindex, nofollow | — | 27 | 129 | 1 | 52 | 6 | — | 32 |
| /rota-que-nao-existe | 404 | noindex | — | 33 | 129 | 1 | 57 | 7 | — | 39 |

## Problemas
- nenhum problema crítico encontrado
