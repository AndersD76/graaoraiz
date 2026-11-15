// IndexNow (Bing, Yandex e parceiros): avisa na hora que uma página mudou, em vez de esperar o rastreio.
// A chave fica em INDEXNOW_KEY e é publicada em /indexnow.txt. Sem a chave, não faz nada.
import { SITE_URL } from '@/lib/config';
import { registrarEvento } from '@/lib/telemetria';

export function chaveIndexNow(): string | null {
  const k = process.env.INDEXNOW_KEY?.trim();
  return k && /^[a-zA-Z0-9-]{8,128}$/.test(k) ? k : null;
}

/** Envia as URLs ao IndexNow sem travar quem chamou; o resultado vai para a telemetria. */
export function avisarIndexNow(caminhos: string[]): void {
  const key = chaveIndexNow();
  if (!key || !SITE_URL.startsWith('https://') || caminhos.length === 0) return;
  const host = new URL(SITE_URL).host;
  const urlList = [...new Set(caminhos)].map((c) => `${SITE_URL}${c}`);
  void fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation: `${SITE_URL}/indexnow.txt`, urlList }),
    signal: AbortSignal.timeout(10_000),
  })
    .then((r) => registrarEvento({ nome: 'indexnow_sent', origem: 'servidor', propriedades: { status: r.status, urls: urlList.length } }))
    .catch((e: unknown) => registrarEvento({ nome: 'indexnow_sent', origem: 'servidor', propriedades: { erro: e instanceof Error ? e.message : 'falha', urls: urlList.length } }));
}
