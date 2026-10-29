import type { Metadata } from 'next';
import { FormAvaliacao } from '@/components/form-avaliacao';
import { metadadosPagina } from '@/lib/metadados';

export const metadata: Metadata = metadadosPagina({
  titulo: 'Avalie o Grão Raiz',
  descricao: 'Conte o que achou da versão de teste do Grão Raiz. Leva um minuto.',
  caminho: '/avaliar',
});

/** Avaliação da versão de teste: aberta pelo link do WhatsApp e por Ajustes no app, sem login. */
export default function Avaliar() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:py-16" aria-labelledby="avaliar-titulo">
      <h1 id="avaliar-titulo" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        O que você achou do Grão Raiz?
      </h1>
      <p className="mt-4 mb-10 text-lg leading-relaxed text-texto-2">
        O app está em teste e quem manda no que vem depois é quem usa na lavoura. Leva um minuto.
      </p>
      <FormAvaliacao />
    </section>
  );
}
