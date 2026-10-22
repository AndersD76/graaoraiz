import { APP_STORE_URL, PLAY_URL } from '@/lib/config';

function IconeBaixar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 3v11m0 0-4.5-4.5M12 14l4.5-4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const classeBotao =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-texto bg-fundo px-5 font-semibold text-texto hover:bg-superficie';

/** Há pelo menos um link de loja configurado. */
export const TEM_LOJA = Boolean(PLAY_URL || APP_STORE_URL);

/**
 * Botões das lojas. Só aparecem quando o link existe; caso contrário, um aviso curto de "em breve".
 * Não usamos os selos oficiais das lojas para não depender de arquivos externos.
 */
export function BotoesLoja({ classeTexto = 'text-texto-2' }: { classeTexto?: string }) {
  if (!TEM_LOJA) {
    return <p className={`text-sm ${classeTexto}`}>Em breve no Android e no iPhone</p>;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {PLAY_URL && (
        <a href={PLAY_URL} className={classeBotao} rel="noopener">
          <IconeBaixar />
          Baixar no Google Play
        </a>
      )}
      {APP_STORE_URL && (
        <a href={APP_STORE_URL} className={classeBotao} rel="noopener">
          <IconeBaixar />
          Baixar na App Store
        </a>
      )}
      {!PLAY_URL && <p className={`text-sm ${classeTexto}`}>Em breve no Android</p>}
      {!APP_STORE_URL && <p className={`text-sm ${classeTexto}`}>Em breve no iPhone</p>}
    </div>
  );
}
