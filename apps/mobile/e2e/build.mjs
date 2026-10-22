// Exporta a versão web de produção com a simulação de Pro liberada, só para os testes automáticos.
import { spawnSync } from 'node:child_process';

const resultado = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', 'dist-web', '--clear'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, EXPO_PUBLIC_E2E: '1', CI: '1' },
});
process.exit(resultado.status ?? 1);
