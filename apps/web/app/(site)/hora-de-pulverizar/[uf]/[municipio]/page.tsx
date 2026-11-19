import { formatarHora, formatarJanela, ROTULO_GEADA, type Status } from '@graoraiz/clima';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { IscaBoletim } from '@/components/seo/isca-boletim';
import { Autoria, ChamadaApp, Fontes, JsonLd, Perguntas, Trilha } from '@/components/seo/pecas';
import { Rastreio } from '@/components/seo/rastreio';
import { NOME_ESTADO } from '@/lib/ufs';
import { metadadosPagina } from '@/lib/metadados';
import { absoluta } from '@/lib/seo';
import { caminhoMunicipio, culturasOrdenadas, municipioPublicado, vizinhosPublicados } from '@/lib/seo/municipios';
import { dataDeHoje, slugsDoGlossario } from '@/lib/seo/paginas';
import { previsaoPulverizacao } from '@/lib/seo/previsao';
import { consultaMunicipio, descricaoMunicipio, inicialMinuscula, respostaMunicipio, resumoCulturas, rotuloData, tituloMunicipio } from '@/lib/seo/textos-municipio';

type Props = { params: Promise<{ uf: string; municipio: string }> };

// Com Cache Components a rota dinâmica precisa de um parâmetro no build; o marcador não existe no banco (404).
export function generateStaticParams() {
  return [{ uf: 'pr', municipio: 'exemplo' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uf, municipio } = await params;
  const m = await municipioPublicado(uf, municipio);
  if (!m) return { title: 'Município não encontrado', robots: { index: false } };
  return metadadosPagina({ titulo: tituloMunicipio(m), tituloAbsoluto: true, descricao: descricaoMunicipio(m), caminho: caminhoMunicipio(m) });
}

const ROTULO_STATUS: Record<Status, string> = { bom: 'Boa', atencao: 'Com cuidado', ruim: 'Não aplicar' };
const COR_STATUS: Record<Status, string> = {
  bom: 'bg-bom/10 text-bom border-bom/30',
  atencao: 'bg-atencao/10 text-atencao border-atencao/30',
  ruim: 'bg-ruim/10 text-ruim border-ruim/30',
};
const fmtN = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const fmt1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function Selo({ status }: { status: Status }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${COR_STATUS[status]}`}>{ROTULO_STATUS[status]}</span>;
}

async function Conteudo({ params }: Props) {
  const { uf, municipio } = await params;
  const m = await municipioPublicado(uf, municipio);
  if (!m) notFound();
  const [p, vizinhos, termos, hoje0] = await Promise.all([previsaoPulverizacao(m.lat, m.lon), vizinhosPublicados(m, 12), slugsDoGlossario(), dataDeHoje()]);
  const temTermo = (s: string) => termos.includes(s);
  const caminho = caminhoMunicipio(m);
  const estado = NOME_ESTADO[m.uf] ?? m.uf;
  const culturas = culturasOrdenadas(m);
  const resposta = respostaMunicipio(m, p);
  const contexto = { page_type: 'programatica', cluster: 'pulverizacao', consulta_alvo: consultaMunicipio(m), isca_id: 'boletim-pulverizacao-municipio' };
  const hoje = p?.dias[0];
  const chuvaSemana = p ? p.dias.reduce((s, d) => s + d.chuvaMm, 0) : 0;
  const diasComChuva = p ? p.dias.filter((d) => d.chuvaMm >= 1) : [];

  const perguntas = [
    {
      pergunta: `Qual o melhor horário para pulverizar em ${m.nome} hoje?`,
      resposta: hoje?.melhorJanela
        ? `Pela previsão mais recente, a melhor janela de hoje em ${m.nome} é ${formatarJanela(hoje.melhorJanela)}, com delta T, vento e umidade dentro da faixa e sem chuva logo depois. Confira as condições no local antes de aplicar.`
        : `Hoje não há janela boa em ${m.nome} pela previsão${hoje?.motivoPrincipal ? `: ${inicialMinuscula(hoje.motivoPrincipal)}` : ''}. Veja na tabela acima o próximo dia com janela.`,
    },
    {
      pergunta: `Vai chover em ${m.nome} nos próximos dias?`,
      resposta: p
        ? diasComChuva.length
          ? `A previsão indica cerca de ${fmtN.format(chuvaSemana)} mm nos próximos ${p.dias.length} dias, com chuva em ${diasComChuva.map((d) => rotuloData(d.data, p.hoje)).slice(0, 3).join(', ')}. Evite aplicar nas horas antes da chuva.`
          : `A previsão não indica chuva relevante (1 mm ou mais) nos próximos ${p.dias.length} dias em ${m.nome}.`
        : 'A previsão está indisponível agora; tente de novo em alguns minutos.',
    },
    {
      pergunta: `Tem risco de geada em ${m.nome} esta semana?`,
      resposta: p
        ? p.geadas.length
          ? `Sim: a previsão indica geada ${p.geadas.map((g) => `${ROTULO_GEADA[g.nivel].toLowerCase()} na madrugada de ${rotuloData(g.data, p.hoje)}`).join(' e ')}. Em baixadas o frio costuma ser maior.`
          : `A previsão não indica geada nos próximos 7 dias em ${m.nome}.`
        : 'A previsão está indisponível agora.',
    },
    {
      pergunta: 'Como o Grão Raiz calcula a hora de pulverizar?',
      resposta: 'Para cada hora, o app olha o delta T, o vento na altura da barra, as rajadas, a umidade, a temperatura e a chuva nas horas seguintes. Hora boa é a que passa em todos; a regra completa está na página de metodologia.',
    },
  ];

  return (
    <article className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <Rastreio contexto={contexto} />
      <Trilha
        itens={[
          { nome: 'Hora de pulverizar', caminho: '/hora-de-pulverizar' },
          { nome: estado, caminho: `/hora-de-pulverizar/${m.uf.toLowerCase()}` },
          { nome: m.nome, caminho },
        ]}
      />
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
        Hora de pulverizar em {m.nome} ({m.uf})
      </h1>
      <p className="mt-4 text-lg leading-relaxed">{resposta}</p>
      <Autoria
        revisadoEm={p?.buscadaEm ?? hoje0}
        nota={
          <>
            previsão <a href="https://open-meteo.com/" rel="noopener" className="hover:underline">Open-Meteo</a>, regras do{' '}
            <Link href="/metodologia" className="hover:underline">
              Grão Raiz
            </Link>
          </>
        }
      />

      <nav aria-label="Nesta página" className="mt-6 flex flex-wrap gap-2 text-sm">
        {[
          ['#semana', 'Janelas da semana'],
          ['#hoje', 'Hoje, hora a hora'],
          ['#geada-chuva', 'Geada e chuva'],
          ['#lavoura', `A lavoura em ${m.nome}`],
          ['#faq-titulo', 'Perguntas'],
        ].map(([href, rotulo]) => (
          <a key={href} href={href} className="rounded-full border border-linha px-3 py-1 hover:bg-superficie">
            {rotulo}
          </a>
        ))}
      </nav>

      <section id="semana" aria-labelledby="semana-titulo" className="mt-10">
        <h2 id="semana-titulo" className="text-2xl font-bold">
          Janelas para pulverizar nos próximos dias
        </h2>
        {p ? (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-linha">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <caption className="sr-only">Melhor janela de pulverização por dia em {m.nome}</caption>
              <thead className="bg-superficie text-texto-2">
                <tr>
                  <th scope="col" className="px-4 py-3">Dia</th>
                  <th scope="col" className="px-4 py-3">Situação</th>
                  <th scope="col" className="px-4 py-3">Melhor janela</th>
                  <th scope="col" className="px-4 py-3">Chuva</th>
                  <th scope="col" className="px-4 py-3">Mín./máx.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linha">
                {p.dias.map((d) => (
                  <tr key={d.data}>
                    <th scope="row" className="px-4 py-3 font-medium capitalize">{rotuloData(d.data, p.hoje)}</th>
                    <td className="px-4 py-3"><Selo status={d.status} /></td>
                    <td className="px-4 py-3">{d.melhorJanela ? formatarJanela(d.melhorJanela) : (d.motivoPrincipal ?? '—')}</td>
                    <td className="px-4 py-3 tabular-nums">{d.chuvaMm >= 0.5 ? `${fmt1.format(d.chuvaMm)} mm` : '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{fmtN.format(d.tMin)}° / {fmtN.format(d.tMax)}°</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-texto-2">A previsão está indisponível agora. Tente de novo em alguns minutos.</p>
        )}
      </section>

      <div className="mt-10">
        <IscaBoletim municipio={m.nome} codigo={m.codigo} contexto={contexto} />
      </div>

      {p && p.horasHoje.length ? (
        <section id="hoje" aria-labelledby="hoje-titulo" className="mt-12">
          <h2 id="hoje-titulo" className="text-2xl font-bold">
            Hoje em {m.nome}, hora a hora
          </h2>
          <p className="mt-2 text-texto-2">
            Delta T na faixa de 2 a 8 °C e vento de 3 a 10 km/h na altura da barra (2 m) são as condições que o app trata como boas.{' '}
            {temTermo('delta-t') ? (
              <Link href="/glossario/delta-t" className="underline-offset-2 hover:underline">
                O que é delta T
              </Link>
            ) : (
              <Link href="/ferramentas/delta-t" className="underline-offset-2 hover:underline">
                Calcule o delta T
              </Link>
            )}
            .
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-linha">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">Condições de pulverização hora a hora hoje em {m.nome}</caption>
              <thead className="bg-superficie text-texto-2">
                <tr>
                  <th scope="col" className="px-3 py-2">Hora</th>
                  <th scope="col" className="px-3 py-2">Situação</th>
                  <th scope="col" className="px-3 py-2">Delta T</th>
                  <th scope="col" className="px-3 py-2">Vento (2 m)</th>
                  <th scope="col" className="px-3 py-2">Umidade</th>
                  <th scope="col" className="px-3 py-2">Chuva</th>
                  <th scope="col" className="px-3 py-2">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linha">
                {p.horasHoje.map((h) => (
                  <tr key={h.hora}>
                    <th scope="row" className="px-3 py-2 font-medium tabular-nums">{formatarHora(h.hora)}</th>
                    <td className="px-3 py-2"><Selo status={h.status} /></td>
                    <td className="px-3 py-2 tabular-nums">{fmt1.format(h.deltaT)} °C</td>
                    <td className="px-3 py-2 tabular-nums">{fmtN.format(h.vento2m)} km/h</td>
                    <td className="px-3 py-2 tabular-nums">{fmtN.format(h.umidade)}%</td>
                    <td className="px-3 py-2 tabular-nums">{h.probChuva === null ? '—' : `${fmtN.format(h.probChuva)}%`}</td>
                    <td className="px-3 py-2 text-texto-2">{h.motivos[0]?.texto ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {p ? (
        <section id="geada-chuva" aria-labelledby="geada-titulo" className="mt-12">
          <h2 id="geada-titulo" className="text-2xl font-bold">
            Geada e chuva em {m.nome} nos próximos 7 dias
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>
              {p.geadas.length
                ? `Risco de geada: ${p.geadas.map((g) => `${ROTULO_GEADA[g.nivel].toLowerCase()} na madrugada de ${rotuloData(g.data, p.hoje)} (mínima do ar de ${fmtN.format(g.tMinAr)} °C)`).join('; ')}.`
                : 'Sem geada prevista nos próximos 7 dias.'}
              {temTermo('geada') ? (
                <>
                  {' '}
                  <Link href="/glossario/geada" className="underline-offset-2 hover:underline">Entenda a geada</Link>.
                </>
              ) : null}
            </li>
            <li>
              Chuva prevista na semana: {fmtN.format(chuvaSemana)} mm
              {diasComChuva.length ? `, com mais volume ${rotuloData([...diasComChuva].sort((a, b) => b.chuvaMm - a.chuvaMm)[0].data, p.hoje)}` : ''}.
            </li>
          </ul>
        </section>
      ) : null}

      {culturas.length ? (
        <section id="lavoura" aria-labelledby="lavoura-titulo" className="mt-12">
          <h2 id="lavoura-titulo" className="text-2xl font-bold">
            A lavoura em {m.nome}
          </h2>
          <p className="mt-2 text-texto-2">{resumoCulturas(m)}</p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-linha">
            <table className="w-full min-w-[30rem] text-left text-sm">
              <caption className="sr-only">Área plantada e produção de grãos em {m.nome}, {m.anoPam}</caption>
              <thead className="bg-superficie text-texto-2">
                <tr>
                  <th scope="col" className="px-4 py-3">Cultura</th>
                  <th scope="col" className="px-4 py-3">Área plantada</th>
                  <th scope="col" className="px-4 py-3">Produção</th>
                  <th scope="col" className="px-4 py-3">Produção por ha plantado*</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-linha">
                {culturas.map((c) => (
                  <tr key={c.chave}>
                    <th scope="row" className="px-4 py-3 font-medium">{c.nome}</th>
                    <td className="px-4 py-3 tabular-nums">{fmtN.format(c.areaHa)} ha</td>
                    <td className="px-4 py-3 tabular-nums">{c.producaoT ? `${fmtN.format(c.producaoT)} t` : '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{c.rendimentoKgHa ? `${fmtN.format(c.rendimentoKgHa)} kg/ha` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-texto-2">
            Fonte: IBGE, Produção Agrícola Municipal {m.anoPam} (tabela 5457). *Calculado pelo Grão Raiz: produção ÷ área plantada; o rendimento oficial do IBGE usa a área colhida.
          </p>
        </section>
      ) : null}

      <ChamadaApp texto={`Tem lavoura em ${m.nome}? Veja a janela no ponto exato do seu talhão.`} origem="municipio" />

      <Perguntas perguntas={perguntas} />

      {vizinhos.length ? (
        <section aria-labelledby="vizinhos-titulo" className="mt-12">
          <h2 id="vizinhos-titulo" className="text-xl font-bold">
            Hora de pulverizar em municípios da região{m.regiaoNome ? ` de ${m.regiaoNome}` : ''}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {vizinhos.map((v) => (
              <li key={v.codigo}>
                <Link href={caminhoMunicipio(v)} className="inline-flex rounded-full border border-linha px-3 py-1 text-sm hover:bg-superficie">
                  {v.nome}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-12">
        <IscaBoletim municipio={m.nome} codigo={m.codigo} contexto={contexto} variante="faixa" />
      </div>

      <p className="mt-8 text-sm text-texto-2">
        Veja também: <Link href={`/hora-de-pulverizar/${m.uf.toLowerCase()}`} className="underline-offset-2 hover:underline">outros municípios de {estado}</Link> ·{' '}
        <Link href="/ferramentas/delta-t" className="underline-offset-2 hover:underline">calculadora de delta T</Link> ·{' '}
        {termos.length ? (
          <>
            <Link href="/glossario" className="underline-offset-2 hover:underline">glossário agrícola</Link> ·{' '}
          </>
        ) : null}
        <Link href="/metodologia" className="underline-offset-2 hover:underline">como calculamos</Link> ·{' '}
        <Link href="/maquinas-usadas" className="underline-offset-2 hover:underline">máquinas usadas</Link>
      </p>

      <Fontes
        fontes={[
          { nome: 'Previsão do tempo: Open-Meteo (CC BY 4.0)', url: 'https://open-meteo.com/' },
          { nome: `IBGE, Produção Agrícola Municipal ${m.anoPam}, tabela 5457 (SIDRA)`, url: 'https://sidra.ibge.gov.br/tabela/5457' },
          { nome: 'IBGE, malha municipal (centro do município)', url: 'https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais.html' },
        ]}
      />
      <p className="mt-6 text-xs text-texto-2">
        Previsões são estimativas e podem errar. O Grão Raiz não é receituário agronômico: produto, dose e momento de aplicação são orientação do engenheiro agrônomo responsável.
      </p>

      <JsonLd
        dados={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: tituloMunicipio(m),
          description: descricaoMunicipio(m),
          url: absoluta(caminho),
          inLanguage: 'pt-BR',
          dateModified: p?.buscadaEm,
          about: { '@type': 'Place', name: `${m.nome}, ${estado}`, geo: { '@type': 'GeoCoordinates', latitude: m.lat, longitude: m.lon } },
          isPartOf: { '@type': 'WebSite', name: 'Grão Raiz', url: absoluta('/') },
        }}
      />
    </article>
  );
}

export default function PaginaMunicipio(props: Props) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-14 text-texto-2">Carregando a previsão…</div>}>
      <Conteudo {...props} />
    </Suspense>
  );
}
