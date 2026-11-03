import { formatarReais, rotuloCategoria } from '@graoraiz/clima';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { banco } from '@/lib/contas';
import { chavePainelConfere } from '@/lib/painel';

export const metadata: Metadata = {
  title: 'Painel de máquinas',
  robots: { index: false, follow: false },
};

interface Linha {
  id: string;
  titulo: string;
  categoria: string;
  preco: string;
  municipio: string;
  uf: string;
  situacao: string;
  whatsapp: string;
  criado_em: Date;
  vendido_em: Date | null;
  valor_venda: string | null;
  comissao_percentual: string;
  comissao_valor: string | null;
  comissao_paga_em: Date | null;
  vendedor: string;
  email: string;
  contatos: number;
}

type Busca = Promise<Record<string, string | string[] | undefined>>;

const data = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' });

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-2xl bg-superficie p-4">
      <p className="text-sm text-texto-2">{rotulo}</p>
      <p className="mt-1 text-2xl font-extrabold">{valor}</p>
    </div>
  );
}

/** Botão de ação do painel: manda a chave junto e volta para o painel. */
function Acao({ chave, id, acao, rotulo, perigo = false }: { chave: string; id: string; acao: string; rotulo: string; perigo?: boolean }) {
  return (
    <form method="post" action="/api/painel/maquinas">
      <input type="hidden" name="chave" value={chave} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="acao" value={acao} />
      <button
        type="submit"
        className={`min-h-10 rounded-full px-4 text-sm font-semibold ${perigo ? 'border border-ruim text-ruim hover:bg-superficie' : 'bg-marca text-white hover:bg-marca-escura'}`}
      >
        {rotulo}
      </button>
    </form>
  );
}

async function Painel({ searchParams }: { searchParams: Busca }) {
  const { chave } = await searchParams;
  if (!chavePainelConfere(chave) || typeof chave !== 'string') {
    return <p className="text-lg text-texto-2">Abra o painel pelo link com a chave (?chave=…).</p>;
  }

  const r = await banco().query<Linha>(
    `select a.id, a.titulo, a.categoria, a.preco, a.municipio, a.uf, a.situacao, a.whatsapp, a.criado_em, null as vendido_em, null as valor_venda,
            a.comissao_percentual, null as comissao_valor, null as comissao_paga_em, c.nome as vendedor, c.email,
            (select count(*)::int from app.contato_anuncio x where x.anuncio_id = a.id) as contatos
       from app.anuncio a join app.conta c on c.id = a.conta_id
      where a.situacao in ('ativo', 'pausado')
      order by a.criado_em desc limit 500`,
  );
  // As vendas vêm do registro próprio, que continua mesmo se o vendedor excluir a conta.
  const v = await banco().query<Linha>(
    `select v.anuncio_id as id, v.titulo, v.categoria, v.valor_venda as preco, '' as municipio, '' as uf, 'vendido' as situacao, v.whatsapp,
            v.vendido_em as criado_em, v.vendido_em, v.valor_venda, v.comissao_percentual, v.comissao_valor, v.comissao_paga_em,
            v.vendedor_nome as vendedor, v.vendedor_email as email,
            (select count(*)::int from app.contato_anuncio x where x.anuncio_id = v.anuncio_id) as contatos
       from app.venda v order by v.vendido_em desc limit 500`,
  );
  const vendas = v.rows;
  const ativos = r.rows;
  const soma = (ls: Linha[]) => ls.reduce((s, l) => s + Number(l.comissao_valor ?? 0), 0);
  const aReceber = vendas.filter((l) => !l.comissao_paga_em);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Numero rotulo="Anúncios no ar" valor={String(ativos.filter((l) => l.situacao === 'ativo').length)} />
        <Numero rotulo="Contatos pedidos" valor={String([...ativos, ...vendas].reduce((s, l) => s + l.contatos, 0))} />
        <Numero rotulo="Comissão a receber" valor={formatarReais(soma(aReceber))} />
        <Numero rotulo="Comissão recebida" valor={formatarReais(soma(vendas.filter((l) => l.comissao_paga_em)))} />
      </div>

      <h2 className="mt-10 text-xl font-bold">Vendas</h2>
      {vendas.length === 0 ? <p className="mt-2 text-texto-2">Nenhuma venda marcada ainda.</p> : null}
      <ul className="mt-3 flex flex-col gap-3">
        {vendas.map((l) => (
          <li key={l.id} className="flex flex-col gap-2 rounded-2xl border border-linha p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">{l.titulo}</p>
              <p className="text-sm text-texto-2">
                Vendido por {formatarReais(Number(l.valor_venda))} em {l.vendido_em ? data.format(l.vendido_em) : '—'} · {l.vendedor} ({l.email}) · WhatsApp {l.whatsapp}
              </p>
              <p className="mt-1 font-semibold">
                Comissão {Number(l.comissao_percentual).toLocaleString('pt-BR')}%: {formatarReais(Number(l.comissao_valor))}{' '}
                {l.comissao_paga_em ? <span className="text-bom">· paga em {data.format(l.comissao_paga_em)}</span> : <span className="text-atencao">· a receber</span>}
              </p>
            </div>
            {l.comissao_paga_em ? null : <Acao chave={chave} id={l.id} acao="comissao-paga" rotulo="Marcar comissão paga" />}
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-xl font-bold">Anúncios</h2>
      {ativos.length === 0 ? <p className="mt-2 text-texto-2">Nenhum anúncio ainda.</p> : null}
      <ul className="mt-3 flex flex-col gap-3">
        {ativos.map((l) => (
          <li key={l.id} className="flex flex-col gap-2 rounded-2xl border border-linha p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <a href={`/maquina/${l.id}`} className="font-semibold text-marca underline underline-offset-2">
                {l.titulo}
              </a>
              <p className="text-sm text-texto-2">
                {rotuloCategoria(l.categoria)} · {formatarReais(Number(l.preco))} · {l.municipio}/{l.uf} · {l.situacao === 'pausado' ? 'pausado' : 'no ar'} desde{' '}
                {data.format(l.criado_em)} · {l.contatos} contato(s) · {l.vendedor} ({l.email})
              </p>
            </div>
            <Acao chave={chave} id={l.id} acao="remover" rotulo="Tirar do ar" perigo />
          </li>
        ))}
      </ul>
    </>
  );
}

/** Painel dos classificados: anúncios, contatos, vendas e comissões. Só abre com a chave do painel. */
export default function PainelMaquinas({ searchParams }: { searchParams: Busca }) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight">Máquinas: vendas e comissões</h1>
      <Suspense fallback={<p className="text-texto-2">Carregando…</p>}>
        <Painel searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
