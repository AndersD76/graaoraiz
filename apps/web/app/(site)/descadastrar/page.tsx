import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ISCAS, iscaValida } from '@/lib/seo/config';
import { leadPorToken } from '@/lib/seo/leads';

export const metadata: Metadata = { title: 'Descadastrar', robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function Conteudo({ searchParams }: Props) {
  const p = await searchParams;
  const token = typeof p.t === 'string' ? p.t : '';
  const feito = p.feito === '1';
  const lead = token ? await leadPorToken(token) : null;
  const nomeIsca = lead && iscaValida(lead.isca) ? ISCAS[lead.isca].titulo.toLowerCase() : 'os e-mails do Grão Raiz';

  if (!lead) {
    return <p className="mt-4 text-texto-2">Link de descadastro inválido ou antigo. Se continuar recebendo e-mails, responda qualquer um deles pedindo para sair.</p>;
  }
  if (feito || lead.descadastrado) {
    return (
      <p role="status" className="mt-4 text-lg">
        Pronto: o e-mail {lead.email} não recebe mais {nomeIsca}.
      </p>
    );
  }
  return (
    <form method="post" action={`/api/descadastrar?t=${encodeURIComponent(token)}&volta=1`} className="mt-6">
      <p className="text-texto-2">
        Parar de receber {nomeIsca} no e-mail {lead.email}?
      </p>
      <button type="submit" className="mt-4 min-h-11 rounded-xl bg-marca px-5 font-semibold text-white hover:bg-marca-escura">
        Descadastrar
      </button>
    </form>
  );
}

export default function Descadastrar(props: Props) {
  return (
    <section className="mx-auto max-w-xl px-4 py-14">
      <h1 className="text-3xl font-bold">Descadastrar</h1>
      <Suspense fallback={<p className="mt-4 text-texto-2">Carregando…</p>}>
        <Conteudo {...props} />
      </Suspense>
    </section>
  );
}
