import { fmtNumero } from './ui';

/**
 * Gráficos do painel, desenhados no servidor (sem biblioteca). Uma série só, na cor de gráfico do tema
 * (validada contra o fundo claro e o escuro). Barras finas com ponta arredondada, valores em texto neutro,
 * dica ao passar o mouse ou focar, e a mesma informação numa tabela.
 */

const dataCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });
const dataLonga = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' });

/** Teto "redondo" do eixo: 1, 2, 5, 10, 20, 50… */
function teto(max: number): number {
  if (max <= 1) return 1;
  const base = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 5, 10]) if (max <= m * base) return m * base;
  return 10 * base;
}

function TabelaDados({ titulo, linhas }: { titulo: string; linhas: [string, string][] }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-adm-texto-2 hover:text-adm-texto">Ver em tabela</summary>
      <table className="mt-2 w-full text-left">
        <caption className="sr-only">{titulo}</caption>
        <tbody className="divide-y divide-adm-linha">
          {linhas.map(([a, b]) => (
            <tr key={a}>
              <th scope="row" className="py-1.5 pr-4 font-normal text-adm-texto-2">
                {a}
              </th>
              <td className="py-1.5 text-right tabular-nums">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/** Colunas por dia (ex.: contas criadas). */
export function ColunasPorDia({ titulo, dados, unidade }: { titulo: string; dados: { dia: string; n: number }[]; unidade: [string, string] }) {
  const max = teto(Math.max(0, ...dados.map((d) => d.n)));
  const total = dados.reduce((s, d) => s + d.n, 0);
  const quando = (dia: string) => new Date(`${dia}T00:00:00Z`);
  const rotulo = (n: number) => `${fmtNumero.format(n)} ${n === 1 ? unidade[0] : unidade[1]}`;
  // Rótulos do eixo X: primeiro, meio e último dia.
  const marcas = new Set([0, Math.floor((dados.length - 1) / 2), dados.length - 1]);
  return (
    <figure>
      <figcaption className="sr-only">
        {titulo}: {rotulo(total)} no período.
      </figcaption>
      <div className="flex gap-2">
        <div className="flex h-48 flex-col justify-between pb-6 text-right text-xs tabular-nums text-adm-texto-2" aria-hidden>
          <span>{fmtNumero.format(max)}</span>
          <span>{fmtNumero.format(max / 2)}</span>
          <span>0</span>
        </div>
        <div className="relative flex-1">
          {/* Grade: linhas finas e discretas. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-42 border-t border-adm-linha" aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 top-21 border-t border-adm-linha" aria-hidden />
          <div className="flex h-42 items-end gap-0.5 border-b border-adm-linha">
            {dados.map((d) => (
              <div key={d.dia} className="group relative flex h-full flex-1 items-end justify-center" tabIndex={0} aria-label={`${dataLonga.format(quando(d.dia))}: ${rotulo(d.n)}`}>
                <div className="w-full max-w-6 rounded-t bg-adm-grafico" style={{ height: d.n ? `${Math.max(2, (d.n / max) * 100)}%` : 0 }} />
                <div
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-md border border-adm-linha bg-adm-cartao px-2 py-1 text-xs shadow-md group-hover:block group-focus:block"
                >
                  <strong className="tabular-nums">{fmtNumero.format(d.n)}</strong> <span className="text-adm-texto-2">{dataLonga.format(quando(d.dia))}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex h-4 text-xs text-adm-texto-2" aria-hidden>
            {dados.map((d, i) => (
              <span key={d.dia} className="flex-1 text-center">
                {marcas.has(i) ? dataCurta.format(quando(d.dia)) : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
      <TabelaDados titulo={titulo} linhas={dados.map((d) => [dataLonga.format(quando(d.dia)), fmtNumero.format(d.n)])} />
    </figure>
  );
}

/** Barras deitadas com o valor na ponta (funil, categorias). `relativo` mostra a % sobre a primeira linha. */
export function BarrasDeitadas({ titulo, dados, relativo = false }: { titulo: string; dados: { rotulo: string; n: number }[]; relativo?: boolean }) {
  const max = Math.max(1, ...dados.map((d) => d.n));
  const base = dados[0]?.n ?? 0;
  return (
    <figure>
      <figcaption className="sr-only">{titulo}</figcaption>
      <ul className="flex flex-col gap-3">
        {dados.map((d, i) => {
          const pct = relativo && i > 0 && base > 0 ? ` · ${Math.round((d.n / base) * 100)}%` : '';
          return (
            <li key={d.rotulo} className="grid grid-cols-[minmax(0,11rem)_1fr] items-center gap-3 text-sm" title={`${d.rotulo}: ${fmtNumero.format(d.n)}${pct}`}>
              <span className="truncate text-adm-texto-2">{d.rotulo}</span>
              <span className="flex items-center gap-2">
                <span className="h-5 rounded-r bg-adm-grafico" style={{ width: d.n ? `${Math.max(1, (d.n / max) * 85)}%` : 0 }} aria-hidden />
                <span className="whitespace-nowrap font-semibold tabular-nums">
                  {fmtNumero.format(d.n)}
                  <span className="font-normal text-adm-texto-2">{pct}</span>
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <TabelaDados titulo={titulo} linhas={dados.map((d, i) => [d.rotulo, `${fmtNumero.format(d.n)}${relativo && i > 0 && base > 0 ? ` (${Math.round((d.n / base) * 100)}%)` : ''}`])} />
    </figure>
  );
}
