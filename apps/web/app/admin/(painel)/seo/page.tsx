import { Bot, FileText, Globe, Inbox, Search, Sparkles, Target, TrendingUp } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { mudarStatusAlvo, mudarStatusTexto } from '@/app/admin/acoes';
import { BotaoAcao } from '@/components/admin/botao-acao';
import { CabecalhoPagina, Cartao, CartaoNumero, Carregando, Celula, Filtros, fmtData, fmtDataHora, fmtNumero, LinkTexto, Selo, Tabela, Vazio } from '@/components/admin/ui';
import { exigirAdmin } from '@/lib/admin/auth';
import {
  alvosLink,
  canais,
  consultas,
  conversaoPorTipo,
  leads,
  lerAba,
  linhaDoTempo,
  mapaPorCluster,
  metricasRecentes,
  ondas,
  paginasPorTipo,
  reprovadasRecentes,
  resumoSeo,
  textos,
  topPaginas,
} from '@/lib/admin/seo';
import { lerTexto } from '@/lib/admin/consultas';
import { emailDisponivel } from '@/lib/email';
import { bingConfigurado, gscConfigurado } from '@/lib/seo/buscadores';
import { CLUSTERS } from '@/lib/seo/config';
import { TAMANHO_ONDA } from '@/lib/seo/rotina';

export const metadata: Metadata = { title: 'SEO' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const ABAS = [
  { valor: 'visao', rotulo: 'Visão geral' },
  { valor: 'paginas', rotulo: 'Páginas e portão' },
  { valor: 'buscas', rotulo: 'Mapa de buscas' },
  { valor: 'leads', rotulo: 'Leads' },
  { valor: 'links', rotulo: 'Alvos de link' },
  { valor: 'textos', rotulo: 'Textos prontos' },
];

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');

async function Visao() {
  const [r, conv, top, cs, tempo, metricas] = await Promise.all([resumoSeo(), conversaoPorTipo(30), topPaginas(30), canais(30), linhaDoTempo(15), metricasRecentes()]);
  const integracoes = [
    { nome: 'Search Console (API)', ok: gscConfigurado(), falta: 'GSC_CLIENT_EMAIL e GSC_PRIVATE_KEY' },
    { nome: 'Bing Webmaster (API)', ok: bingConfigurado(), falta: 'BING_WEBMASTER_API_KEY' },
    { nome: 'GA4 com Consent Mode', ok: Boolean(process.env.NEXT_PUBLIC_GA4_ID), falta: 'NEXT_PUBLIC_GA4_ID' },
    { nome: 'E-mail do boletim (Resend)', ok: Boolean(process.env.RESEND_API_KEY) && emailDisponivel(), falta: 'RESEND_API_KEY e EMAIL_REMETENTE' },
    { nome: 'Rotina de hora em hora', ok: Boolean(process.env.CRON_SECRET), falta: 'CRON_SECRET' },
    { nome: 'IndexNow', ok: Boolean(process.env.INDEXNOW_KEY), falta: 'INDEXNOW_KEY' },
  ];
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CartaoNumero rotulo="Páginas publicadas" valor={fmtNumero.format(r.publicadas)} icone={FileText} detalhe={`${fmtNumero.format(r.fila)} na fila · ondas de ${TAMANHO_ONDA}/semana`} />
        <CartaoNumero rotulo="Visitas orgânicas (7 dias)" valor={fmtNumero.format(r.visitas_org_7d)} icone={Search} detalhe={`${fmtNumero.format(r.visitas_ia_7d)} vindas de IAs`} />
        <CartaoNumero rotulo="Leads ativos" valor={fmtNumero.format(r.leads)} icone={Inbox} detalhe={`${fmtNumero.format(r.leads_7d)} nos últimos 7 dias`} />
        <CartaoNumero rotulo="Robôs de IA (7 dias)" valor={fmtNumero.format(r.crawlers_7d)} icone={Bot} detalhe={`${fmtNumero.format(r.iscas_7d)} iscas concluídas`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Cartao titulo="Conversão do conteúdo (30 dias)" descricao={`Visita → isca vista → iniciada → concluída → clique no app. Leads no período: ${fmtNumero.format(conv.leads)}.`}>
          {conv.linhas.length ? (
            <Tabela legenda="Conversão por tipo de página" cabecalho={['Tipo', 'Visitas', 'Isca vista', 'Iniciada', 'Concluída', 'Clique no app']}>
              {conv.linhas.map((l) => (
                <tr key={l.tipo}>
                  <Celula>{l.tipo}</Celula>
                  <Celula className="tabular-nums">{fmtNumero.format(l.visitas)}</Celula>
                  <Celula className="tabular-nums">{fmtNumero.format(l.isca_vista)} <span className="text-adm-texto-2">({pct(l.isca_vista, l.visitas)})</span></Celula>
                  <Celula className="tabular-nums">{fmtNumero.format(l.isca_iniciada)}</Celula>
                  <Celula className="tabular-nums">{fmtNumero.format(l.isca_concluida)}</Celula>
                  <Celula className="tabular-nums">{fmtNumero.format(l.cta)} <span className="text-adm-texto-2">({pct(l.cta, l.visitas)})</span></Celula>
                </tr>
              ))}
            </Tabela>
          ) : (
            <Vazio titulo="Sem visitas ainda" texto="Os eventos aparecem quando as páginas novas começarem a receber visitas." />
          )}
        </Cartao>
        <Cartao titulo="De onde vêm as visitas (30 dias)" descricao="Busca orgânica, IAs (ChatGPT, Perplexity, Gemini, Copilot, Claude), social e direto.">
          {cs.length ? (
            <Tabela legenda="Canais" cabecalho={['Canal', 'Fonte', 'Visitas']}>
              {cs.map((c) => (
                <tr key={`${c.canal}-${c.fonte}`}>
                  <Celula>
                    <Selo tom={c.canal === 'ia' ? 'marca' : c.canal === 'organico' ? 'bom' : 'neutro'}>{c.canal}</Selo>
                  </Celula>
                  <Celula>{c.fonte}</Celula>
                  <Celula className="tabular-nums">{fmtNumero.format(c.n)}</Celula>
                </tr>
              ))}
            </Tabela>
          ) : (
            <Vazio titulo="Sem visitas ainda" />
          )}
        </Cartao>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Cartao titulo="Top páginas (30 dias)" className="xl:col-span-2">
          {top.length ? (
            <Tabela legenda="Páginas mais visitadas" cabecalho={['Página', 'Visitas', 'Orgânicas', 'IA', 'Iscas']}>
              {top.map((p) => (
                <tr key={p.pagina}>
                  <Celula>
                    <LinkTexto href={p.pagina} externo>
                      {p.pagina}
                    </LinkTexto>
                  </Celula>
                  <Celula className="tabular-nums">{fmtNumero.format(p.visitas)}</Celula>
                  <Celula className="tabular-nums">{fmtNumero.format(p.organicas)}</Celula>
                  <Celula className="tabular-nums">{fmtNumero.format(p.ia)}</Celula>
                  <Celula className="tabular-nums">{fmtNumero.format(p.iscas)}</Celula>
                </tr>
              ))}
            </Tabela>
          ) : (
            <Vazio titulo="Sem visitas ainda" />
          )}
        </Cartao>
        <Cartao titulo="Integrações">
          <ul className="flex flex-col gap-2 text-sm">
            {integracoes.map((i) => (
              <li key={i.nome} className="flex items-start justify-between gap-3">
                <span>{i.nome}</span>
                {i.ok ? <Selo tom="bom">ligado</Selo> : <Selo tom="atencao">falta {i.falta}</Selo>}
              </li>
            ))}
          </ul>
        </Cartao>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Cartao titulo="Linha do tempo" descricao="Ondas de publicação e marcos.">
          {tempo.length ? (
            <ul className="-my-2 divide-y divide-adm-linha text-sm">
              {tempo.map((t) => (
                <li key={`${t.criado_em.toISOString()}-${t.texto}`} className="py-2">
                  <span className="text-adm-texto-2">{fmtDataHora.format(t.criado_em)} · </span>
                  {t.texto}
                </li>
              ))}
            </ul>
          ) : (
            <Vazio titulo="Nada ainda" />
          )}
        </Cartao>
        <Cartao titulo="Métricas diárias (30 dias)" descricao="Linha de base local; Search Console e Bing entram quando houver credencial.">
          {metricas.length ? (
            <Tabela legenda="Métricas diárias" cabecalho={['Dia', 'Fonte', 'Métrica', 'Valor']}>
              {metricas.slice(0, 40).map((m) => (
                <tr key={`${m.dia.toISOString()}-${m.fonte}-${m.chave}`}>
                  <Celula>{fmtData.format(m.dia)}</Celula>
                  <Celula>{m.fonte}</Celula>
                  <Celula>{m.chave}</Celula>
                  <Celula className="tabular-nums">{Number(m.valor).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}</Celula>
                </tr>
              ))}
            </Tabela>
          ) : (
            <Vazio titulo="Sem métricas ainda" />
          )}
        </Cartao>
      </div>
    </>
  );
}

async function Paginas() {
  const [tipos, rep, os] = await Promise.all([paginasPorTipo(), reprovadasRecentes(40), ondas()]);
  return (
    <div className="grid gap-6">
      <Cartao titulo="Páginas por tipo">
        <Tabela legenda="Páginas por tipo" cabecalho={['Tipo', 'Publicadas', 'Na fila', 'Reprovadas no portão', 'Avisadas ao IndexNow']}>
          {tipos.map((t) => (
            <tr key={t.tipo}>
              <Celula>{t.tipo}</Celula>
              <Celula className="tabular-nums">{fmtNumero.format(t.publicadas)}</Celula>
              <Celula className="tabular-nums">{fmtNumero.format(t.fila)}</Celula>
              <Celula className="tabular-nums">{fmtNumero.format(t.reprovadas)}</Celula>
              <Celula className="tabular-nums">{fmtNumero.format(t.indexnow)}</Celula>
            </tr>
          ))}
        </Tabela>
      </Cartao>
      <Cartao titulo="Ondas de publicação">
        {os.length ? (
          <ul className="flex flex-wrap gap-2 text-sm">
            {os.map((o) => (
              <li key={o.onda}>
                <Selo tom="marca">
                  Onda {o.onda}: {fmtNumero.format(o.n)} · {fmtData.format(o.em)}
                </Selo>
              </li>
            ))}
          </ul>
        ) : (
          <Vazio titulo="Nenhuma onda ainda" />
        )}
      </Cartao>
      <Cartao titulo="Fila de revisão: reprovadas no portão" descricao="Ficam na fila e tentam de novo na próxima onda; o motivo de cada regra está ao lado.">
        {rep.length ? (
          <Tabela legenda="Páginas reprovadas" cabecalho={['Página', 'Tipo', 'Motivos', 'Quando']}>
            {rep.map((p) => (
              <tr key={p.caminho}>
                <Celula>{p.caminho}</Celula>
                <Celula>{p.tipo}</Celula>
                <Celula className="text-adm-texto-2">{p.motivos.join(' · ')}</Celula>
                <Celula>{fmtDataHora.format(p.atualizada_em)}</Celula>
              </tr>
            ))}
          </Tabela>
        ) : (
          <Vazio titulo="Nenhuma reprovada" />
        )}
      </Cartao>
    </div>
  );
}

async function Buscas({ cluster, q }: { cluster: string | null; q: string }) {
  const [mapa, lista] = await Promise.all([mapaPorCluster(), consultas(cluster, q, 150)]);
  const total = mapa.reduce((s, m) => s + m.total, 0);
  return (
    <div className="grid gap-6">
      <Cartao titulo={`Mapa de buscas: ${fmtNumero.format(total)} consultas`} descricao="Autocomplete do Google e, quando conectados, Search Console e Bing. Volume só com Keyword Planner (não estimamos).">
        <Tabela legenda="Consultas por cluster" cabecalho={['Cluster', 'Consultas', 'Prioridade 1', 'Com página']}>
          {mapa.map((m) => (
            <tr key={m.cluster}>
              <Celula>
                <LinkTexto href={`/admin/seo?aba=buscas&cluster=${encodeURIComponent(m.cluster)}`}>{CLUSTERS[m.cluster as keyof typeof CLUSTERS] ?? m.cluster}</LinkTexto>
              </Celula>
              <Celula className="tabular-nums">{fmtNumero.format(m.total)}</Celula>
              <Celula className="tabular-nums">{fmtNumero.format(m.p1)}</Celula>
              <Celula className="tabular-nums">{fmtNumero.format(m.com_pagina)}</Celula>
            </tr>
          ))}
        </Tabela>
      </Cartao>
      <Cartao titulo={cluster ? `Consultas: ${CLUSTERS[cluster as keyof typeof CLUSTERS] ?? cluster}` : 'Consultas (as 150 primeiras por prioridade)'}>
        <form action="/admin/seo" method="get" className="mb-4 flex gap-2">
          <input type="hidden" name="aba" value="buscas" />
          {cluster ? <input type="hidden" name="cluster" value={cluster} /> : null}
          <input name="q" defaultValue={q} placeholder="Filtrar consultas" className="min-h-10 flex-1 rounded-lg border border-adm-linha bg-adm-cartao px-3 text-sm" />
          <button type="submit" className="rounded-lg border border-adm-linha px-3 text-sm font-semibold">
            Filtrar
          </button>
        </form>
        {lista.length ? (
          <Tabela legenda="Consultas" cabecalho={['Consulta', 'Intenção', 'Tipo de página', 'Isca', 'Prioridade', 'Página']}>
            {lista.map((c) => (
              <tr key={c.consulta}>
                <Celula>{c.consulta}</Celula>
                <Celula>{c.intencao}</Celula>
                <Celula>{c.tipo_pagina}</Celula>
                <Celula className="text-adm-texto-2">{c.isca ?? '—'}</Celula>
                <Celula>{c.prioridade}</Celula>
                <Celula>{c.pagina ? <LinkTexto href={c.pagina} externo>{c.pagina}</LinkTexto> : '—'}</Celula>
              </tr>
            ))}
          </Tabela>
        ) : (
          <Vazio titulo="Nenhuma consulta" />
        )}
      </Cartao>
    </div>
  );
}

async function Leads() {
  const lista = await leads(200);
  return (
    <Cartao titulo="Leads das iscas" descricao="Com a origem (canal e fonte) e o opt-in de novidades, que é separado e vem desmarcado.">
      {lista.length ? (
        <Tabela legenda="Leads" cabecalho={['Quando', 'E-mail', 'Isca', 'Município', 'Canal', 'Novidades', 'Situação']}>
          {lista.map((l) => (
            <tr key={l.id}>
              <Celula>{fmtDataHora.format(l.criado_em)}</Celula>
              <Celula>{l.email}</Celula>
              <Celula>{l.isca}</Celula>
              <Celula>{l.municipio ?? '—'}</Celula>
              <Celula>{l.canal ? `${l.canal} · ${l.fonte}` : '—'}</Celula>
              <Celula>{l.aceite_marketing ? <Selo tom="bom">sim</Selo> : <Selo>não</Selo>}</Celula>
              <Celula>{l.descadastrado_em ? <Selo tom="ruim">saiu</Selo> : <Selo tom="bom">ativo</Selo>}</Celula>
            </tr>
          ))}
        </Tabela>
      ) : (
        <Vazio titulo="Nenhum lead ainda" texto="Os pedidos do boletim por município aparecem aqui." />
      )}
    </Cartao>
  );
}

const PROXIMO_STATUS: Record<string, { status: string; rotulo: string }[]> = {
  a_contatar: [{ status: 'contatado', rotulo: 'Contatei' }, { status: 'descartado', rotulo: 'Descartar' }],
  contatado: [{ status: 'respondeu', rotulo: 'Respondeu' }, { status: 'link_obtido', rotulo: 'Link obtido' }],
  respondeu: [{ status: 'link_obtido', rotulo: 'Link obtido' }, { status: 'descartado', rotulo: 'Descartar' }],
  link_obtido: [],
  descartado: [{ status: 'a_contatar', rotulo: 'Reabrir' }],
};

async function Links({ status }: { status: string | null }) {
  const { linhas, contagem } = await alvosLink(status);
  return (
    <Cartao
      titulo="Alvos de link"
      descricao={`Organizações reais com a página onde o link caberia, o ativo a oferecer e a mensagem pronta. ${Object.entries(contagem).map(([k, v]) => `${k}: ${v}`).join(' · ')}`}
      acao={<Filtros opcoes={[{ valor: '', rotulo: 'Todos' }, ...Object.keys(PROXIMO_STATUS).map((s) => ({ valor: s, rotulo: s }))]} atual={status ?? ''} base="/admin/seo" parametros={{ aba: 'links' }} nome="status" />}
    >
      {linhas.length ? (
        <Tabela legenda="Alvos de link" cabecalho={['Organização', 'Onde o link cabe', 'Contato', 'Mensagem pronta', 'Status']}>
          {linhas.map((a) => (
            <tr key={a.id} className="align-top">
              <Celula>
                <span className="font-medium">{a.nome}</span>
                <span className="block text-adm-texto-2">
                  {a.tipo}
                  {a.uf ? ` · ${a.uf}` : ''} · P{a.prioridade}
                </span>
              </Celula>
              <Celula>
                {a.pagina_alvo ? (
                  <LinkTexto href={a.pagina_alvo} externo>
                    abrir página
                  </LinkTexto>
                ) : (
                  '—'
                )}
                <span className="block max-w-56 text-adm-texto-2">{a.ativo}</span>
              </Celula>
              <Celula className="break-all">{a.contato || '—'}</Celula>
              <Celula>
                <details>
                  <summary className="cursor-pointer text-adm-marca">ver texto</summary>
                  <p className="mt-2 max-w-md whitespace-pre-wrap text-adm-texto-2">{a.mensagem}</p>
                </details>
              </Celula>
              <Celula>
                <Selo tom={a.status === 'link_obtido' ? 'bom' : a.status === 'descartado' ? 'neutro' : 'atencao'}>{a.status}</Selo>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(PROXIMO_STATUS[a.status] ?? []).map((p) => (
                    <BotaoAcao key={p.status} acao={mudarStatusAlvo} campos={{ id: String(a.id), status: p.status }} rotulo={p.rotulo} />
                  ))}
                </div>
              </Celula>
            </tr>
          ))}
        </Tabela>
      ) : (
        <Vazio titulo="Nenhum alvo" />
      )}
    </Cartao>
  );
}

async function Textos({ tipo }: { tipo: string | null }) {
  const { linhas, contagem } = await textos(tipo);
  const opcoes = [{ valor: '', rotulo: 'Todos' }, ...['artigo_convidado', 'diretorio', 'linkedin', 'video'].map((t) => ({ valor: t, rotulo: `${t} (${contagem[t] ?? 0})` }))];
  return (
    <Cartao titulo="Textos prontos" descricao="Artigos de convidado, cadastros em diretórios e a fila de distribuição (LinkedIn e roteiros de vídeo). Aprove, publique e marque aqui." acao={<Filtros opcoes={opcoes} atual={tipo ?? ''} base="/admin/seo" parametros={{ aba: 'textos' }} nome="tipo" />}>
      {linhas.length ? (
        <Tabela legenda="Textos prontos" cabecalho={['Tipo', 'Título', 'Para', 'Texto', 'Status']}>
          {linhas.map((t) => (
            <tr key={t.id} className="align-top">
              <Celula>{t.tipo}</Celula>
              <Celula className="font-medium">{t.titulo}</Celula>
              <Celula className="text-adm-texto-2">{t.alvo ?? t.pagina ?? '—'}</Celula>
              <Celula>
                <details>
                  <summary className="cursor-pointer text-adm-marca">ver texto</summary>
                  <p className="mt-2 max-w-lg whitespace-pre-wrap text-adm-texto-2">{t.corpo}</p>
                </details>
              </Celula>
              <Celula>
                <Selo tom={t.status === 'publicado' ? 'bom' : t.status === 'aprovado' ? 'marca' : t.status === 'descartado' ? 'neutro' : 'atencao'}>{t.status}</Selo>
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.status === 'rascunho' ? <BotaoAcao acao={mudarStatusTexto} campos={{ id: String(t.id), status: 'aprovado' }} rotulo="Aprovar" /> : null}
                  {t.status === 'aprovado' ? <BotaoAcao acao={mudarStatusTexto} campos={{ id: String(t.id), status: 'publicado' }} rotulo="Publiquei" /> : null}
                  {t.status !== 'descartado' && t.status !== 'publicado' ? <BotaoAcao acao={mudarStatusTexto} campos={{ id: String(t.id), status: 'descartado' }} rotulo="Descartar" /> : null}
                </div>
              </Celula>
            </tr>
          ))}
        </Tabela>
      ) : (
        <Vazio titulo="Nenhum texto" />
      )}
    </Cartao>
  );
}

async function Conteudo({ searchParams }: Props) {
  await exigirAdmin();
  const p = await searchParams;
  const aba = lerAba(p.aba);
  const cluster = lerTexto(p.cluster, 40) || null;
  return (
    <>
      <CabecalhoPagina titulo="SEO e conteúdo" descricao="Páginas publicadas, portão de qualidade, mapa de buscas, leads das iscas, alvos de link e textos para divulgar.">
        <span className="hidden items-center gap-2 text-sm text-adm-texto-2 lg:inline-flex">
          <Globe className="size-4" aria-hidden /> <TrendingUp className="size-4" aria-hidden /> <Target className="size-4" aria-hidden /> <Sparkles className="size-4" aria-hidden />
        </span>
      </CabecalhoPagina>
      <div className="mb-6">
        <Filtros opcoes={ABAS} atual={aba} base="/admin/seo" parametros={{}} nome="aba" />
      </div>
      {aba === 'visao' ? <Visao /> : null}
      {aba === 'paginas' ? <Paginas /> : null}
      {aba === 'buscas' ? <Buscas cluster={cluster} q={lerTexto(p.q, 80)} /> : null}
      {aba === 'leads' ? <Leads /> : null}
      {aba === 'links' ? <Links status={lerTexto(p.status, 20) || null} /> : null}
      {aba === 'textos' ? <Textos tipo={lerTexto(p.tipo, 20) || null} /> : null}
    </>
  );
}

export default function Seo(props: Props) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo {...props} />
    </Suspense>
  );
}
