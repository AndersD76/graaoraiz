'use client';

import { CircleAlert, CircleCheck, KeyRound, LoaderCircle, Lock, Mail, User } from 'lucide-react';
import { type ComponentType, type InputHTMLAttributes, useActionState, useEffect } from 'react';
import { adicionarAdmin, entrar, type EstadoForm, primeiroAcesso } from '@/app/admin/acoes';

/** Login aceito: abre o painel com navegação completa, já com o cookie novo (ver EstadoForm.destino). */
function useIrAoDestino(estado: EstadoForm): boolean {
  useEffect(() => {
    if (estado.destino === '/admin') window.location.replace('/admin');
  }, [estado.destino]);
  return Boolean(estado.destino);
}

function Mensagem({ estado }: { estado: EstadoForm }) {
  if (estado.erro)
    return (
      <p role="alert" className="flex items-start gap-2 rounded-lg bg-adm-ruim-suave p-3 text-sm text-adm-ruim">
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        {estado.erro}
      </p>
    );
  if (estado.ok)
    return (
      <p role="status" className="flex items-start gap-2 rounded-lg bg-adm-bom-suave p-3 text-sm text-adm-bom">
        <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        {estado.ok}
      </p>
    );
  return null;
}

function Campo({
  id,
  rotulo,
  icone: Icone,
  ...resto
}: { id: string; rotulo: string; icone: ComponentType<{ className?: string; 'aria-hidden'?: boolean }> } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {rotulo}
      </label>
      <div className="relative">
        <Icone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-adm-texto-2" aria-hidden />
        <input id={id} name={id} required className="min-h-11 w-full rounded-lg border border-adm-linha bg-adm-cartao pl-10 pr-3 text-base sm:text-sm" {...resto} />
      </div>
    </div>
  );
}

function Botao({ pendente, rotulo }: { pendente: boolean; rotulo: string }) {
  return (
    <button
      type="submit"
      disabled={pendente}
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-adm-marca font-semibold text-adm-sobre-marca hover:bg-adm-marca-forte disabled:opacity-60"
    >
      {pendente ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
      {rotulo}
    </button>
  );
}

export function FormEntrar() {
  const [estado, acao, pendente] = useActionState(entrar, {});
  const indo = useIrAoDestino(estado);
  const ocupado = pendente || indo;
  return (
    <form action={acao} className="flex flex-col gap-4">
      <Mensagem estado={estado} />
      <Campo id="email" rotulo="E-mail" icone={Mail} type="email" autoComplete="username" placeholder="voce@exemplo.com" defaultValue={estado.valores?.email} disabled={ocupado} />
      <Campo id="senha" rotulo="Senha" icone={Lock} type="password" autoComplete="current-password" placeholder="••••••••" disabled={ocupado} />
      <Botao pendente={ocupado} rotulo={indo ? 'Abrindo o painel…' : 'Entrar'} />
    </form>
  );
}

export function FormPrimeiroAcesso() {
  const [estado, acao, pendente] = useActionState(primeiroAcesso, {});
  const indo = useIrAoDestino(estado);
  const ocupado = pendente || indo;
  return (
    <form action={acao} className="flex flex-col gap-4">
      <Mensagem estado={estado} />
      <Campo id="chave" rotulo="Chave do painel (variável AVALIACOES_CHAVE no Railway)" icone={KeyRound} type="password" autoComplete="off" disabled={ocupado} />
      <Campo id="nome" rotulo="Seu nome" icone={User} autoComplete="name" defaultValue={estado.valores?.nome} disabled={ocupado} />
      <Campo id="email" rotulo="E-mail (o da sua conta do app, se já tiver)" icone={Mail} type="email" autoComplete="username" defaultValue={estado.valores?.email} disabled={ocupado} />
      <Campo id="senha" rotulo="Senha (a da sua conta do app, se já tiver; conta nova: 10 caracteres ou mais)" icone={Lock} type="password" autoComplete="current-password" disabled={ocupado} />
      <Botao pendente={ocupado} rotulo={indo ? 'Abrindo o painel…' : 'Criar acesso de administrador'} />
    </form>
  );
}

export function FormNovoAdmin() {
  const [estado, acao, pendente] = useActionState(adicionarAdmin, {});
  return (
    <form action={acao} className="flex flex-col gap-3">
      <Mensagem estado={estado} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Campo id="email-admin" name="email" rotulo="E-mail de uma conta do app" icone={Mail} type="email" disabled={pendente} />
        </div>
        <button
          type="submit"
          disabled={pendente}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-adm-marca px-4 font-semibold text-adm-sobre-marca hover:bg-adm-marca-forte disabled:opacity-60"
        >
          {pendente ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
          Dar acesso
        </button>
      </div>
    </form>
  );
}
