import { CATEGORIAS_MAQUINA, formatarReais, rotuloCategoria } from '@graoraiz/clima';
import { ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { mudarSituacaoAnuncio, removerAnuncio } from '@/app/admin/acoes';
import { BotaoAcao } from '@/components/admin/botao-acao';
import { CabecalhoPagina, CampoBusca, Cartao, Carregando, Celula, Filtros, fmtData, fmtNumero, LinkTexto, Paginacao, SeloSituacao, Tabela, Vazio } from '@/components/admin/ui';
import { exigirAdmin } from '@/lib/admin/auth';
import { anunciosAdmin, lerPagina, lerTexto, POR_PAGINA, SITUACOES_ANUNCIO } from '@/lib/admin/consultas';

export const metadata: Metadata = { title: 'Anúncios' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const FILTROS = [
  { valor: '', rotulo: 'Todos' },
  { valor: 'ativo', rotulo: 'No ar' },
  { valor: 'pausado', rotulo: 'Pausados' },
  { valor: 'vendido', rotulo: 'Vendidos' },
  { valor: 'removido', rotulo: 'Removidos' },
];

async function Conteudo({ searchParams }: Props) {
  await exigirAdmin();
  const sp = await searchParams;
  const q = lerTexto(sp.q);
  const situacaoLida = lerTexto(sp.situacao, 10);
  const situacao = (SITUACOES_ANUNCIO as readonly string[]).includes(situacaoLida) ? situacaoLida : '';
  const categoriaLida = lerTexto(sp.categoria, 20);
  const categoria = CATEGORIAS_MAQUINA.some((c) => c.valor === categoriaLida) ? categoriaLida : '';
  const pagina = lerPagina(sp.pagina);
  const { linhas, total } = await anunciosAdmin(q, situacao, categoria, pagina);
  const parametros = { q, situacao, categoria };

  return (
    <>
      <CabecalhoPagina titulo="Anúncios" descricao={`${fmtNumero.format(total)} ${total === 1 ? 'anúncio' : 'anúncios'} neste filtro.`}>
        <CampoBusca base="/admin/anuncios" valor={q} placeholder="Título, cidade ou vendedor" ocultos={{ situacao, categoria }} />
      </CabecalhoPagina>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Filtros opcoes={FILTROS} atual={situacao} base="/admin/anuncios" parametros={parametros} nome="situacao" />
        <Filtros
          opcoes={[{ valor: '', rotulo: 'Todas as categorias' }, ...CATEGORIAS_MAQUINA.map((c) => ({ valor: c.valor, rotulo: c.rotulo }))]}
          atual={categoria}
          base="/admin/anuncios"
          parametros={parametros}
          nome="categoria"
        />
      </div>
      <Cartao>
        {linhas.length ? (
          <Tabela legenda="Anúncios de máquinas" cabecalho={['Anúncio', 'Preço', 'Vendedor', 'Contatos', 'Situação', 'Ações']}>
            {linhas.map((a) => (
              <tr key={a.id} className="hover:bg-adm-fundo">
                <Celula>
                  <span className="flex items-center gap-3">
                    {a.foto ? (
                      // eslint-disable-next-line @next/next/no-img-element -- foto servida pela própria API, já reduzida
                      <img src={`/api/anuncios/fotos/${a.foto}`} alt="" width={56} height={42} loading="lazy" className="h-[42px] w-14 shrink-0 rounded-md object-cover" />
                    ) : (
                      <span className="h-[42px] w-14 shrink-0 rounded-md bg-adm-fundo" />
                    )}
                    <span className="min-w-0">
                      <span className="block max-w-72 truncate font-medium">{a.titulo}</span>
                      <span className="text-adm-texto-2">
                        {rotuloCategoria(a.categoria)} · {a.municipio}/{a.uf} · {fmtData.format(a.criado_em)}
                      </span>
                    </span>
                  </span>
                </Celula>
                <Celula className="whitespace-nowrap tabular-nums">{formatarReais(Number(a.preco))}</Celula>
                <Celula>
                  <LinkTexto href={`/admin/usuarios/${a.conta_id}`}>{a.vendedor}</LinkTexto>
                </Celula>
                <Celula className="tabular-nums">{a.contatos}</Celula>
                <Celula>
                  <SeloSituacao situacao={a.situacao} />
                </Celula>
                <Celula>
                  <span className="flex flex-wrap gap-2">
                    {a.situacao === 'ativo' || a.situacao === 'vendido' ? (
                      <a href={`/maquinas-usadas/${a.id}`} target="_blank" rel="noopener" className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-adm-marca hover:underline">
                        <ExternalLink className="size-4" aria-hidden /> Ver
                      </a>
                    ) : null}
                    {a.situacao === 'ativo' ? <BotaoAcao acao={mudarSituacaoAnuncio} campos={{ id: a.id, situacao: 'pausado' }} rotulo="Pausar" icone="pausar" /> : null}
                    {a.situacao === 'pausado' ? <BotaoAcao acao={mudarSituacaoAnuncio} campos={{ id: a.id, situacao: 'ativo' }} rotulo="Reativar" icone="reativar" /> : null}
                    {a.situacao === 'ativo' || a.situacao === 'pausado' ? (
                      <BotaoAcao
                        acao={removerAnuncio}
                        campos={{ id: a.id }}
                        rotulo="Tirar do ar"
                        icone="remover"
                        variante="perigo"
                        confirmar={`Tirar do ar “${a.titulo}”? O vendedor não consegue reativar.`}
                      />
                    ) : null}
                  </span>
                </Celula>
              </tr>
            ))}
          </Tabela>
        ) : (
          <Vazio titulo="Nenhum anúncio encontrado" texto={q || situacao || categoria ? 'Mude a busca ou os filtros.' : 'Quando alguém anunciar uma máquina, ela aparece aqui.'} />
        )}
        <Paginacao pagina={pagina} total={total} porPagina={POR_PAGINA} base="/admin/anuncios" parametros={parametros} />
      </Cartao>
    </>
  );
}

export default function Anuncios(props: Props) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo {...props} />
    </Suspense>
  );
}
