import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Inbox, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

/** Peças visuais do painel (/admin), no estilo do painel do Largo com as cores do Grão Raiz. */

export const fmtData = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' });
export const fmtDataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });
export const fmtNumero = new Intl.NumberFormat('pt-BR');
export const fmtReais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function CabecalhoPagina({ titulo, descricao, children }: { titulo: string; descricao?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        {descricao ? <p className="mt-1 text-sm text-adm-texto-2">{descricao}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function Cartao({ titulo, descricao, acao, children, className = '' }: { titulo?: string; descricao?: string; acao?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-adm-linha bg-adm-cartao ${className}`}>
      {titulo ? (
        <header className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            <h2 className="font-semibold">{titulo}</h2>
            {descricao ? <p className="mt-0.5 text-sm text-adm-texto-2">{descricao}</p> : null}
          </div>
          {acao}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Variação contra o período anterior: número absoluto (com pouco volume, porcentagem engana). */
function Variacao({ atual, antes, rotulo }: { atual: number; antes: number; rotulo: string }) {
  const diferenca = atual - antes;
  if (diferenca === 0) return <p className="mt-1 text-xs text-adm-texto-2">igual {rotulo}</p>;
  const sobe = diferenca > 0;
  const Icone = sobe ? ArrowUpRight : ArrowDownRight;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs">
      <span className={`inline-flex items-center gap-0.5 font-semibold ${sobe ? 'text-adm-bom' : 'text-adm-ruim'}`}>
        <Icone className="size-3.5" aria-hidden />
        {sobe ? '+' : '−'}
        {fmtNumero.format(Math.abs(diferenca))}
      </span>
      <span className="text-adm-texto-2">{rotulo}</span>
    </p>
  );
}

export function CartaoNumero({
  rotulo,
  valor,
  icone: Icone,
  detalhe,
  comparar,
}: {
  rotulo: string;
  valor: string;
  icone: LucideIcon;
  detalhe?: string;
  comparar?: { atual: number; antes: number; rotulo: string };
}) {
  return (
    <div className="rounded-xl border border-adm-linha bg-adm-cartao p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-adm-texto-2">{rotulo}</p>
        <span className="rounded-lg bg-adm-marca-suave p-2 text-adm-marca">
          <Icone className="size-5" aria-hidden />
        </span>
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums">{valor}</p>
      {comparar ? <Variacao {...comparar} /> : detalhe ? <p className="mt-1 text-xs text-adm-texto-2">{detalhe}</p> : null}
    </div>
  );
}

type Tom = 'neutro' | 'bom' | 'atencao' | 'ruim' | 'marca';

const TONS: Record<Tom, string> = {
  neutro: 'bg-adm-fundo text-adm-texto-2 border border-adm-linha',
  bom: 'bg-adm-bom-suave text-adm-bom',
  atencao: 'bg-adm-atencao-suave text-adm-atencao',
  ruim: 'bg-adm-ruim-suave text-adm-ruim',
  marca: 'bg-adm-marca-suave text-adm-marca',
};

export function Selo({ tom = 'neutro', children }: { tom?: Tom; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONS[tom]}`}>{children}</span>;
}

export function SeloSituacao({ situacao }: { situacao: string }) {
  const mapa: Record<string, [Tom, string]> = {
    ativo: ['bom', 'No ar'],
    pausado: ['atencao', 'Pausado'],
    vendido: ['marca', 'Vendido'],
    removido: ['neutro', 'Removido'],
  };
  const [tom, rotulo] = mapa[situacao] ?? ['neutro', situacao];
  return <Selo tom={tom}>{rotulo}</Selo>;
}

/** Tabela com rolagem lateral no celular. */
export function Tabela({ cabecalho, children, legenda }: { cabecalho: ReactNode[]; children: ReactNode; legenda: string }) {
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">{legenda}</caption>
        <thead>
          <tr className="border-b border-adm-linha text-xs uppercase tracking-wide text-adm-texto-2">
            {cabecalho.map((c, i) => (
              <th key={i} scope="col" className="px-5 py-2.5 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-adm-linha">{children}</tbody>
      </table>
    </div>
  );
}

export function Celula({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <td className={`px-5 py-3 align-middle ${className}`}>{children}</td>;
}

export function Vazio({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Inbox className="size-8 text-adm-texto-2" aria-hidden />
      <p className="font-semibold">{titulo}</p>
      {texto ? <p className="max-w-sm text-sm text-adm-texto-2">{texto}</p> : null}
    </div>
  );
}

/** Endereço da mesma página trocando um parâmetro (filtros e paginação são links: funcionam sem JavaScript). */
export function comParametro(base: string, atuais: Record<string, string>, muda: Record<string, string | null>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...atuais, ...muda })) if (v) p.set(k, v);
  const q = p.toString();
  return q ? `${base}?${q}` : base;
}

export function Filtros({ opcoes, atual, base, parametros, nome }: { opcoes: { valor: string; rotulo: string }[]; atual: string; base: string; parametros: Record<string, string>; nome: string }) {
  return (
    <nav aria-label="Filtro" className="flex flex-wrap gap-1 rounded-lg border border-adm-linha bg-adm-cartao p-1">
      {opcoes.map((o) => {
        const ativo = o.valor === atual;
        return (
          <Link
            key={o.valor}
            href={comParametro(base, parametros, { [nome]: o.valor, pagina: null })}
            aria-current={ativo ? 'page' : undefined}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${ativo ? 'bg-adm-marca text-adm-sobre-marca' : 'text-adm-texto-2 hover:bg-adm-fundo hover:text-adm-texto'}`}
          >
            {o.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

export function Paginacao({ pagina, total, porPagina, base, parametros }: { pagina: number; total: number; porPagina: number; base: string; parametros: Record<string, string> }) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  if (paginas <= 1) return null;
  const classe = 'inline-flex min-h-9 items-center gap-1 rounded-md border border-adm-linha px-3 text-sm font-medium hover:bg-adm-fundo';
  return (
    <nav aria-label="Páginas" className="mt-4 flex items-center justify-between gap-3 text-sm">
      <span className="text-adm-texto-2">
        Página {pagina} de {paginas} · {fmtNumero.format(total)} no total
      </span>
      <span className="flex gap-2">
        {pagina > 1 ? (
          <Link href={comParametro(base, parametros, { pagina: String(pagina - 1) })} className={classe}>
            <ChevronLeft className="size-4" aria-hidden /> Anterior
          </Link>
        ) : null}
        {pagina < paginas ? (
          <Link href={comParametro(base, parametros, { pagina: String(pagina + 1) })} className={classe}>
            Próxima <ChevronRight className="size-4" aria-hidden />
          </Link>
        ) : null}
      </span>
    </nav>
  );
}

export function CampoBusca({ base, valor, placeholder, ocultos = {} }: { base: string; valor: string; placeholder: string; ocultos?: Record<string, string> }) {
  return (
    <form action={base} method="get" role="search" className="flex gap-2">
      {Object.entries(ocultos).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <label className="sr-only" htmlFor={`busca-${base}`}>
        {placeholder}
      </label>
      <input
        id={`busca-${base}`}
        name="q"
        defaultValue={valor}
        placeholder={placeholder}
        className="min-h-10 w-full min-w-0 rounded-lg border border-adm-linha bg-adm-cartao px-3 text-sm placeholder:text-adm-texto-2 sm:w-72"
      />
      <button type="submit" className="min-h-10 rounded-lg border border-adm-linha bg-adm-cartao px-4 text-sm font-semibold hover:bg-adm-fundo">
        Buscar
      </button>
    </form>
  );
}

export function Carregando() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Carregando">
      <div className="mb-6 h-8 w-56 rounded-lg bg-adm-linha" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-xl border border-adm-linha bg-adm-cartao" />
        ))}
      </div>
      <div className="mt-6 h-72 rounded-xl border border-adm-linha bg-adm-cartao" />
    </div>
  );
}

export function LinkTexto({ href, children, externo = false }: { href: string; children: ReactNode; externo?: boolean }) {
  return (
    <Link href={href} className="font-medium text-adm-marca underline-offset-2 hover:underline" {...(externo ? { target: '_blank', rel: 'noopener' } : {})}>
      {children}
    </Link>
  );
}
