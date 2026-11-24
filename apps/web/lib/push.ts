// Avisos push de mensagem nova nos classificados: Web Push no navegador (chaves VAPID) e Expo no app
// Android/iPhone. Inscrição que o serviço diz não existir mais (expirada, desinstalada) sai do banco.
import { sendNotification, setVapidDetails } from 'web-push';

import { SITE_URL } from '@/lib/config';
import { banco } from '@/lib/contas';

export interface Aviso {
  titulo: string;
  corpo: string;
  /** Caminho no app aberto ao tocar no aviso, ex.: /conversa/<id>. */
  caminho: string;
  /** Avisos com a mesma marca se substituem (uma notificação por conversa). */
  marca: string;
}

/** Chave pública VAPID (o navegador precisa dela para se inscrever); null sem configuração. */
export function chavePublicaPush(): string | null {
  return process.env.VAPID_PUBLIC_KEY?.trim() || null;
}

let vapidPronto = false;
function prepararVapid(): boolean {
  if (vapidPronto) return true;
  const publica = chavePublicaPush();
  const privada = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publica || !privada) return false;
  // O "subject" identifica quem manda; o site basta (não expõe e-mail pessoal).
  setVapidDetails(SITE_URL.startsWith('https://') ? SITE_URL : 'https://www.appgraoraiz.com.br', publica, privada);
  vapidPronto = true;
  return true;
}

interface Inscricao {
  endpoint: string;
  tipo: 'web' | 'expo';
  chaves: { p256dh: string; auth: string } | null;
}

async function remover(endpoint: string): Promise<void> {
  await banco().query('delete from app.inscricao_push where endpoint = $1', [endpoint]);
}

async function enviarWeb(i: Inscricao, a: Aviso): Promise<boolean> {
  if (!i.chaves || !prepararVapid()) return false;
  try {
    await sendNotification(
      { endpoint: i.endpoint, keys: i.chaves },
      JSON.stringify({ titulo: a.titulo, corpo: a.corpo, caminho: a.caminho, marca: a.marca }),
      { TTL: 60 * 60 * 24, urgency: 'high', timeout: 10_000 },
    );
    return true;
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) await remover(i.endpoint);
    else console.error('[push] web falhou:', status ?? (e instanceof Error ? e.message : e));
    return false;
  }
}

async function enviarExpo(lista: Inscricao[], a: Aviso): Promise<number> {
  if (lista.length === 0) return 0;
  try {
    const r = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(
        lista.map((i) => ({ to: i.endpoint, title: a.titulo, body: a.corpo, sound: 'default', data: { caminho: a.caminho }, channelId: 'mensagens' })),
      ),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) {
      console.error('[push] expo respondeu', r.status);
      return 0;
    }
    const corpo = (await r.json()) as { data?: { status: string; details?: { error?: string } }[] };
    let entregues = 0;
    for (const [n, t] of (corpo.data ?? []).entries()) {
      if (t.status === 'ok') entregues += 1;
      else if (t.details?.error === 'DeviceNotRegistered' && lista[n]) await remover(lista[n].endpoint);
    }
    return entregues;
  } catch (e) {
    console.error('[push] expo falhou:', e instanceof Error ? e.message : e);
    return 0;
  }
}

/** Manda o aviso para todos os aparelhos e navegadores da conta. Devolve em quantos foi aceito. */
export async function avisarConta(contaId: string, aviso: Aviso): Promise<number> {
  const r = await banco().query<Inscricao>('select endpoint, tipo, chaves from app.inscricao_push where conta_id = $1', [contaId]);
  const web = r.rows.filter((i) => i.tipo === 'web');
  const expo = r.rows.filter((i) => i.tipo === 'expo');
  const resultados = await Promise.all(web.map((i) => enviarWeb(i, aviso)));
  return resultados.filter(Boolean).length + (await enviarExpo(expo, aviso));
}
