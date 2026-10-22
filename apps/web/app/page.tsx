import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BotoesLoja, TEM_LOJA } from '@/components/botoes-loja';
import { CartaoExemplo } from '@/components/cartao-exemplo';
import { FormListaEspera } from '@/components/form-lista-espera';
import { PRECO } from '@/lib/config';
import { metadadosPagina } from '@/lib/metadados';

export const metadata: Metadata = metadadosPagina({
  titulo: 'Grão Raiz — o tempo certo para agir no seu talhão',
  tituloAbsoluto: true,
  descricao:
    'App para produtor de grãos: semáforo de pulverização com o melhor horário, janela de tempo seco para colher, pluviômetro e avisos de geada e temporal — por talhão, não por cidade.',
  caminho: '/',
});

const PASSOS = [
  {
    titulo: 'Marque o talhão no mapa',
    texto: 'Toque no mapa onde fica a lavoura e dê um nome. A previsão passa a ser daquele ponto, não da cidade mais próxima.',
  },
  {
    titulo: 'Veja o semáforo do dia',
    texto: 'Verde, amarelo ou vermelho para pulverizar, com o melhor horário, e os próximos dias de tempo seco para colher.',
  },
  {
    titulo: 'Receba avisos no celular',
    texto: 'O app avisa quando há risco de geada ou de temporal no talhão, para dar tempo de se preparar.',
  },
];

const RECURSOS: { titulo: string; texto: string; pro?: boolean }[] = [
  {
    titulo: 'Semáforo de pulverização',
    texto:
      'Considera o vento na altura da barra, o delta T, a umidade, a temperatura e a chuva prevista nas horas seguintes à aplicação, e mostra o melhor horário do dia.',
  },
  {
    titulo: 'Janela de tempo seco',
    texto: 'Mostra os próximos dias seguidos sem chuva prevista, para planejar a colheita e a entrada de máquinas.',
  },
  {
    titulo: 'Pluviômetro',
    texto:
      'Anote a chuva de cada talhão. Nos dias sem anotação, o app preenche com uma estimativa automática. Gere um cartão da chuva para compartilhar no WhatsApp.',
  },
  {
    titulo: 'Avisos de geada e temporal',
    texto: 'Notificações no celular quando a previsão indica risco de geada ou de temporal no talhão.',
  },
  {
    titulo: 'Relatório da safra em PDF',
    texto: 'A chuva da safra no talhão, mês a mês, reunida num PDF para guardar ou enviar.',
    pro: true,
  },
];

const PLANO_GRATIS = [
  '1 talhão',
  'Semáforo do dia',
  'Previsão de 7 dias',
  'Pluviômetro',
  'Avisos de geada e temporal',
];

const PLANO_PRO = [
  'Talhões ilimitados',
  'Pulverização hora a hora para as próximas 48 h',
  'Avisos de janela de pulverização e de tempo seco',
  'Limites ajustáveis',
  'Relatório da safra em PDF',
];

const PERGUNTAS: { pergunta: string; resposta: ReactNode }[] = [
  {
    pergunta: 'De onde vêm os dados?',
    resposta: (
      <>
        Dos modelos meteorológicos disponibilizados pelo{' '}
        <a href="https://open-meteo.com/" className="font-semibold text-marca underline underline-offset-2" rel="noopener">
          Open-Meteo
        </a>
        , sob a licença CC BY 4.0. É uma estimativa: a previsão pode errar, principalmente em chuva localizada. Antes de
        decidir, confira as condições no local.
      </>
    ),
  },
  {
    pergunta: 'Precisa de internet?',
    resposta:
      'Para atualizar a previsão, sim. Sem sinal, o app mostra a última previsão salva no celular.',
  },
  {
    pergunta: 'O app recomenda produto ou dose?',
    resposta:
      'Não. O Grão Raiz fala só das condições do tempo. A recomendação de defensivo, dose e momento de aplicação é com o seu agrônomo.',
  },
  {
    pergunta: 'Preciso criar conta?',
    resposta: 'Não. Não há cadastro, e seus talhões e anotações de chuva ficam guardados no seu celular.',
  },
  {
    pergunta: 'Funciona para quais culturas?',
    resposta:
      'Foi feito pensando em grãos — soja, milho, trigo —, mas as condições do tempo valem para qualquer lavoura.',
  },
];

function Verificado() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false" className="mt-0.5 shrink-0">
      <circle cx="10" cy="10" r="10" fill="#1B7F3B" />
      <path d="m5.8 10.3 2.7 2.7 5.7-5.8" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Secao({ id, titulo, intro, children, cinza }: { id: string; titulo: string; intro?: string; children: ReactNode; cinza?: boolean }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className={cinza ? 'bg-superficie' : undefined}>
      <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <h2 id={`${id}-titulo`} className="text-2xl font-bold tracking-tight sm:text-3xl">
          {titulo}
        </h2>
        {intro && <p className="mt-3 max-w-2xl text-lg text-texto-2">{intro}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

export default function Inicio() {
  return (
    <>
      {/* Hero */}
      <section aria-labelledby="titulo-principal">
        <div className="mx-auto grid max-w-5xl items-center gap-12 px-4 py-14 sm:py-20 md:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-marca-clara px-3 py-1 text-sm font-semibold text-marca">
              App para produtor de grãos
            </p>
            <h1 id="titulo-principal" className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              O tempo certo para agir no seu talhão
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-texto-2">
              Semáforo de pulverização com o melhor horário do dia, janela de tempo seco para colher, pluviômetro e
              avisos de geada e temporal — <strong className="font-semibold text-texto">por talhão, não por cidade</strong>.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href="#lista-espera"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-marca px-7 text-base font-semibold text-white hover:bg-marca-escura"
              >
                Quero usar
              </a>
              <BotoesLoja />
            </div>
          </div>
          <CartaoExemplo />
        </div>
      </section>

      <Secao id="como-funciona" titulo="Como funciona" cinza>
        <ol className="grid gap-6 md:grid-cols-3">
          {PASSOS.map((p, i) => (
            <li key={p.titulo} className="rounded-2xl bg-fundo p-6">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-marca text-lg font-bold text-white"
              >
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold">
                <span className="sr-only">Passo {i + 1}: </span>
                {p.titulo}
              </h3>
              <p className="mt-2 leading-relaxed text-texto-2">{p.texto}</p>
            </li>
          ))}
        </ol>
      </Secao>

      <Secao
        id="recursos"
        titulo="O que o app faz"
        intro="Tudo calculado para o ponto do seu talhão, a partir da previsão dos modelos meteorológicos."
      >
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {RECURSOS.map((r) => (
            <li key={r.titulo} className="rounded-2xl border border-linha p-6">
              <h3 className="flex flex-wrap items-center gap-2 text-lg font-bold">
                {r.titulo}
                {r.pro && (
                  <span className="rounded-full bg-marca px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                    Pro
                  </span>
                )}
              </h3>
              <p className="mt-2 leading-relaxed text-texto-2">{r.texto}</p>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao id="planos" titulo="Planos" cinza>
        <div className="grid gap-6 md:grid-cols-2">
          <article className="flex flex-col rounded-2xl border border-linha bg-fundo p-6 sm:p-8" aria-labelledby="plano-gratis">
            <h3 id="plano-gratis" className="text-xl font-bold">
              Grátis
            </h3>
            <p className="mt-2 text-3xl font-extrabold">R$ 0</p>
            <ul className="mt-6 flex flex-col gap-3">
              {PLANO_GRATIS.map((item) => (
                <li key={item} className="flex gap-3">
                  <Verificado />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
          <article
            className="flex flex-col rounded-2xl border-2 border-marca bg-fundo p-6 sm:p-8"
            aria-labelledby="plano-pro"
          >
            <h3 id="plano-pro" className="text-xl font-bold">
              Pro
            </h3>
            <p className="mt-2 text-3xl font-extrabold">
              {PRECO.mensal}
              <span className="text-base font-semibold text-texto-2"> por mês</span>
            </p>
            <p className="text-sm text-texto-2">ou {PRECO.anual} por ano</p>
            <p className="mt-4 font-semibold">Tudo do Grátis, mais:</p>
            <ul className="mt-3 flex flex-col gap-3">
              {PLANO_PRO.map((item) => (
                <li key={item} className="flex gap-3">
                  <Verificado />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
        <p className="mt-6 text-sm text-texto-2">
          Preço de lançamento; 14 dias grátis. Cobrança e cancelamento pela loja do celular.
        </p>
      </Secao>

      <Secao id="duvidas" titulo="Perguntas frequentes">
        <div className="flex flex-col gap-3">
          {PERGUNTAS.map((p) => (
            <details key={p.pergunta} className="group rounded-2xl border border-linha bg-fundo">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-3 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {p.pergunta}
                <span
                  aria-hidden="true"
                  className="text-2xl leading-none text-marca transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="px-5 pb-5 leading-relaxed text-texto-2">{p.resposta}</div>
            </details>
          ))}
        </div>
      </Secao>

      <Secao
        id="lista-espera"
        titulo="Entre na lista de espera"
        intro={
          TEM_LOJA
            ? 'Deixe seu contato para receber novidades do app e convites para testar versões novas no Android.'
            : 'O app ainda não está nas lojas. Deixe seu contato para saber do lançamento — e, se quiser, para testar antes no Android.'
        }
        cinza
      >
        <div className="max-w-xl rounded-2xl bg-fundo p-6 sm:p-8">
          <FormListaEspera />
        </div>
      </Secao>
    </>
  );
}
