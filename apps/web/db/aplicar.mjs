// Aplica db/contas.sql no banco de DATABASE_URL. Uso (em apps/web): DATABASE_URL=... node db/aplicar.mjs
import { readFileSync } from 'node:fs';

import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Defina DATABASE_URL.');
  process.exit(1);
}
const cliente = new pg.Client({ connectionString: url, connectionTimeoutMillis: 20_000 });
await cliente.connect();
await cliente.query(readFileSync(new URL('./contas.sql', import.meta.url), 'utf8'));
const r = await cliente.query(`select table_name from information_schema.tables where table_schema = 'app' order by 1`);
console.log('Tabelas no esquema app:', r.rows.map((l) => l.table_name).join(', '));
await cliente.end();
