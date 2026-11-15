import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CabecalhoPagina, CampoBusca, Cartao, Carregando, Celula, Filtros, fmtData, fmtNumero, LinkTexto, Paginacao, Selo, Tabela, Vazio } from '@/components/admin/ui';
import { exigirAdmin } from '@/lib/admin/auth';
import { contas, lerFiltroContas, lerPagina, lerTexto, POR_PAGINA } from '@/lib/admin/consultas';

export const metadata: Metadata = { title: 'Usuários' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const FILTROS = [
  { valor: 'reais', rotulo: 'Produtores' },
  { valor: 'admin', rotulo: 'Administradores' },
  { valor: 'demo', rotulo: 'Demonstração' },
  { valor: 'todas', rotulo: 'Todas' },
];

async function Conteudo({ searchParams }: Props) {
  await exigirAdmin();
  const sp = await searchParams;
  const q = lerTexto(sp.q);
  const filtro = lerFiltroContas(sp.filtro);
  const pagina = lerPagina(sp.pagina);
  const { linhas, total } = await contas(q, filtro, pagina);
  const parametros = { q, filtro };

  return (
    <>
      <CabecalhoPagina titulo="Usuários" descricao={`${fmtNumero.format(total)} ${total === 1 ? 'conta' : 'contas'} neste filtro.`}>
        <CampoBusca base="/admin/usuarios" valor={q} placeholder="Nome ou e-mail" ocultos={{ filtro }} />
      </CabecalhoPagina>
      <div className="mb-4">
        <Filtros opcoes={FILTROS} atual={filtro} base="/admin/usuarios" parametros={parametros} nome="filtro" />
      </div>
      <Cartao>
        {linhas.length ? (
          <Tabela legenda="Contas do app" cabecalho={['Conta', 'Criada em', 'Origem', 'Talhões', 'Anúncios', 'Última sincronização', '']}>
            {linhas.map((c) => (
              <tr key={c.id} className="hover:bg-adm-fundo">
                <Celula>
                  <LinkTexto href={`/admin/usuarios/${c.id}`}>{c.nome}</LinkTexto>
                  <span className="block text-adm-texto-2">{c.email}</span>
                </Celula>
                <Celula className="tabular-nums">{fmtData.format(c.criado_em)}</Celula>
                <Celula className="text-adm-texto-2">{c.fonte ?? 'direto'}</Celula>
                <Celula className="tabular-nums">{c.talhoes}</Celula>
                <Celula className="tabular-nums">{c.anuncios}</Celula>
                <Celula className="tabular-nums text-adm-texto-2">{c.sincronizado_em ? fmtData.format(c.sincronizado_em) : '—'}</Celula>
                <Celula>
                  <span className="flex gap-1">
                    {c.admin ? <Selo tom="marca">Admin</Selo> : null}
                    {c.demo ? <Selo>Demonstração</Selo> : null}
                  </span>
                </Celula>
              </tr>
            ))}
          </Tabela>
        ) : (
          <Vazio titulo="Nenhuma conta encontrada" texto={q ? 'Tente outro nome ou e-mail.' : undefined} />
        )}
        <Paginacao pagina={pagina} total={total} porPagina={POR_PAGINA} base="/admin/usuarios" parametros={parametros} />
      </Cartao>
    </>
  );
}

export default function Usuarios(props: Props) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo {...props} />
    </Suspense>
  );
}
