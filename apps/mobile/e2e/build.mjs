// Exporta a versão web de produção com a simulação de Pro liberada, só para os testes automáticos.
import { spawnSync } from 'node:child_process';

const resultado = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', 'dist-web', '--clear'], {
  stdio: 'inherit',
  shell: true,
  // LIBERAR_PRO fixo em 0: os testes cobrem o plano grátis, mesmo que o .env local ligue a demonstração.
  // Sem servidor de contas o app não pede login (o login tem teste próprio, com servidor falso).
  env: { ...process.env, EXPO_PUBLIC_E2E: '1', EXPO_PUBLIC_LIBERAR_PRO: '0', EXPO_PUBLIC_SERVIDOR_URL: '', EXPO_PUBLIC_API_URL: '', CI: '1' },
});
process.exit(resultado.status ?? 1);
