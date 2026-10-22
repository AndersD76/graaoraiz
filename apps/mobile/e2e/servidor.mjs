// Servidor estático mínimo para a versão web exportada (SPA: rotas desconhecidas caem no index.html).
// Uso: node e2e/servidor.mjs <pasta> <porta>
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const pasta = resolve(process.argv[2] ?? 'dist-web');
const porta = Number(process.argv[3] ?? 8085);
const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
};

createServer((req, res) => {
  const caminho = normalize(decodeURIComponent((req.url ?? '/').split('?')[0])).replace(/^([/\\])+/, '');
  let arquivo = join(pasta, caminho);
  if (!arquivo.startsWith(pasta) || !existsSync(arquivo) || statSync(arquivo).isDirectory()) arquivo = join(pasta, 'index.html');
  res.writeHead(200, { 'Content-Type': tipos[extname(arquivo)] ?? 'application/octet-stream' });
  createReadStream(arquivo).pipe(res);
}).listen(porta, () => console.log(`servindo ${pasta} em http://localhost:${porta}`));
