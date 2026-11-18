import { CULTURAS, type Cultura, formatarReais, rotuloCategoria } from '@graoraiz/clima';
import { ChevronLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { type ReactNode, Suspense } from 'react';
import { excluirConta, mudarAdmin } from '@/app/admin/acoes';
import { BotaoAcao } from '@/components/admin/botao-acao';
import { CabecalhoPagina, Cartao, Carregando, Celula, fmtData, fmtDataHora, fmtNumero, LinkTexto, Selo, SeloSituacao, Tabela, Vazio } from '@/components/admin/ui';
import { exigirAdmin } from '@/lib/admin/auth';
import { anunciosAdmin, eventosDaConta, fichaConta } from '@/lib/admin/consultas';
import { idValido } from '@/lib/maquinas';

export const metadata: Metadata = { title: 'Ficha da conta' };

type Props = { params: Promise<{ id: string }> };

interface TalhaoSalvo {
  id?: string;
  nome?: string;
  cultura?: string | null;
  areaHa?: number | null;
  dataPlantio?: string | null;
  criadoEm?: string;
}

const lista = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-adm-texto-2">{rotulo}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function Toque({ titulo, toque }: { titulo: string; toque: Record<string, string> | null | undefined }) {
  if (!toque) return <Dado rotulo={titulo}>—</Dado>;
  const partes = [toque.utm_source && `fonte: ${toque.utm_source}`, toque.utm_campaign && `campanha: ${toque.utm_campaign}`, toque.referrer && `veio de: ${toque.referrer}`, toque.landing && `entrou por: ${toque.landing}`].filter(Boolean);
  return <Dado rotulo={titulo}>{partes.length ? partes.join(' · ') : 'acesso direto'}</Dado>;
}

async function Conteudo({ params }: Props) {
  const admin = await exigirAdmin();
  const { id } = await params;
  if (!idValido(id)) notFound();
  const [conta, anuncios, eventos] = await Promise.all([fichaConta(id), anunciosAdmin('', '', '', 1, id), eventosDaConta(id)]);
  if (!conta) notFound();

  // Do estado do app, só o necessário para o suporte: nada de CPF/CNPJ, fotos ou localização exata na tela.
  const estado = conta.estado ?? {};
  const talhoes = lista(estado.talhoes) as TalhaoSalvo[];
  const area = talhoes.reduce((s, t) => s + (typeof t.areaHa === 'number' ? t.areaHa : 0), 0);
  const seguro = (estado.seguro as { tipo?: string } | undefined)?.tipo;
  const propria = conta.id === admin.id;

  return (
    <>
      <Link href="/admin/usuarios" className="mb-3 inline-flex items-center gap-1 text-sm text-adm-texto-2 hover:text-adm-texto">
        <ChevronLeft className="size-4" aria-hidden /> Usuários
      </Link>
      <CabecalhoPagina titulo={conta.nome} descricao={conta.email}>
        {conta.admin ? <Selo tom="marca">Administrador</Selo> : null}
        {conta.demo ? <Selo>Demonstração</Selo> : null}
        {!conta.demo && !propria ? (
          <>
            <BotaoAcao
              acao={mudarAdmin}
              campos={{ id: conta.id, admin: conta.admin ? 'nao' : 'sim' }}
              rotulo={conta.admin ? 'Tirar acesso ao painel' : 'Dar acesso ao painel'}
              icone={conta.admin ? 'semAdmin' : 'admin'}
              confirmar={conta.admin ? `Tirar o acesso de ${conta.nome} ao painel?` : `Dar a ${conta.nome} acesso total ao painel?`}
            />
            <BotaoAcao
              acao={excluirConta}
              depois="/admin/usuarios"
              campos={{ id: conta.id }}
              rotulo="Excluir conta"
              icone="remover"
              variante="perigo"
              confirmar={`Excluir a conta de ${conta.nome}? Os talhões, anúncios e registros dela são apagados e não voltam. As vendas já registradas ficam.`}
            />
          </>
        ) : null}
      </CabecalhoPagina>

      <div className="grid gap-6 lg:grid-cols-3">
        <Cartao titulo="Conta">
          <dl className="flex flex-col gap-3 text-sm">
            <Dado rotulo="Criada em">{fmtDataHora.format(conta.criado_em)}</Dado>
            <Dado rotulo="Última sincronização do app">{conta.sincronizado_em ? fmtDataHora.format(conta.sincronizado_em) : 'nunca'}</Dado>
            <Toque titulo="Primeiro acesso" toque={conta.origem?.primeiro} />
            <Toque titulo="Último acesso por link" toque={conta.origem?.ultimo} />
          </dl>
        </Cartao>
        <Cartao titulo="Uso do app" className="lg:col-span-2">
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <Dado rotulo="Talhões">{fmtNumero.format(talhoes.length)}</Dado>
            <Dado rotulo="Área informada">{area > 0 ? `${fmtNumero.format(Math.round(area * 10) / 10)} ha` : '—'}</Dado>
            <Dado rotulo="Chuvas anotadas">{fmtNumero.format(lista(estado.chuvas).length)}</Dado>
            <Dado rotulo="Aplicações no caderno">{fmtNumero.format(lista(estado.aplicacoes).length)}</Dado>
            <Dado rotulo="Ocorrências (prova)">{fmtNumero.format(lista(estado.eventos).length)}</Dado>
            <Dado rotulo="Seguro">{seguro && seguro !== 'nenhum' ? seguro.toUpperCase() : 'não informado'}</Dado>
            <Dado rotulo="Plano">{estado.pro === true ? 'Pro (loja)' : 'Grátis'}</Dado>
            <Dado rotulo="Documento do produtor">{typeof estado.documentoProdutor === 'string' && estado.documentoProdutor ? 'informado (oculto)' : 'não informado'}</Dado>
          </dl>
        </Cartao>
      </div>

      <div className="mt-6">
        <Cartao titulo="Talhões">
          {talhoes.length ? (
            <Tabela legenda="Talhões da conta" cabecalho={['Nome', 'Cultura', 'Área', 'Plantio', 'Cadastrado em']}>
              {talhoes.map((t, i) => (
                <tr key={t.id ?? i}>
                  <Celula className="font-medium">{t.nome ?? '—'}</Celula>
                  <Celula>{t.cultura && t.cultura in CULTURAS ? CULTURAS[t.cultura as Cultura].rotulo : '—'}</Celula>
                  <Celula className="tabular-nums">{typeof t.areaHa === 'number' ? `${fmtNumero.format(t.areaHa)} ha` : '—'}</Celula>
                  <Celula className="tabular-nums">{t.dataPlantio ? fmtData.format(new Date(`${t.dataPlantio}T12:00:00Z`)) : '—'}</Celula>
                  <Celula className="tabular-nums">{t.criadoEm ? fmtData.format(new Date(t.criadoEm)) : '—'}</Celula>
                </tr>
              ))}
            </Tabela>
          ) : (
            <Vazio titulo="Nenhum talhão cadastrado" />
          )}
        </Cartao>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Cartao titulo="Anúncios">
          {anuncios.linhas.length ? (
            <ul className="-my-2 divide-y divide-adm-linha text-sm">
              {anuncios.linhas.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{a.titulo}</span>
                    <span className="text-adm-texto-2">
                      {rotuloCategoria(a.categoria)} · {formatarReais(Number(a.preco))} · {a.contatos} contato(s)
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
        <Cartao titulo="Últimos eventos" descricao="Passos registrados no funil (até 30).">
          {eventos.length ? (
            <ul className="-my-2 divide-y divide-adm-linha text-sm">
              {eventos.map((e, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2">
                  <code className="text-xs">{e.nome}</code>
                  <span className="tabular-nums text-adm-texto-2">{fmtDataHora.format(e.criado_em)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Vazio titulo="Nenhum evento registrado" />
          )}
        </Cartao>
      </div>
      <p className="mt-6 text-sm text-adm-texto-2">
        Vendas desta conta: <LinkTexto href="/admin/vendas?status=todas">Vendas</LinkTexto>.
      </p>
    </>
  );
}

export default function FichaConta(props: Props) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo {...props} />
    </Suspense>
  );
}
