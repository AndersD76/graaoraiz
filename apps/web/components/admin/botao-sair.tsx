'use client';

import { LogOut } from 'lucide-react';
import { sair } from '@/app/admin/acoes';

/** Apaga a sessão e abre a tela de entrar com navegação completa (sem redirect() na ação). */
export function BotaoSair() {
  return (
    <form
      action={async () => {
        await sair();
        window.location.replace('/admin/entrar');
      }}
    >
      <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-adm-ruim hover:bg-adm-ruim-suave">
        <LogOut className="size-4" aria-hidden /> Sair
      </button>
    </form>
  );
}
