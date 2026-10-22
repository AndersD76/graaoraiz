type Situacao = 'bom' | 'atencao' | 'ruim';

const ESTILO: Record<Situacao, { fundo: string; borda: string; rotulo: string }> = {
  bom: { fundo: 'bg-bom', borda: 'border-l-bom', rotulo: 'Bom' },
  atencao: { fundo: 'bg-atencao', borda: 'border-l-atencao', rotulo: 'Atenção' },
  ruim: { fundo: 'bg-ruim', borda: 'border-l-ruim', rotulo: 'Ruim' },
};

function Linha({
  titulo,
  situacao,
  rotulo,
  texto,
  detalhe,
}: {
  titulo: string;
  situacao: Situacao;
  rotulo?: string;
  texto: string;
  detalhe?: string;
}) {
  const e = ESTILO[situacao];
  return (
    <li className={`rounded-xl border border-linha border-l-[6px] ${e.borda} bg-fundo p-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">{titulo}</span>
        <span className={`rounded-full ${e.fundo} px-3 py-1 text-xs font-bold uppercase tracking-wide text-white`}>
          {rotulo ?? e.rotulo}
        </span>
      </div>
      <p className="mt-1 text-[0.95rem] font-medium">{texto}</p>
      {detalhe && <p className="mt-1 text-sm text-texto-2">{detalhe}</p>}
    </li>
  );
}

/** Representação estática do cartão do app. Os valores são fictícios e a legenda diz isso. */
export function CartaoExemplo() {
  return (
    <figure className="mx-auto w-full max-w-sm">
      <div className="rounded-3xl border border-linha bg-superficie p-4 shadow-sm" aria-hidden="true">
        <div className="mb-3 flex items-baseline justify-between gap-2 px-1">
          <span className="font-bold">Talhão da Sede</span>
          <span className="text-sm text-texto-2">Hoje</span>
        </div>
        <ul className="flex flex-col gap-3">
          <Linha
            titulo="Pulverizar"
            situacao="bom"
            texto="Bom das 6h às 10h"
            detalhe="Vento na barra 7 km/h · Delta T 5 °C · Umidade 70%"
          />
          <Linha
            titulo="Colher e entrar com máquina"
            situacao="atencao"
            texto="Chuva prevista a partir das 15h"
            detalhe="Próxima janela seca: quinta a sábado"
          />
          <Linha titulo="Geada e temporal" situacao="bom" rotulo="Sem aviso" texto="Nenhum aviso para os próximos dias" />
        </ul>
      </div>
      <figcaption className="mt-3 text-center text-sm text-texto-2">
        <span className="sr-only">
          Cartão de exemplo do app: pulverizar, bom das 6h às 10h; colher e entrar com máquina, atenção, chuva prevista
          a partir das 15h; geada e temporal, sem aviso.{' '}
        </span>
        Exemplo ilustrativo — os valores não são de uma previsão real.
      </figcaption>
    </figure>
  );
}
