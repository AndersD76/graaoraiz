// Exporta a versão web do app (apps/mobile) para public/, que o Next serve na raiz do site.
// Roda antes do next build (npm run build). O app fala com este mesmo servidor (contas, preços, EUDR).
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origem = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

// public/ é todo gerado aqui: o expo export apaga a pasta antes de exportar.
const resultado = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', resolve(web, 'public'), '--clear'], {
  cwd: resolve(web, '../mobile'),
  stdio: 'inherit',
  shell: true,
  // Versão de demonstração para produtores: módulos do Pro liberados, como no APK de teste.
  env: {
    ...process.env,
    EXPO_PUBLIC_SERVIDOR_URL: origem,
    EXPO_PUBLIC_SITE_URL: origem,
    EXPO_PUBLIC_LIBERAR_PRO: process.env.EXPO_PUBLIC_LIBERAR_PRO ?? '1',
    CI: '1',
  },
});
process.exit(resultado.status ?? 1);
