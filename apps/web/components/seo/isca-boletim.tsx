'use client';

import { useState } from 'react';
import { type ContextoPagina, enviarEvento } from './rastreio';

function lerToque(chave: string): unknown {
  try {
    const v = localStorage.getItem(chave);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

/**
 * Isca do boletim diário de pulverização do município. O resultado já está na página (sem cadastro);
 * o e-mail traz as janelas toda manhã. Opt-in de novidades separado e desmarcado.
 */
export function IscaBoletim({ municipio, codigo, contexto, variante = 'cartao' }: { municipio: string; codigo: string; contexto: ContextoPagina; variante?: 'cartao' | 'faixa' }) {
  const [email, setEmail] = useState('');
  const [aceite, setAceite] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [estado, setEstado] = useState<'livre' | 'enviando' | 'feito' | 'erro'>('livre');
  const [mensagem, setMensagem] = useState('');
  const [comecou, setComecou] = useState(false);
  const id = `boletim-${variante}`;

  const comecar = () => {
    if (comecou) return;
    setComecou(true);
    enviarEvento('isca_iniciada', contexto);
  };

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!aceite) {
      setEstado('erro');
      setMensagem('Marque que quer receber o boletim.');
      return;
    }
    setEstado('enviando');
    try {
      const site = (e.currentTarget.elements.namedItem('site') as HTMLInputElement | null)?.value ?? '';
      const r = await fetch('/api/iscas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          isca: 'boletim-pulverizacao-municipio',
          municipio: codigo,
          pagina: location.pathname,
          consulta: contexto.consulta_alvo,
          aceiteIsca: true,
          aceiteMarketing: marketing,
          primeiro: lerToque('graoraiz:primeiro-toque'),
          ultimo: lerToque('graoraiz:ultimo-toque'),
          site,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as { erro?: string };
      if (!r.ok) throw new Error(j.erro ?? 'Não deu para salvar agora.');
      setEstado('feito');
      setMensagem(`Pronto! Você está na lista do boletim de ${municipio}. O primeiro e-mail chega numa das próximas manhãs.`);
    } catch (erro) {
      setEstado('erro');
      setMensagem(erro instanceof Error ? erro.message : 'Não deu para salvar agora.');
    }
  };

  return (
    <aside data-isca="boletim-pulverizacao-municipio" aria-labelledby={`${id}-titulo`} className="rounded-2xl border border-marca/30 bg-marca-clara p-5 sm:p-6">
      <h2 id={`${id}-titulo`} className="text-xl font-bold">
        Receba as janelas de {municipio} toda manhã
      </h2>
      <p className="mt-1 text-texto-2">Grátis, por e-mail: a melhor hora para pulverizar hoje e nos próximos dias, com chuva prevista.</p>
      {estado === 'feito' ? (
        <p role="status" className="mt-4 rounded-xl bg-white p-4 font-medium text-bom">
          {mensagem}
        </p>
      ) : (
        <form onSubmit={enviar} onFocus={comecar} className="mt-4 flex flex-col gap-3" noValidate>
          <label htmlFor={`${id}-email`} className="text-sm font-semibold">
            Seu e-mail
          </label>
          <input
            id={`${id}-email`}
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-11 rounded-xl border border-campo bg-white px-3 text-base"
            placeholder="voce@exemplo.com"
          />
          {/* Campo-armadilha para robôs: escondido de pessoas e leitores de tela. */}
          <input type="text" name="site" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" defaultValue="" />
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} className="mt-1 size-4" required />
            <span>Quero receber o boletim de pulverização de {municipio} por e-mail. Saio quando quiser, em 1 clique.</span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-1 size-4" />
            <span>Também quero receber novidades do Grão Raiz (opcional).</span>
          </label>
          {estado === 'erro' ? (
            <p role="alert" className="text-sm font-medium text-ruim">
              {mensagem}
            </p>
          ) : null}
          <button type="submit" disabled={estado === 'enviando'} className="min-h-11 rounded-xl bg-marca px-5 font-semibold text-white hover:bg-marca-escura disabled:opacity-60">
            {estado === 'enviando' ? 'Enviando…' : 'Quero o boletim grátis'}
          </button>
          <p className="text-xs text-texto-2">
            Usamos o e-mail só para isso. Veja a <a href="/privacidade" className="underline">Política de Privacidade</a>.
          </p>
        </form>
      )}
    </aside>
  );
}
