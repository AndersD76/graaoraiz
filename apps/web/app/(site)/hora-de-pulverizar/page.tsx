import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Autoria, ChamadaApp, Fontes, Perguntas, Trilha } from '@/components/seo/pecas';
import { Rastreio } from '@/components/seo/rastreio';
import { metadadosPagina } from '@/lib/metadados';
import { CRITERIOS, FONTES_METODO } from '@/lib/seo/criterios';
import { caminhoMunicipio, municipiosPublicados, ufsPublicadas } from '@/lib/seo/municipios';
import { termosPublicados } from '@/lib/seo/paginas';
import { NOME_ESTADO } from '@/lib/ufs';

export const metadata: Metadata = metadadosPagina({
  titulo: 'Hora de pulverizar: como escolher e previsão por município',
  tituloAbsoluto: true,
  descricao: 'Melhor horário para pulverizar: delta T, vento, umidade e chuva explicados, com a previsão das janelas hora a hora para milhares de municípios.',
  caminho: '/hora-de-pulverizar',
});

const fmtN = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

const PERGUNTAS = [
  {
    pergunta: 'Qual o melhor horário para pulverizar?',
    resposta:
      'Não existe um horário fixo: é a hora em que o delta T fica entre 2 e 8 °C, o vento na altura da barra entre 3 e 10 km/h, a umidade em 55% ou mais e não há chuva nas horas seguintes. Muitas vezes isso acontece no começo da manhã ou no fim da tarde, mas muda de um dia para o outro.',
  },
  {
    pergunta: 'Pode pulverizar sem vento nenhum?',
    resposta:
      'Vento abaixo de 3 km/h na barra pede cuidado: ar parado costuma indicar inversão térmica, quando as gotas finas ficam suspensas e podem ser levadas para longe depois. Por isso o app marca essas horas como “com cuidado”, e não como boas.',
  },
  {
    pergunta: 'Quanto tempo sem chuva depois de pulverizar?',
    resposta:
      'O app pede pelo menos 2 horas sem chuva depois da aplicação para considerar a hora boa. O tempo que cada produto precisa até resistir à chuva está na bula e varia muito; siga sempre a orientação do agrônomo.',
  },
  {
    pergunta: 'O vento da previsão é o mesmo da altura da barra?',
    resposta:
      'Não. Os modelos informam o vento a 10 m de altura. O Grão Raiz converte para 2 m pela fórmula da FAO-56, o que dá cerca de 75% do valor a 10 m, e é esse vento que entra no cálculo.',
  },
];

async function Conteudo() {
  const [ufs, maiores, termos] = await Promise.all([ufsPublicadas(), municipiosPublicados(null), termosPublicados()]);
  const termosDoTema = termos.filter((t) => t.cluster === 'pulverizacao');
  const total = ufs.reduce((s, u) => s + u.n, 0);

  return (
    <>
      <section aria-labelledby="estados-titulo" className="mt-12">
        <h2 id="estados-titulo" className="text-2xl font-bold">
          Previsão das janelas por estado
        </h2>
        <p className="mt-2 text-texto-2">{fmtN.format(total)} municípios com página, todos com pelo menos 1.000 ha de grãos (IBGE).</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ufs.map((u) => (
            <li key={u.uf}>
              <Link href={`/hora-de-pulverizar/${u.uf.toLowerCase()}`} className="flex items-center justify-between rounded-xl border border-linha px-4 py-3 hover:bg-superficie">
                <span className="font-medium">{NOME_ESTADO[u.uf] ?? u.uf}</span>
                <span className="text-sm text-texto-2">{fmtN.format(u.n)} municípios</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      {termosDoTema.length ? (
        <section aria-labelledby="termos-titulo" className="mt-12">
          <h2 id="termos-titulo" className="text-2xl font-bold">
            Entenda os termos
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {termosDoTema.map((t) => (
              <li key={t.slug}>
                <Link href={`/glossario/${t.slug}`} className="inline-flex rounded-full border border-linha px-3 py-1 text-sm hover:bg-superficie">
                  {t.termo}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section aria-labelledby="maiores-titulo" className="mt-12">
        <h2 id="maiores-titulo" className="text-2xl font-bold">
          Maiores municípios produtores de grãos
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {maiores.slice(0, 40).map((m) => (
            <li key={m.codigo}>
              <Link href={caminhoMunicipio(m)} className="inline-flex rounded-full border border-linha px-3 py-1 text-sm hover:bg-superficie">
                {m.nome} ({m.uf})
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

export default function HoraDePulverizar() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <Rastreio contexto={{ page_type: 'pilar', cluster: 'pulverizacao', consulta_alvo: 'hora de pulverizar', isca_id: 'boletim-pulverizacao-municipio' }} />
      <Trilha itens={[{ nome: 'Hora de pulverizar', caminho: '/hora-de-pulverizar' }]} />
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Hora de pulverizar: como escolher e a previsão por município</h1>
      <p className="mt-4 text-lg leading-relaxed">
        A hora de pulverizar é a hora em que a gota chega ao alvo: delta T entre 2 e 8 °C, vento na altura da barra entre 3 e 10 km/h, umidade de 55% ou mais e
        nada de chuva nas horas seguintes. Abaixo, cada critério explicado e a previsão dessas janelas, hora a hora, para cada município produtor de grãos.
      </p>
      <Autoria revisadoEm="2026-11-18" />

      <nav aria-label="Nesta página" className="mt-6 flex flex-wrap gap-2 text-sm">
        {[
          ['#criterios', 'Os 6 critérios'],
          ['#como-usar', 'Como usar a previsão'],
          ['#estados-titulo', 'Previsão por estado'],
          ['#faq-titulo', 'Perguntas'],
        ].map(([href, rotulo]) => (
          <a key={href} href={href} className="rounded-full border border-linha px-3 py-1 hover:bg-superficie">
            {rotulo}
          </a>
        ))}
      </nav>

      <section id="criterios" aria-labelledby="criterios-titulo" className="mt-10">
        <h2 id="criterios-titulo" className="text-2xl font-bold">
          Os 6 critérios que decidem a hora de pulverizar
        </h2>
        <p className="mt-3">
          Uma aplicação boa depende de a calda sair do bico, atravessar o ar e ficar na folha. Cada critério abaixo mede uma das formas de perder produto no caminho:
          a gota que evapora, a gota que o vento leva, a gota que fica suspensa no ar parado e o produto que a chuva lava. São as mesmas faixas que o app Grão Raiz
          usa em todas as telas, e uma hora só é boa quando passa em todas.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {CRITERIOS.map((c) => (
            <div key={c.criterio} className="rounded-2xl border border-linha p-5">
              <h3 className="text-lg font-bold">{c.criterio}</h3>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="font-semibold text-bom">Boa</dt>
                <dd>{c.boa}</dd>
                <dt className="font-semibold text-atencao">Com cuidado</dt>
                <dd>{c.cuidado}</dd>
                <dt className="font-semibold text-ruim">Não aplicar</dt>
                <dd>{c.naoAplicar}</dd>
              </dl>
              <p className="mt-3 text-sm text-texto-2">{c.porque}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="como-usar" aria-labelledby="como-usar-titulo" className="mt-12">
        <h2 id="como-usar-titulo" className="text-2xl font-bold">
          Como usar a previsão para planejar a aplicação
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5">
          <li>
            <strong>Olhe a semana antes do dia.</strong> A tabela de cada município mostra a melhor janela de cada um dos próximos 7 dias. Se só um ou dois dias têm
            janela boa, é neles que a aplicação precisa caber; planeje máquina, calda e equipe para esse dia.
          </li>
          <li>
            <strong>Confira o motivo das horas ruins.</strong> Vento forte e chuva prevista costumam tirar o dia inteiro. Delta T alto costuma fechar só o meio do dia,
            e a janela abre de novo no fim da tarde, quando o ar esfria e fica mais úmido.
          </li>
          <li>
            <strong>Desconfie do ar parado.</strong> Madrugada sem vento e de céu limpo é típica de inversão térmica. O app marca vento abaixo de 3 km/h como
            “com cuidado” por isso, mesmo com o delta T na faixa.
          </li>
          <li>
            <strong>Respeite a chuva depois.</strong> A hora só é boa se as duas horas seguintes também estiverem secas. Para produtos que pedem mais tempo, a bula
            manda: o app é um piso, não um teto.
          </li>
          <li>
            <strong>Confirme no local.</strong> O ponto da previsão é o centro do município. Na hora de sair, confira o vento e a umidade na lavoura; o app grátis faz
            o cálculo no ponto exato do talhão e avisa no celular.
          </li>
        </ol>
        <p className="mt-4">
          Quer testar um valor que você mediu no campo? A <Link href="/ferramentas/delta-t" className="underline-offset-2 hover:underline">calculadora de delta T</Link>{' '}
          faz a conta com a temperatura e a umidade, pela mesma fórmula do app. A <Link href="/metodologia" className="underline-offset-2 hover:underline">metodologia</Link>{' '}
          explica cada fórmula e de onde vem a previsão.
        </p>
      </section>

      <Suspense fallback={<p className="mt-12 text-texto-2">Carregando os municípios…</p>}>
        <Conteudo />
      </Suspense>

      <ChamadaApp texto="Receba o aviso da janela no celular, para o seu talhão." origem="pilar-pulverizacao" />
      <Perguntas perguntas={PERGUNTAS} />
      <p className="mt-8 text-sm text-texto-2">
        Veja também: <Link href="/metodologia" className="underline-offset-2 hover:underline">metodologia</Link> ·{' '}
        <Link href="/maquinas-usadas/categoria/pulverizador" className="underline-offset-2 hover:underline">pulverizadores usados</Link>
      </p>
      <Fontes fontes={FONTES_METODO} />
    </article>
  );
}
