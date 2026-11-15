import type { Metadata } from 'next';
import { Suspense } from 'react';
import { banco } from '@/lib/contas';
import { chavePainelConfere } from '@/lib/painel';

export const metadata: Metadata = {
  title: 'Painel do funil',
  robots: { index: false, follow: false },
};

type Busca = Promise<Record<string, string | string[] | undefined>>;

// Ordem do funil: do visitante à venda de máquina.
const ETAPAS: { nome: string; rotulo: string }[] = [
  { nome: 'app_opened', rotulo: 'Abriu o app' },
  { nome: 'signup_completed', rotulo: 'Criou conta' },
  { nome: 'field_created', rotulo: 'Cadastrou talhão' },
  { nome: 'aha_reached', rotulo: 'Viu a previsão do talhão (aha)' },
  { nome: 'alerts_enabled', rotulo: 'Ligou os avisos' },
  { nome: 'listing_viewed', rotulo: 'Viu um anúncio' },
  { nome: 'listing_created', rotulo: 'Anunciou máquina' },
  { nome: 'seller_contacted', rotulo: 'Pediu contato do vendedor' },
  { nome: 'listing_sold', rotulo: 'Vendeu máquina' },
];

async function Painel({ searchParams }: { searchParams: Busca }) {
  const { chave } = await searchParams;
  if (!chavePainelConfere(chave)) return <p className="text-lg text-texto-2">Abra o painel pelo link com a chave (?chave=…).</p>;

  const [porSemana, origens, robos, indexnow] = await Promise.all([
    banco().query<{ semana: string; nome: string; n: number }>(
      `select to_char(date_trunc('week', criado_em at time zone 'America/Sao_Paulo'), 'DD/MM') as semana, nome, count(*)::int as n
         from app.evento where criado_em > now() - interval '8 weeks'
        group by 1, 2, date_trunc('week', criado_em at time zone 'America/Sao_Paulo')
        order by date_trunc('week', criado_em at time zone 'America/Sao_Paulo') desc`,
    ),
    banco().query<{ fonte: string; n: number }>(
      `select coalesce(origem->'primeiro'->>'utm_source', nullif(split_part(split_part(origem->'primeiro'->>'referrer', '://', 2), '/', 1), ''), 'direto/desconhecido') as fonte,
              count(*)::int as n
         from app.conta where not demo and criado_em > now() - interval '90 days' group by 1 order by 2 desc limit 15`,
    ),
    banco().query<{ bot: string; n: number; paginas: number }>(
      `select propriedades->>'bot' as bot, count(*)::int as n, count(distinct pagina)::int as paginas
         from app.evento where nome = 'crawler_ai_hit' and criado_em > now() - interval '30 days' group by 1 order by 2 desc`,
    ),
    banco().query<{ status: string; n: number }>(
      `select coalesce(propriedades->>'status', propriedades->>'erro') as status, count(*)::int as n
         from app.evento where nome = 'indexnow_sent' and criado_em > now() - interval '30 days' group by 1 order by 2 desc`,
    ),
  ]);

  const semanas = [...new Set(porSemana.rows.map((r) => r.semana))];
  const valor = (semana: string, nome: string) => porSemana.rows.find((r) => r.semana === semana && r.nome === nome)?.n ?? 0;

  return (
    <>
      <h2 className="text-xl font-bold">Funil por semana (começo da semana)</h2>
      {semanas.length === 0 ? <p className="mt-2 text-texto-2">Nenhum evento ainda.</p> : null}
      {semanas.length ? (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-linha">
                <th className="py-2 pr-4">Etapa</th>
                {semanas.map((s) => (
                  <th key={s} className="py-2 pr-4 text-right">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ETAPAS.map((e) => (
                <tr key={e.nome} className="border-b border-linha">
                  <td className="py-2 pr-4">{e.rotulo}</td>
                  {semanas.map((s) => (
                    <td key={s} className="py-2 pr-4 text-right tabular-nums">
                      {valor(s, e.nome)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mt-10 grid gap-8 md:grid-cols-3">
        <section>
          <h2 className="text-xl font-bold">De onde vieram as contas (90 dias)</h2>
          <ul className="mt-3 text-sm">
            {origens.rows.map((o) => (
              <li key={o.fonte} className="flex justify-between border-b border-linha py-2">
                <span>{o.fonte}</span>
                <span className="tabular-nums">{o.n}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold">Robôs de IA (30 dias)</h2>
          {robos.rows.length === 0 ? <p className="mt-2 text-sm text-texto-2">Nenhuma visita registrada.</p> : null}
          <ul className="mt-3 text-sm">
            {robos.rows.map((r) => (
              <li key={r.bot} className="flex justify-between border-b border-linha py-2">
                <span>{r.bot}</span>
                <span className="tabular-nums">
                  {r.n} visitas · {r.paginas} páginas
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold">IndexNow (30 dias)</h2>
          {indexnow.rows.length === 0 ? <p className="mt-2 text-sm text-texto-2">Nenhum envio (configure INDEXNOW_KEY).</p> : null}
          <ul className="mt-3 text-sm">
            {indexnow.rows.map((r) => (
              <li key={r.status} className="flex justify-between border-b border-linha py-2">
                <span>Resposta {r.status}</span>
                <span className="tabular-nums">{r.n}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

/** Painel do funil e da visibilidade orgânica. Só abre com a chave do painel. */
export default function PainelFunil({ searchParams }: { searchParams: Busca }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight">Funil e visibilidade</h1>
      <Suspense fallback={<p className="text-texto-2">Carregando…</p>}>
        <Painel searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
