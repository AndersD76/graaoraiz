// Iscas e leads: gravação com origem, descadastro em 1 clique e o boletim diário de pulverização por e-mail.
import { randomBytes } from 'node:crypto';
import { formatarJanela } from '@graoraiz/clima';
import { z } from 'zod';
import { SITE_URL } from '@/lib/config';
import { banco } from '@/lib/contas';
import { emailDisponivel, enviarEmail } from '@/lib/email';
import { registrarEvento } from '@/lib/telemetria';
import { canalDaVisita, iscaValida } from './config';
import { caminhoMunicipio } from './municipios';
import { calcularPrevisao } from './previsao';
import { rotuloData } from './textos-municipio';

const toque = z
  .object({
    utm_source: z.string().max(100).optional(),
    utm_medium: z.string().max(100).optional(),
    utm_campaign: z.string().max(150).optional(),
    referrer: z.string().max(300).optional(),
    landing: z.string().max(300).optional(),
    em: z.string().max(40).optional(),
  })
  .strip()
  .nullable()
  .optional();

export const esquemaLead = z.object({
  email: z.string().trim().toLowerCase().max(120).pipe(z.email({ error: 'E-mail inválido.' })),
  nome: z.string().trim().max(80).optional(),
  isca: z.string().max(60).refine(iscaValida, 'Isca inválida.'),
  municipio: z.string().regex(/^\d{7}$/).optional(),
  pagina: z.string().max(300).optional(),
  consulta: z.string().max(200).optional(),
  aceiteIsca: z.literal(true, { error: 'Marque que quer receber o boletim.' }),
  aceiteMarketing: z.boolean().default(false),
  primeiro: toque,
  ultimo: toque,
});
export type DadosLead = z.infer<typeof esquemaLead>;

/** Grava (ou reativa) o lead. Volta false se já estava inscrito nessa isca. */
export async function gravarLead(d: DadosLead): Promise<{ novo: boolean }> {
  const token = randomBytes(24).toString('base64url');
  const ultimo = d.ultimo ?? d.primeiro ?? null;
  const canal = canalDaVisita(ultimo?.referrer ?? null, ultimo?.utm_source ?? null, ultimo?.utm_medium ?? null);
  const origem = { primeiro: d.primeiro ?? null, ultimo: d.ultimo ?? null, canal: canal.canal, fonte: canal.fonte };
  const r = await banco().query<{ novo: boolean }>(
    `insert into app.lead (email, nome, isca, municipio_codigo, pagina, consulta, origem, aceite_isca, aceite_marketing, token)
     values ($1, $2, $3, $4, $5, $6, $7, true, $8, $9)
     on conflict (email, isca, municipio_codigo) do update
       set descadastrado_em = null, aceite_marketing = app.lead.aceite_marketing or excluded.aceite_marketing,
           nome = coalesce(excluded.nome, app.lead.nome)
     returning (xmax = 0) as novo`,
    [d.email, d.nome || null, d.isca, d.municipio ?? null, d.pagina ?? null, d.consulta ?? null, JSON.stringify(origem), d.aceiteMarketing, token],
  );
  registrarEvento({
    nome: 'lead_capturado',
    origem: 'servidor',
    pagina: d.pagina ?? null,
    propriedades: { isca_id: d.isca, municipio: d.municipio ?? null, canal: canal.canal, fonte: canal.fonte, marketing: d.aceiteMarketing },
  });
  return { novo: Boolean(r.rows[0]?.novo) };
}

/** Descadastro em 1 clique pelo token do e-mail. */
export async function descadastrar(token: string): Promise<boolean> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return false;
  const r = await banco().query('update app.lead set descadastrado_em = now() where token = $1 and descadastrado_em is null', [token]);
  return (r.rowCount ?? 0) > 0;
}

export async function leadPorToken(token: string): Promise<{ email: string; isca: string; descadastrado: boolean } | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const r = await banco().query<{ email: string; isca: string; descadastrado_em: Date | null }>('select email, isca, descadastrado_em from app.lead where token = $1', [token]);
  const l = r.rows[0];
  return l ? { email: l.email.replace(/^(.).*@/, '$1***@'), isca: l.isca, descadastrado: l.descadastrado_em !== null } : null;
}

/**
 * Boletim diário: para cada município com inscritos, calcula as janelas uma vez e manda um e-mail por inscrito.
 * Roda de manhã (horário de Brasília) e só uma vez por dia por lead. Sem a chave da Resend, não faz nada.
 */
export async function enviarBoletins(): Promise<{ enviados: number; falhas: number }> {
  if (!emailDisponivel() || !process.env.RESEND_API_KEY) return { enviados: 0, falhas: 0 };
  const inscritos = await banco().query<{ id: string; email: string; token: string; codigo: string; nome: string; uf: string; slug: string; lat: number; lon: number }>(
    `select l.id, l.email, l.token, m.codigo, m.nome, m.uf, m.slug, m.lat, m.lon
       from app.lead l join app.municipio_agro m on m.codigo = l.municipio_codigo
      where l.isca = 'boletim-pulverizacao-municipio' and l.descadastrado_em is null
        and not exists (select 1 from app.evento e where e.nome = 'isca_concluida' and e.propriedades->>'lead' = l.id::text
                          and e.criado_em > now() - interval '20 hours')
      order by m.codigo limit 2000`,
  );
  let enviados = 0;
  let falhas = 0;
  const cache = new Map<string, Awaited<ReturnType<typeof calcularPrevisao>>>();
  for (const l of inscritos.rows) {
    if (!cache.has(l.codigo)) cache.set(l.codigo, await calcularPrevisao(l.lat, l.lon));
    const p = cache.get(l.codigo);
    if (!p) continue;
    const pagina = `${SITE_URL}${caminhoMunicipio(l)}?utm_source=boletim&utm_medium=email&utm_campaign=boletim-pulverizacao`;
    const sair = `${SITE_URL}/descadastrar?t=${l.token}`;
    const linhas = p.dias.slice(0, 3).map((d) => `- ${rotuloData(d.data, p.hoje)}: ${d.melhorJanela ? `janela boa ${formatarJanela(d.melhorJanela)}` : d.status === 'atencao' ? 'só horários com cuidado' : 'sem janela boa'}${d.chuvaMm >= 1 ? `; chuva prevista de ${Math.round(d.chuvaMm)} mm` : ''}`);
    const texto = [
      `Bom dia! As janelas para pulverizar em ${l.nome} (${l.uf}):`,
      '',
      ...linhas,
      '',
      `Hora a hora (delta T, vento, umidade e chuva): ${pagina}`,
      'Para o ponto exato da sua lavoura, com aviso de geada e temporal no celular, use o app grátis: https://www.appgraoraiz.com.br/',
      '',
      'Previsões são estimativas: confira as condições no local antes de aplicar.',
      `Não quer mais receber? Descadastre em 1 clique: ${sair}`,
    ].join('\n');
    try {
      await enviarEmail({
        para: l.email,
        assunto: `Pulverização em ${l.nome}: ${p.dias[0]?.melhorJanela ? `janela hoje ${formatarJanela(p.dias[0].melhorJanela)}` : 'veja a semana'}`,
        texto,
        cabecalhos: { 'List-Unsubscribe': `<${SITE_URL}/api/descadastrar?t=${l.token}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      });
      registrarEvento({ nome: 'isca_concluida', origem: 'servidor', propriedades: { isca_id: 'boletim-pulverizacao-municipio', lead: l.id, municipio: l.codigo } });
      enviados++;
    } catch {
      falhas++;
    }
  }
  return { enviados, falhas };
}
