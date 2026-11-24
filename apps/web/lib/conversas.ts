// Conversas dos classificados: comprador e vendedor falam pelo app. Quem recebe mensagem nova é avisado
// por push (navegador ou app); sem push que funcione, por e-mail, no máximo um a cada HORAS_ENTRE_EMAILS.
import { type ConversaAberta, type ConversaResumo, MAX_MENSAGEM, type MensagemConversa, type SituacaoAnuncio } from '@graoraiz/clima';
import { z } from 'zod';

import { SITE_URL } from '@/lib/config';
import { banco } from '@/lib/contas';
import { emailDisponivel, enviarEmail } from '@/lib/email';
import { avisarConta } from '@/lib/push';
import { registrarEvento } from '@/lib/telemetria';

const HORAS_ENTRE_EMAILS = 6;

export const esquemaMensagem = z.object({
  texto: z
    .string({ error: 'Escreva a mensagem.' })
    .transform((v) => v.trim())
    .pipe(z.string().min(1, 'Escreva a mensagem.').max(MAX_MENSAGEM, `Mensagem de até ${MAX_MENSAGEM} letras.`)),
});

export function conversaIdValido(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Abre (ou reabre) a conversa do comprador com o vendedor de um anúncio. Conversa nova só em anúncio no
 * ar e de outra pessoa; a que já existe abre sempre.
 */
export async function abrirConversa(anuncioId: string, compradorId: string): Promise<{ id: string } | { problema: 'fora' | 'proprio' }> {
  const existente = await banco().query<{ id: string }>('select id from app.conversa where anuncio_id = $1 and comprador_id = $2', [anuncioId, compradorId]);
  if (existente.rows[0]) return { id: existente.rows[0].id };
  const a = await banco().query<{ conta_id: string }>(`select conta_id from app.anuncio where id = $1 and situacao = 'ativo'`, [anuncioId]);
  if (!a.rows[0]) return { problema: 'fora' };
  if (a.rows[0].conta_id === compradorId) return { problema: 'proprio' };
  const r = await banco().query<{ id: string }>(
    `insert into app.conversa (anuncio_id, comprador_id, vendedor_id) values ($1, $2, $3)
     on conflict (anuncio_id, comprador_id) do update set anuncio_id = excluded.anuncio_id returning id`,
    [anuncioId, compradorId, a.rows[0].conta_id],
  );
  return { id: r.rows[0].id };
}

interface LinhaConversa {
  id: string;
  anuncio_id: string;
  titulo: string;
  foto: string | null;
  preco: string;
  situacao: SituacaoAnuncio;
  papel: 'vendedor' | 'comprador';
  com: string;
  atualizado_em: Date;
}

const CABECALHO = `
  c.id, c.anuncio_id, a.titulo, a.fotos[1]::text as foto, a.preco, a.situacao,
  case when c.vendedor_id = $1 then 'vendedor' else 'comprador' end as papel,
  split_part(o.nome, ' ', 1) as com, c.atualizado_em`;
const JUNCOES = `
  join app.anuncio a on a.id = c.anuncio_id
  join app.conta o on o.id = case when c.vendedor_id = $1 then c.comprador_id else c.vendedor_id end`;

function cabecalho(l: LinhaConversa): Omit<ConversaResumo, 'ultima' | 'naoLidas'> {
  return {
    id: l.id,
    anuncio: { id: l.anuncio_id, titulo: l.titulo, foto: l.foto, preco: Number(l.preco), situacao: l.situacao },
    com: l.com,
    papel: l.papel,
    atualizadaEm: l.atualizado_em.toISOString(),
  };
}

/** Conversas da conta, mais recentes primeiro. O vendedor só vê a conversa depois da primeira mensagem. */
export async function listarConversas(contaId: string): Promise<{ conversas: ConversaResumo[]; naoLidas: number }> {
  const r = await banco().query<LinhaConversa & { ultima_texto: string | null; ultima_minha: boolean | null; ultima_em: Date | null; nao_lidas: number }>(
    `select ${CABECALHO},
       m.texto as ultima_texto, m.autor_id = $1 as ultima_minha, m.criado_em as ultima_em,
       (select count(*)::int from app.mensagem x where x.conversa_id = c.id and x.autor_id <> $1
          and x.criado_em > case when c.vendedor_id = $1 then c.lida_vendedor_em else c.lida_comprador_em end) as nao_lidas
     from app.conversa c ${JUNCOES}
     left join lateral (select texto, autor_id, criado_em from app.mensagem where conversa_id = c.id order by id desc limit 1) m on true
     where (c.comprador_id = $1 or (c.vendedor_id = $1 and m.texto is not null))
     order by c.atualizado_em desc limit 100`,
    [contaId],
  );
  const conversas = r.rows.map((l) => ({
    ...cabecalho(l),
    ultima: l.ultima_texto === null ? null : { texto: l.ultima_texto, minha: Boolean(l.ultima_minha), em: (l.ultima_em as Date).toISOString() },
    naoLidas: l.nao_lidas,
  }));
  return { conversas, naoLidas: conversas.reduce((s, c) => s + c.naoLidas, 0) };
}

/**
 * Uma conversa com as mensagens (as últimas 200, ou só as depois de `depois` para quem já tem a tela aberta).
 * Abrir a conversa marca como lida. null quando não existe ou não é da conta.
 */
export async function abrirMensagens(conversaId: string, contaId: string, depois: number | null): Promise<ConversaAberta | null> {
  const c = await banco().query<LinhaConversa & { outro_leu_em: Date }>(
    `update app.conversa c set
        lida_vendedor_em = case when c.vendedor_id = $1 then now() else c.lida_vendedor_em end,
        lida_comprador_em = case when c.comprador_id = $1 then now() else c.lida_comprador_em end
      from app.anuncio a, app.conta o
      where c.id = $2 and (c.vendedor_id = $1 or c.comprador_id = $1)
        and a.id = c.anuncio_id and o.id = case when c.vendedor_id = $1 then c.comprador_id else c.vendedor_id end
      returning c.id, c.anuncio_id, a.titulo, a.fotos[1]::text as foto, a.preco, a.situacao,
        case when c.vendedor_id = $1 then 'vendedor' else 'comprador' end as papel,
        split_part(o.nome, ' ', 1) as com, c.atualizado_em,
        case when c.vendedor_id = $1 then c.lida_comprador_em else c.lida_vendedor_em end as outro_leu_em`,
    [contaId, conversaId],
  );
  const l = c.rows[0];
  if (!l) return null;
  const m =
    depois === null
      ? await banco().query<{ id: string; texto: string; minha: boolean; criado_em: Date }>(
          `select * from (select id, texto, autor_id = $2 as minha, criado_em from app.mensagem where conversa_id = $1 order by id desc limit 200) x order by id`,
          [conversaId, contaId],
        )
      : await banco().query<{ id: string; texto: string; minha: boolean; criado_em: Date }>(
          `select id, texto, autor_id = $2 as minha, criado_em from app.mensagem where conversa_id = $1 and id > $3 order by id limit 200`,
          [conversaId, contaId, depois],
        );
  const mensagens: MensagemConversa[] = m.rows.map((x) => ({ id: Number(x.id), texto: x.texto, minha: x.minha, em: x.criado_em.toISOString() }));
  return { ...cabecalho(l), mensagens, outroLeuEm: l.outro_leu_em.toISOString() };
}

interface Destino {
  conversa: string;
  anuncio: string;
  titulo: string;
  autor: string;
  outro: string;
  outro_email: string;
  outro_demo: boolean;
  papel_outro: 'vendedor' | 'comprador';
  email_em: Date | null;
  primeira: boolean;
}

/** Grava a mensagem. null quando a conversa não é da conta; "fora" quando o anúncio foi tirado do ar. */
export async function gravarMensagem(conversaId: string, contaId: string, texto: string): Promise<{ mensagem: MensagemConversa; destino: Destino } | null | 'fora'> {
  const d = await banco().query<Destino & { situacao: SituacaoAnuncio }>(
    `select c.id as conversa, c.anuncio_id as anuncio, a.titulo, a.situacao, split_part(eu.nome, ' ', 1) as autor,
        o.id as outro, o.email as outro_email, o.demo as outro_demo,
        case when c.vendedor_id = $1 then 'comprador' else 'vendedor' end as papel_outro,
        case when c.vendedor_id = $1 then c.email_comprador_em else c.email_vendedor_em end as email_em,
        not exists (select 1 from app.mensagem x where x.conversa_id = c.id) as primeira
       from app.conversa c join app.anuncio a on a.id = c.anuncio_id join app.conta eu on eu.id = $1
       join app.conta o on o.id = case when c.vendedor_id = $1 then c.comprador_id else c.vendedor_id end
      where c.id = $2 and (c.vendedor_id = $1 or c.comprador_id = $1)`,
    [contaId, conversaId],
  );
  const destino = d.rows[0];
  if (!destino) return null;
  if (destino.situacao === 'removido') return 'fora';
  const r = await banco().query<{ id: string; criado_em: Date }>(
    'insert into app.mensagem (conversa_id, autor_id, texto) values ($1, $2, $3) returning id, criado_em',
    [conversaId, contaId, texto],
  );
  await banco().query(
    `update app.conversa set atualizado_em = now(),
        lida_vendedor_em = case when vendedor_id = $1 then now() else lida_vendedor_em end,
        lida_comprador_em = case when comprador_id = $1 then now() else lida_comprador_em end
      where id = $2`,
    [contaId, conversaId],
  );
  // A primeira mensagem do comprador conta como contato com o vendedor (base da comissão, se voltar).
  if (destino.primeira && destino.papel_outro === 'vendedor') {
    await banco().query('insert into app.contato_anuncio (anuncio_id, conta_id) values ($1, $2) on conflict do nothing', [destino.anuncio, contaId]);
    registrarEvento({ nome: 'seller_contacted', origem: 'servidor', contaId, propriedades: { anuncio: destino.anuncio } });
  }
  return { mensagem: { id: Number(r.rows[0].id), texto, minha: true, em: r.rows[0].criado_em.toISOString() }, destino };
}

function trecho(texto: string, max: number): string {
  const t = texto.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** Avisa a outra pessoa da mensagem nova: push; sem push aceito, e-mail (com intervalo). Nunca lança. */
export async function avisarMensagem(destino: Destino, texto: string): Promise<void> {
  try {
    const caminho = `/conversa/${destino.conversa}`;
    const entregues = await avisarConta(destino.outro, {
      titulo: `${destino.autor} · ${trecho(destino.titulo, 40)}`,
      corpo: trecho(texto, 140),
      caminho,
      marca: `conversa-${destino.conversa}`,
    });
    if (entregues > 0 || destino.outro_demo || !emailDisponivel()) return;
    if (destino.email_em && Date.now() - destino.email_em.getTime() < HORAS_ENTRE_EMAILS * 3_600_000) return;
    const coluna = destino.papel_outro === 'vendedor' ? 'email_vendedor_em' : 'email_comprador_em';
    await banco().query(`update app.conversa set ${coluna} = now() where id = $1`, [destino.conversa]);
    await enviarEmail({
      para: destino.outro_email,
      assunto: `Nova mensagem sobre "${trecho(destino.titulo, 50)}"`,
      texto: [
        `${destino.autor} mandou uma mensagem no Grão Raiz sobre o anúncio "${destino.titulo}":`,
        '',
        `"${trecho(texto, 300)}"`,
        '',
        'Para responder, abra a conversa no app:',
        `${SITE_URL}${caminho}`,
        '',
        `Você recebe este e-mail porque tem uma conversa nos classificados do Grão Raiz. Enquanto não houver resposta, mandamos no máximo um aviso a cada ${HORAS_ENTRE_EMAILS} horas. Para receber o aviso no celular, toque em "Avisar de mensagem nova" na tela Conversas.`,
      ].join('\n'),
    });
  } catch (e) {
    console.error('[conversas] falha ao avisar:', e instanceof Error ? e.message : e);
  }
}
