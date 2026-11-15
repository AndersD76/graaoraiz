import { formatarReais } from '@graoraiz/clima';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CabecalhoPagina, CampoBusca, Cartao, Carregando, fmtData, LinkTexto, SeloSituacao, Vazio } from '@/components/admin/ui';
import { exigirAdmin } from '@/lib/admin/auth';
import { buscaGeral, lerTexto } from '@/lib/admin/consultas';

export const metadata: Metadata = { title: 'Busca' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function Conteudo({ searchParams }: Props) {
  await exigirAdmin();
  const q = lerTexto((await searchParams).q);
  const r = q.length >= 2 ? await buscaGeral(q) : { contas: [], anuncios: [] };

  return (
    <>
      <CabecalhoPagina titulo="Busca" descricao={q.length >= 2 ? `Resultados para “${q}”.` : 'Digite pelo menos 2 letras.'}>
        <CampoBusca base="/admin/busca" valor={q} placeholder="Nome, e-mail, máquina ou cidade" />
      </CabecalhoPagina>
      <div className="grid gap-6 xl:grid-cols-2">
        <Cartao titulo="Contas">
          {r.contas.length ? (
            <ul className="-my-2 divide-y divide-adm-linha text-sm">
              {r.contas.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <LinkTexto href={`/admin/usuarios/${c.id}`}>{c.nome}</LinkTexto>
                    <span className="block truncate text-adm-texto-2">{c.email}</span>
                  </span>
                  <span className="shrink-0 text-adm-texto-2">{fmtData.format(c.criado_em)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Vazio titulo="Nenhuma conta" />
          )}
        </Cartao>
        <Cartao titulo="Anúncios">
          {r.anuncios.length ? (
            <ul className="-my-2 divide-y divide-adm-linha text-sm">
              {r.anuncios.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <LinkTexto href={`/admin/anuncios?q=${encodeURIComponent(a.titulo)}`}>{a.titulo}</LinkTexto>
                    <span className="block truncate text-adm-texto-2">
                      {formatarReais(Number(a.preco))} · {a.municipio}/{a.uf} · {a.vendedor}
                    </span>
                  </span>
                  <SeloSituacao situacao={a.situacao} />
                </li>
              ))}
            </ul>
          ) : (
            <Vazio titulo="Nenhum anúncio" />
          )}
        </Cartao>
      </div>
    </>
  );
}

export default function Busca(props: Props) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo {...props} />
    </Suspense>
  );
}
