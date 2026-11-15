import { Sprout } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { FormEntrar, FormPrimeiroAcesso } from '@/components/admin/formularios';
import { adminAtual, existeAdmin } from '@/lib/admin/auth';

export const metadata: Metadata = { title: 'Entrar' };

async function Conteudo() {
  if (await adminAtual()) redirect('/admin');
  const primeiro = !(await existeAdmin());
  return (
    <>
      <h1 className="text-center text-2xl font-bold">{primeiro ? 'Primeiro acesso ao painel' : 'Painel do Grão Raiz'}</h1>
      <p className="mt-1 text-center text-sm text-adm-texto-2">
        {primeiro
          ? 'Ainda não há administrador. Use a chave do painel do servidor para criar o seu acesso. Depois disso, esta opção some.'
          : 'Entre com o e-mail e a senha de uma conta com acesso ao painel.'}
      </p>
      <div className="mt-6">{primeiro ? <FormPrimeiroAcesso /> : <FormEntrar />}</div>
    </>
  );
}

export default function Entrar() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-adm-linha bg-adm-cartao p-6 shadow-sm sm:p-8">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-adm-marca text-adm-sobre-marca">
          <Sprout className="size-7" aria-hidden />
        </div>
        <Suspense fallback={<p className="text-center text-sm text-adm-texto-2">Carregando…</p>}>
          <Conteudo />
        </Suspense>
      </div>
    </div>
  );
}
