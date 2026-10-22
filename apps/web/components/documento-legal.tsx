import type { ReactNode } from 'react';
import { RESPONSAVEL_PENDENTE } from '@/lib/config';

/** Aviso exibido enquanto o responsável legal não foi preenchido nas variáveis de ambiente. */
export function AvisoRevisao() {
  if (!RESPONSAVEL_PENDENTE) return null;
  return (
    <p role="note" className="mb-8 rounded-xl border-2 border-atencao bg-fundo px-4 py-3 font-semibold text-atencao">
      Revise com um profissional antes da publicação.
    </p>
  );
}

export function DocumentoLegal({
  titulo,
  atualizacao,
  avisoRevisao = true,
  children,
}: {
  titulo: string;
  atualizacao?: string;
  avisoRevisao?: boolean;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      {avisoRevisao && <AvisoRevisao />}
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{titulo}</h1>
      {atualizacao && <p className="mt-3 text-sm text-texto-2">Última atualização: {atualizacao}</p>}
      <div className="texto-legal mt-8 text-[1.0625rem]">{children}</div>
    </article>
  );
}
