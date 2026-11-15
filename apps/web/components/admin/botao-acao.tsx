'use client';

import { Check, LoaderCircle, Pause, Play, ShieldCheck, ShieldOff, Trash2, Undo2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

type Variante = 'primario' | 'secundario' | 'perigo';

// Ícones por nome: componente não atravessa do servidor para o navegador como propriedade.
const ICONES = { pausar: Pause, reativar: Play, remover: Trash2, pago: Check, desfazer: Undo2, admin: ShieldCheck, semAdmin: ShieldOff };
export type IconeAcao = keyof typeof ICONES;

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-adm-marca text-adm-sobre-marca hover:bg-adm-marca-forte',
  secundario: 'border border-adm-linha bg-adm-cartao hover:bg-adm-fundo',
  perigo: 'border border-adm-ruim text-adm-ruim hover:bg-adm-ruim-suave',
};

function Enviar({ rotulo, icone, variante }: { rotulo: string; icone?: IconeAcao; variante: Variante }) {
  const { pending } = useFormStatus();
  const Icone = icone ? ICONES[icone] : null;
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-semibold disabled:opacity-60 ${VARIANTES[variante]}`}
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : Icone ? <Icone className="size-4" aria-hidden /> : null}
      {rotulo}
    </button>
  );
}

/**
 * Botão que chama uma ação do servidor. Ações que apagam ou tiram do ar pedem confirmação antes.
 * Com `depois`, abre essa página com navegação completa quando a ação termina (em vez de redirect()
 * na ação, que em produção monta a página de destino errada).
 */
export function BotaoAcao({
  acao,
  campos,
  rotulo,
  icone,
  variante = 'secundario',
  confirmar,
  depois,
}: {
  acao: (dados: FormData) => Promise<void>;
  campos: Record<string, string>;
  rotulo: string;
  icone?: IconeAcao;
  variante?: Variante;
  confirmar?: string;
  depois?: `/admin${string}`;
}) {
  return (
    <form
      action={
        depois
          ? async (dados: FormData) => {
              await acao(dados);
              window.location.assign(depois);
            }
          : acao
      }
      onSubmit={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
    >
      {Object.entries(campos).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <Enviar rotulo={rotulo} icone={icone} variante={variante} />
    </form>
  );
}
