import { timingSafeEqual } from 'node:crypto';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AJUDOU, INDICARIA, PERFIS, rotuloDe } from '@/lib/avaliacoes';
import { banco } from '@/lib/contas';

export const metadata: Metadata = {
  title: 'Avaliações recebidas',
  robots: { index: false, follow: false },
};

interface Linha {
  nota: number;
  indicaria: string | null;
  ajudou: string[];
  melhorar: string | null;
  perfil: string | null;
  cidade: string | null;
  contato: string | null;
  origem: string | null;
  criado_em: Date;
}

function chaveConfere(informada: string | undefined): boolean {
  const certa = process.env.AVALIACOES_CHAVE;
  if (!certa || !informada) return false;
  const a = Buffer.from(informada);
  const b = Buffer.from(certa);
  return a.length === b.length && timingSafeEqual(a, b);
}

const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-2xl bg-superficie p-4">
      <p className="text-sm text-texto-2">{rotulo}</p>
      <p className="mt-1 text-3xl font-extrabold">{valor}</p>
    </div>
  );
}

async function Painel({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { chave } = await searchParams;
  if (!chaveConfere(typeof chave === 'string' ? chave : undefined)) {
    return <p className="text-lg text-texto-2">Abra o painel pelo link com a chave (?chave=…).</p>;
  }

  const r = await banco().query<Linha>(
    'select nota, indicaria, ajudou, melhorar, perfil, cidade, contato, origem, criado_em from app.avaliacao order by criado_em desc limit 500',
  );
  const linhas = r.rows;
  if (!linhas.length) return <p className="text-lg text-texto-2">Nenhuma avaliação ainda.</p>;

  const media = linhas.reduce((s, l) => s + l.nota, 0) / linhas.length;
  const comIndicacao = linhas.filter((l) => l.indicaria);
  const pct = (n: number, de: number) => (de ? `${Math.round((n / de) * 100)}%` : '—');
  const contagem = AJUDOU.map((o) => ({ ...o, n: linhas.filter((l) => l.ajudou.includes(o.valor)).length })).sort((a, b) => b.n - a.n);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Numero rotulo="Avaliações" valor={String(linhas.length)} />
        <Numero rotulo="Nota média" valor={media.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} />
        <Numero rotulo="Indicariam" valor={pct(comIndicacao.filter((l) => l.indicaria === 'sim').length, comIndicacao.length)} />
        <Numero rotulo="Deixaram contato" valor={String(linhas.filter((l) => l.contato).length)} />
      </div>

      <h2 className="mt-10 text-xl font-bold">O que mais ajudou</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {contagem.map((o) => (
          <li key={o.valor} className="flex items-center gap-3">
            <span className="w-52 shrink-0">{o.rotulo}</span>
            <span className="h-3 rounded-full bg-marca" style={{ width: `${(o.n / linhas.length) * 60}%` }} />
            <span className="text-texto-2">{o.n}</span>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-xl font-bold">Respostas</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {linhas.map((l, i) => (
          <li key={i} className="rounded-2xl border border-linha p-4">
            <p className="font-semibold">
              Nota {l.nota} · Indicaria: {rotuloDe(INDICARIA, l.indicaria)} · {rotuloDe(PERFIS, l.perfil)}
              {l.cidade ? ` · ${l.cidade}` : ''}
            </p>
            {l.ajudou.length ? <p className="mt-1 text-sm text-texto-2">Ajudou: {l.ajudou.map((v) => rotuloDe(AJUDOU, v)).join(', ')}</p> : null}
            {l.melhorar ? <p className="mt-2 whitespace-pre-line">{l.melhorar}</p> : null}
            <p className="mt-2 text-sm text-texto-2">
              {dataHora.format(l.criado_em)}
              {l.origem ? ` · veio de ${l.origem}` : ''}
              {l.contato ? ` · contato: ${l.contato}` : ''}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Painel das avaliações da versão de teste. Só abre com ?chave= igual à variável AVALIACOES_CHAVE do servidor. */
export default function Avaliacoes({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight">Avaliações recebidas</h1>
      <Suspense fallback={<p className="text-texto-2">Carregando…</p>}>
        <Painel searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
