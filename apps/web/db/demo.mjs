// Cria (ou recria) a conta de demonstração com os dados de db/demo-estado.json:
// lavouras reais de soja e trigo perto de Passo Fundo, chuvas, aplicações e seguro.
// Uso (em apps/web): DATABASE_URL=... node db/demo.mjs
import { randomBytes, scryptSync } from 'node:crypto';
import { readFileSync } from 'node:fs';

import pg from 'pg';

// Mesmos valores do app (apps/mobile/src/lib/config.ts).
const EMAIL = 'demo@graoraiz.com.br';
const SENHA = 'demo2026';
const NOME = 'Demonstração Grão Raiz';

// Mesmo formato de lib/contas.ts: scrypt$N$r$p$sal$hash.
const sal = randomBytes(16);
const hash = scryptSync(SENHA, sal, 64, { N: 16384, r: 8, p: 1 });
const senhaHash = `scrypt$16384$8$1$${sal.toString('base64')}$${hash.toString('base64')}`;

const estado = JSON.parse(readFileSync(new URL('./demo-estado.json', import.meta.url), 'utf8'));

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Defina DATABASE_URL.');
  process.exit(1);
}
const cliente = new pg.Client({ connectionString: url, connectionTimeoutMillis: 20_000 });
await cliente.connect();
const r = await cliente.query(
  `insert into app.conta (email, nome, senha_hash, demo) values ($1, $2, $3, true)
   on conflict (email) do update set nome = excluded.nome, senha_hash = excluded.senha_hash, demo = true
   returning id`,
  [EMAIL, NOME, senhaHash],
);
await cliente.query(
  `insert into app.dados_conta (conta_id, estado, atualizado_em) values ($1, $2, now())
   on conflict (conta_id) do update set estado = excluded.estado, atualizado_em = now()`,
  [r.rows[0].id, JSON.stringify(estado)],
);
console.log(`Conta de demonstração pronta: ${EMAIL} (${estado.talhoes.length} talhões, ${estado.chuvas.length} chuvas, ${estado.aplicacoes.length} aplicações).`);
await cliente.end();
