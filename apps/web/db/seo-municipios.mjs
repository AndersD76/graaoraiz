// Monta app.municipio_agro com dado oficial do IBGE e põe as páginas "hora de pulverizar" na fila de publicação.
// Fontes: Produção Agrícola Municipal (SIDRA, tabela 5457), lista de municípios e malhas municipais (centro do polígono).
// Uso (em apps/web): DATABASE_URL=... node db/seo-municipios.mjs [ano] [pasta-de-cache]
// Rodar de novo atualiza os números e não duplica nada. Refazer quando o IBGE publicar a PAM do ano seguinte.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

const ANO = process.argv[2] ?? '2025';
const CACHE = process.argv[3] ?? null;
const LIMIAR_HA = 1000; // igual a LIMIAR_AREA_GRAOS_HA em lib/seo/municipios.ts
const PRODUTOS = { 40124: 'soja', 40122: 'milho', 40127: 'trigo', 40112: 'feijao', 40099: 'algodao', 40102: 'arroz', 40125: 'sorgo', 40103: 'aveia' };
const UFS_IBGE = [11, 12, 13, 14, 15, 16, 17, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31, 32, 33, 35, 41, 42, 43, 50, 51, 52, 53];

if (!process.env.DATABASE_URL) {
  console.error('Defina DATABASE_URL.');
  process.exit(1);
}

async function obter(nome, url) {
  if (CACHE) {
    mkdirSync(CACHE, { recursive: true });
    const arq = join(CACHE, nome);
    if (existsSync(arq)) return JSON.parse(readFileSync(arq, 'utf8'));
    const j = await (await fetch(url, { signal: AbortSignal.timeout(240_000) })).json();
    writeFileSync(arq, JSON.stringify(j));
    return j;
  }
  return (await fetch(url, { signal: AbortSignal.timeout(240_000) })).json();
}

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function centro(geom) {
  const aneis = geom.type === 'Polygon' ? [geom.coordinates[0]] : geom.coordinates.map((p) => p[0]);
  let A = 0, cx = 0, cy = 0;
  for (const anel of aneis) {
    for (let i = 0; i < anel.length - 1; i++) {
      const [x0, y0] = anel[i];
      const [x1, y1] = anel[i + 1];
      const f = x0 * y1 - x1 * y0;
      A += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
    }
  }
  if (Math.abs(A) < 1e-12) {
    const pts = aneis.flat();
    return [pts.reduce((s, p) => s + p[1], 0) / pts.length, pts.reduce((s, p) => s + p[0], 0) / pts.length];
  }
  A /= 2;
  return [cy / (6 * A), cx / (6 * A)];
}

const coord = new Map();
for (const uf of UFS_IBGE) {
  const j = await obter(`malha-${uf}.json`, `https://servicodados.ibge.gov.br/api/v3/malhas/estados/${uf}?formato=application/vnd.geo%2Bjson&qualidade=minima&intrarregiao=municipio`);
  for (const f of j.features) {
    const [lat, lon] = centro(f.geometry);
    coord.set(String(f.properties.codarea), { lat: +lat.toFixed(4), lon: +lon.toFixed(4) });
  }
}

const base = new Map();
for (const m of await obter('municipios.json', 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios')) {
  const im = m['regiao-imediata'];
  base.set(String(m.id), {
    codigo: String(m.id),
    nome: m.nome,
    uf: im?.['regiao-intermediaria']?.UF?.sigla ?? m.microrregiao?.mesorregiao?.UF?.sigla,
    slug: slug(m.nome),
    regiao: im ? { codigo: String(im.id), nome: im.nome } : null,
    culturas: {},
  });
}

for (const [cod, nome] of Object.entries(PRODUTOS)) {
  const j = await obter(
    `pam-${ANO}-${cod}.json`,
    `https://servicodados.ibge.gov.br/api/v3/agregados/5457/periodos/${ANO}/variaveis/8331|214?localidades=N6[all]&classificacao=782[${cod}]`,
  );
  for (const v of j) {
    const chave = v.id === '8331' ? 'area_ha' : 'producao_t';
    for (const s of v.resultados[0].series) {
      const m = base.get(String(s.localidade.id));
      const n = Number(s.serie[ANO]);
      if (!m || !Number.isFinite(n) || n <= 0) continue;
      (m.culturas[nome] ??= {})[chave] = n;
    }
  }
}

const selecionados = [...base.values()]
  .map((m) => ({ ...m, ...coord.get(m.codigo), area: Object.values(m.culturas).reduce((s, x) => s + (x.area_ha ?? 0), 0) }))
  .filter((m) => m.lat !== undefined && m.area >= LIMIAR_HA)
  .sort((a, b) => b.area - a.area);

const titulo = (m) => {
  const longo = `Hora de pulverizar em ${m.nome} (${m.uf}): janelas de hoje`;
  return longo.length <= 60 ? longo : `Hora de pulverizar em ${m.nome} (${m.uf})`.slice(0, 60);
};
const descricao = (m) => {
  const longa = `Melhor horário para pulverizar em ${m.nome} (${m.uf}) hoje e na semana: delta T, vento, umidade e chuva hora a hora. Boletim grátis.`;
  return longa.length <= 155 ? longa : `Melhor horário para pulverizar em ${m.nome} (${m.uf}): delta T, vento e chuva hora a hora. Boletim grátis.`.slice(0, 155);
};

const c = new pg.Client({ connectionString: process.env.DATABASE_URL.replace('sslmode=require', 'sslmode=verify-full') });
await c.connect();
await c.query(readFileSync(new URL('./seo.sql', import.meta.url), 'utf8'));
await c.query('begin');
for (const m of selecionados) {
  await c.query(
    `insert into app.municipio_agro (codigo, nome, uf, slug, lat, lon, regiao_codigo, regiao_nome, culturas, area_graos_ha, ano_pam)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     on conflict (codigo) do update set nome = excluded.nome, uf = excluded.uf, slug = excluded.slug, lat = excluded.lat, lon = excluded.lon,
       regiao_codigo = excluded.regiao_codigo, regiao_nome = excluded.regiao_nome, culturas = excluded.culturas,
       area_graos_ha = excluded.area_graos_ha, ano_pam = excluded.ano_pam`,
    [m.codigo, m.nome, m.uf, m.slug, m.lat, m.lon, m.regiao?.codigo ?? null, m.regiao?.nome ?? null, JSON.stringify(m.culturas), m.area, Number(ANO)],
  );
  await c.query(
    `insert into app.seo_pagina (caminho, tipo, cluster, consulta, isca, titulo, descricao, prioridade)
     values ($1, 'programatica', 'pulverizacao', $2, 'boletim-pulverizacao-municipio', $3, $4, $5)
     on conflict (caminho) do update set titulo = excluded.titulo, descricao = excluded.descricao, prioridade = excluded.prioridade`,
    [`/hora-de-pulverizar/${m.uf.toLowerCase()}/${m.slug}`, `hora de pulverizar em ${m.nome}`.toLowerCase(), titulo(m), descricao(m), m.area],
  );
}
await c.query('commit');
const r = await c.query("select count(*)::int as n, count(*) filter (where status = 'publicada')::int as pub from app.seo_pagina where tipo = 'programatica'");
console.log(`PAM ${ANO}: ${selecionados.length} municípios com >= ${LIMIAR_HA} ha de grãos. Páginas programáticas: ${r.rows[0].n} (publicadas: ${r.rows[0].pub}).`);
await c.end();
