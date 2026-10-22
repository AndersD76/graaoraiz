import type { Metadata } from 'next';
import Link from 'next/link';
import { BotoesLoja, TEM_LOJA } from '@/components/botoes-loja';
import { Simbolo } from '@/components/marca';
import { metadadosPagina } from '@/lib/metadados';

export const metadata: Metadata = metadadosPagina({
  titulo: 'Baixe o Grão Raiz',
  descricao:
    'Pluviômetro, semáforo de pulverização e avisos de geada e temporal para cada talhão. Conheça o app Grão Raiz.',
  caminho: '/baixar',
});

const DESTAQUES = [
  'Anote a chuva de cada talhão e compartilhe o cartão no WhatsApp',
  'Semáforo de pulverização com o melhor horário do dia',
  'Janela de tempo seco para colher e entrar com máquina',
  'Avisos de geada e temporal no celular',
];

/** Destino dos links dos cartões de chuva compartilhados (ex.: /baixar?utm_source=cartao). */
export default function Baixar() {
  return (
    <section className="mx-auto max-w-xl px-4 py-14 sm:py-20" aria-labelledby="baixar-titulo">
      <Simbolo tamanho={56} />
      <h1 id="baixar-titulo" className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        A chuva e o tempo do seu talhão, no celular
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-texto-2">
        O Grão Raiz é um app gratuito para produtor de grãos, com plano Pro opcional. Sem cadastro: seus dados ficam no
        seu celular.
      </p>
      <ul className="mt-6 flex flex-col gap-3">
        {DESTAQUES.map((d) => (
          <li key={d} className="flex gap-3">
            <span aria-hidden="true" className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-marca" />
            <span>{d}</span>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        {TEM_LOJA ? (
          <BotoesLoja />
        ) : (
          <div className="rounded-2xl bg-superficie p-6">
            <p className="text-lg font-bold">Em breve no Android e no iPhone</p>
            <p className="mt-2 text-texto-2">Deixe seu contato e avisamos quando o app chegar às lojas.</p>
            <Link
              href="/#lista-espera"
              className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-marca px-6 font-semibold text-white hover:bg-marca-escura"
            >
              Entrar na lista de espera
            </Link>
          </div>
        )}
      </div>

      <p className="mt-10">
        <Link href="/" className="inline-flex min-h-11 items-center font-semibold text-marca underline underline-offset-2">
          Saiba mais sobre o Grão Raiz
        </Link>
      </p>
    </section>
  );
}
