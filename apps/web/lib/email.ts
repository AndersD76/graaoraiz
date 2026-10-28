/**
 * Envio de e-mail transacional pela API HTTP da Resend (sem SDK). Configuração: RESEND_API_KEY e
 * EMAIL_REMETENTE ("Grão Raiz <nao-responda@seu-dominio>", domínio verificado na Resend).
 * Sem chave, em desenvolvimento o e-mail sai no console do servidor; em produção, falha.
 */

export class EmailIndisponivel extends Error {}

export async function enviarEmail({ para, assunto, texto }: { para: string; assunto: string; texto: string }): Promise<void> {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) {
    if (process.env.NODE_ENV === 'production') throw new EmailIndisponivel('RESEND_API_KEY não configurada');
    console.info(`[email] (desenvolvimento, não enviado) para ${para} — ${assunto}\n${texto}`);
    return;
  }
  const resposta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_REMETENTE ?? 'Grão Raiz <onboarding@resend.dev>', to: [para], subject: assunto, text: texto }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!resposta.ok) throw new Error(`Resend ${resposta.status}: ${(await resposta.text()).slice(0, 200)}`);
}
