// Roda uma vez quando o servidor sobe. Agenda a rotina de SEO de hora em hora chamando a própria rota
// /api/cron/seo (assim ela roda dentro do Next, com cache e invalidação funcionando). Sem CRON_SECRET, não agenda.

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const segredo = process.env.CRON_SECRET;
  if (!segredo || segredo.length < 24 || process.env.ROTINA_SEO === 'desligada') return;
  const porta = process.env.PORT || '3000';
  const chamar = () =>
    fetch(`http://127.0.0.1:${porta}/api/cron/seo`, { headers: { authorization: `Bearer ${segredo}` }, signal: AbortSignal.timeout(30_000) }).catch(
      (e: unknown) => console.error('[seo] agendador não alcançou a rota:', e instanceof Error ? e.message : e),
    );
  // Primeira rodada 2 minutos depois de subir (o servidor já está atendendo); depois, de hora em hora.
  setTimeout(() => {
    void chamar();
    setInterval(() => void chamar(), 60 * 60 * 1000).unref();
  }, 2 * 60 * 1000).unref();
}
