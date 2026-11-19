import { CircleAlert, CircleCheck } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { mudarAdmin } from '@/app/admin/acoes';
import { BotaoAcao } from '@/components/admin/botao-acao';
import { FormNovoAdmin } from '@/components/admin/formularios';
import { CabecalhoPagina, Cartao, Carregando, Celula, fmtData, fmtDataHora, LinkTexto, Selo, Tabela, Vazio } from '@/components/admin/ui';
import { exigirAdmin } from '@/lib/admin/auth';
import { acoesRecentes, administradores, pingBanco } from '@/lib/admin/consultas';
import { APP_STORE_URL, CONTATO_EMAIL, PLAY_URL, RESPONSAVEL, RESPONSAVEL_PENDENTE, SITE_URL } from '@/lib/config';
import { chaveIndexNow } from '@/lib/indexnow';
import { comissaoPercentual } from '@/lib/maquinas';

export const metadata: Metadata = { title: 'Configurações' };

/** Nomes legíveis do registro de ações. */
const ACOES: Record<string, string> = {
  entrou: 'Entrou no painel',
  primeiro_acesso: 'Criou o primeiro acesso',
  anuncio_pausado: 'Pausou anúncio',
  anuncio_reativado: 'Reativou anúncio',
  anuncio_removido: 'Tirou anúncio do ar',
  comissao_paga: 'Marcou comissão paga',
  comissao_reaberta: 'Reabriu comissão',
  conta_excluida: 'Excluiu conta',
  admin_concedido: 'Deu acesso ao painel',
  admin_retirado: 'Tirou acesso ao painel',
  planilha_vendas: 'Baixou a planilha de vendas',
  alvo_link_atualizado: 'Atualizou alvo de link',
  texto_atualizado: 'Atualizou texto de divulgação',
};

function Item({ ok, titulo, texto }: { ok: boolean; titulo: string; texto: string }) {
  const Icone = ok ? CircleCheck : CircleAlert;
  return (
    <li className="flex items-start gap-3 py-3">
      <Icone className={`mt-0.5 size-5 shrink-0 ${ok ? 'text-adm-bom' : 'text-adm-atencao'}`} aria-hidden />
      <span className="min-w-0 text-sm">
        <span className="font-semibold">{titulo}</span> <span className="sr-only">{ok ? '(ok)' : '(pendente)'}</span>
        <span className="block break-words text-adm-texto-2">{texto}</span>
      </span>
    </li>
  );
}

async function Conteudo() {
  const admin = await exigirAdmin();
  const [ms, admins, acoes] = await Promise.all([pingBanco().catch(() => null), administradores(), acoesRecentes()]);
  const env = process.env;
  const site = SITE_URL.startsWith('https://');

  return (
    <>
      <CabecalhoPagina titulo="Configurações" descricao="Situação do servidor e de quem pode entrar no painel. Nenhum segredo aparece aqui." />

      <div className="grid gap-6 xl:grid-cols-2">
        <Cartao titulo="Integrações" descricao="Variáveis do serviço no Railway.">
          <ul className="-my-3 divide-y divide-adm-linha">
            <Item ok={ms !== null} titulo="Banco de dados (Neon)" texto={ms !== null ? `respondendo em ${ms} ms` : 'sem resposta: confira DATABASE_URL'} />
            <Item ok={(env.AUTH_SECRET ?? '').length >= 32} titulo="Segredo das sessões" texto="AUTH_SECRET com 32 caracteres ou mais" />
            <Item ok={site} titulo="Endereço do site" texto={SITE_URL} />
            <Item ok={Boolean(env.RESEND_API_KEY && env.EMAIL_REMETENTE)} titulo="E-mail (Resend)" texto={env.RESEND_API_KEY ? 'configurado: o “esqueci a senha” funciona' : 'falta RESEND_API_KEY e EMAIL_REMETENTE: o “esqueci a senha” não funciona'} />
            <Item ok={Boolean(chaveIndexNow())} titulo="Aviso aos buscadores (IndexNow)" texto={chaveIndexNow() ? 'INDEXNOW_KEY configurada' : 'falta INDEXNOW_KEY'} />
            <Item ok={!CONTATO_EMAIL.endsWith('@graoraiz.com.br')} titulo="E-mail de contato" texto={`${CONTATO_EMAIL}${CONTATO_EMAIL.endsWith('@graoraiz.com.br') ? ' (domínio antigo, não recebe e-mail)' : ''}`} />
            <Item ok={!RESPONSAVEL_PENDENTE} titulo="Responsável pelos dados (LGPD)" texto={RESPONSAVEL} />
            <Item
              ok
              titulo="Comissão dos classificados"
              texto={
                comissaoPercentual() > 0
                  ? `${comissaoPercentual().toLocaleString('pt-BR')}% sobre a venda (COMISSAO_PERCENTUAL)`
                  : 'Desligada: anunciar e vender é grátis. Para cobrar, defina COMISSAO_PERCENTUAL (vale para anúncios novos).'
              }
            />
            <Item ok={Boolean(PLAY_URL && APP_STORE_URL)} titulo="Lojas de aplicativos" texto={PLAY_URL || APP_STORE_URL ? [PLAY_URL && 'Google Play', APP_STORE_URL && 'App Store'].filter(Boolean).join(' e ') : 'ainda sem link das lojas (web primeiro)'} />
          </ul>
        </Cartao>

        <div className="flex flex-col gap-6">
          <Cartao titulo="Administradores" descricao="Quem entra aqui vê dados pessoais dos produtores. Dê acesso só a quem precisa.">
            <ul className="-my-2 mb-4 divide-y divide-adm-linha">
              {admins.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <LinkTexto href={`/admin/usuarios/${a.id}`}>{a.nome}</LinkTexto>
                    <span className="block truncate text-adm-texto-2">
                      {a.email} · conta de {fmtData.format(a.criado_em)}
                    </span>
                  </span>
                  {a.id === admin.id ? (
                    <Selo tom="marca">Você</Selo>
                  ) : (
                    <BotaoAcao acao={mudarAdmin} campos={{ id: a.id, admin: 'nao' }} rotulo="Tirar acesso" icone="semAdmin" variante="perigo" confirmar={`Tirar o acesso de ${a.nome} ao painel?`} />
                  )}
                </li>
              ))}
            </ul>
            <FormNovoAdmin />
          </Cartao>
        </div>
      </div>

      <div className="mt-6">
        <Cartao titulo="Registro de ações" descricao="As 50 mais recentes. Fica guardado mesmo se o administrador sair.">
          {acoes.length ? (
            <Tabela legenda="Registro de ações do painel" cabecalho={['Quando', 'Quem', 'O quê', 'Em quê']}>
              {acoes.map((a, i) => (
                <tr key={i}>
                  <Celula className="whitespace-nowrap tabular-nums">{fmtDataHora.format(a.criado_em)}</Celula>
                  <Celula>{a.admin_nome}</Celula>
                  <Celula>{ACOES[a.acao] ?? a.acao}</Celula>
                  <Celula className="text-adm-texto-2">
                    {typeof a.detalhes.titulo === 'string' ? a.detalhes.titulo : typeof a.detalhes.nome === 'string' ? a.detalhes.nome : a.alvo ? <code className="text-xs">{a.alvo.slice(0, 8)}</code> : '—'}
                  </Celula>
                </tr>
              ))}
            </Tabela>
          ) : (
            <Vazio titulo="Nenhuma ação registrada" />
          )}
        </Cartao>
      </div>
    </>
  );
}

export default function Configuracoes() {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo />
    </Suspense>
  );
}
