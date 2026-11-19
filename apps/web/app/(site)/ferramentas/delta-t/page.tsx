import { deltaT } from '@graoraiz/clima';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CalculadoraDeltaT } from '@/components/seo/calculadora-delta-t';
import { Autoria, ChamadaApp, Fontes, JsonLd, Perguntas, Trilha } from '@/components/seo/pecas';
import { Rastreio } from '@/components/seo/rastreio';
import { metadadosPagina } from '@/lib/metadados';
import { absoluta } from '@/lib/seo';
import { FONTES_METODO } from '@/lib/seo/criterios';

export const metadata: Metadata = metadadosPagina({
  titulo: 'Calculadora de delta T para pulverização (grátis)',
  tituloAbsoluto: true,
  descricao: 'Calcule o delta T com a temperatura e a umidade do ar e veja se está na faixa boa para pulverizar. Tabela pronta de delta T e grátis, sem cadastro.',
  caminho: '/ferramentas/delta-t',
});

const TEMPERATURAS = [15, 20, 25, 30, 35];
const UMIDADES = [30, 40, 50, 60, 70, 80, 90];
const fmt1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });

function tom(dt: number): string {
  if (dt > 10) return 'bg-ruim/15 text-ruim';
  if (dt > 8 || dt < 2) return 'bg-atencao/15 text-atencao';
  return 'bg-bom/15 text-bom';
}

const PERGUNTAS = [
  {
    pergunta: 'Como calcular o delta T?',
    resposta:
      'Delta T é a temperatura do ar menos a temperatura de bulbo úmido. Com a temperatura e a umidade relativa, a calculadora estima o bulbo úmido pela fórmula de Stull (2011) e faz a subtração. Exemplo: 25 °C e 60% de umidade dão cerca de 5,5 °C.',
  },
  {
    pergunta: 'Qual o delta T ideal para pulverizar?',
    resposta:
      'O Grão Raiz considera boa a faixa de 2 a 8 °C, pede cuidado de 8 a 10 °C e abaixo de 2 °C, e marca como “não aplicar” acima de 10 °C. Siga também a bula e o agrônomo.',
  },
  {
    pergunta: 'Delta T sozinho garante uma boa aplicação?',
    resposta:
      'Não. Vento na altura da barra, rajadas e chuva nas horas seguintes também contam. A previsão por município do Grão Raiz junta todos esses critérios, hora a hora.',
  },
];

export default function DeltaT() {
  const contexto = { page_type: 'ferramenta', cluster: 'pulverizacao', consulta_alvo: 'calculadora de delta t', isca_id: 'calculadora-delta-t' };
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <Rastreio contexto={contexto} />
      <Trilha itens={[{ nome: 'Ferramentas', caminho: '/ferramentas' }, { nome: 'Calculadora de delta T', caminho: '/ferramentas/delta-t' }]} />
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Calculadora de delta T</h1>
      <p className="mt-4 text-lg leading-relaxed">
        Informe a temperatura e a umidade relativa do ar para ver o delta T na hora. O delta T é a diferença entre a temperatura do ar e a de bulbo úmido; o Grão Raiz
        considera boa para pulverizar a faixa de 2 a 8 °C. Grátis e sem cadastro.
      </p>
      <Autoria revisadoEm="2026-11-18" />

      <div className="mt-8">
        <CalculadoraDeltaT contexto={contexto} />
      </div>

      <section aria-labelledby="tabela-titulo" className="mt-12">
        <h2 id="tabela-titulo" className="text-2xl font-bold">
          Tabela de delta T por temperatura e umidade
        </h2>
        <p className="mt-2 text-texto-2">Calculada com a mesma fórmula da calculadora. Verde: boa; laranja: com cuidado; vermelho: não aplicar.</p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-linha">
          <table className="w-full min-w-[34rem] text-center text-sm tabular-nums">
            <caption className="sr-only">Delta T em °C para cada combinação de temperatura e umidade relativa</caption>
            <thead className="bg-superficie text-texto-2">
              <tr>
                <th scope="col" className="px-3 py-2 text-left">Temperatura</th>
                {UMIDADES.map((u) => (
                  <th key={u} scope="col" className="px-3 py-2">
                    {u}%
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-linha">
              {TEMPERATURAS.map((t) => (
                <tr key={t}>
                  <th scope="row" className="px-3 py-2 text-left font-medium">
                    {t} °C
                  </th>
                  {UMIDADES.map((u) => {
                    const dt = deltaT(t, u);
                    return (
                      <td key={u} className="px-1 py-1">
                        <span className={`block rounded-md px-2 py-1.5 font-semibold ${tom(dt)}`}>{fmt1.format(dt)}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Delta T não é tudo</h2>
        <p className="mt-3">
          Uma hora com delta T bom ainda pode ser ruim para aplicar se o vento estiver forte, se o ar estiver parado ou se a chuva vier logo depois. A{' '}
          <Link href="/hora-de-pulverizar" className="underline-offset-2 hover:underline">previsão de hora de pulverizar por município</Link> junta os seis critérios hora a
          hora, e a <Link href="/metodologia" className="underline-offset-2 hover:underline">metodologia</Link> explica cada um.
        </p>
      </section>

      <ChamadaApp texto="O app calcula o delta T de cada hora para o seu talhão e avisa a janela." origem="calculadora-delta-t" />
      <Perguntas perguntas={PERGUNTAS} />
      <Fontes fontes={FONTES_METODO.slice(0, 2)} />
      <JsonLd
        dados={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Calculadora de delta T',
          url: absoluta('/ferramentas/delta-t'),
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Web',
          inLanguage: 'pt-BR',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
          isAccessibleForFree: true,
        }}
      />
    </article>
  );
}
