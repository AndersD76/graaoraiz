'use client';

import Link from 'next/link';
import { useId, useState, type FormEvent } from 'react';
import { AJUDOU, INDICARIA, PERFIS } from '@/lib/avaliacoes';
import { SITE_URL } from '@/lib/config';

type Estado = { tipo: 'parado' } | { tipo: 'enviando' } | { tipo: 'sucesso' } | { tipo: 'erro'; mensagem: string };

const LEGENDA_NOTA = ['', 'Ruim', 'Fraco', 'Bom', 'Muito bom', 'Ótimo'];

const classeCampo =
  'block min-h-12 w-full rounded-xl border border-campo bg-fundo px-4 text-base text-texto placeholder:text-texto-2 disabled:bg-superficie';
const classeRotulo = 'mb-2 block text-lg font-bold';
const classeOpcao =
  'inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-campo bg-fundo px-5 font-semibold text-texto hover:bg-superficie peer-checked:border-marca peer-checked:bg-marca peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-marca';

const CONVITE = `Estou testando o Grão Raiz, o vigia da lavoura: hora de pulverizar, aviso de geada, satélite e preço do dia. É grátis, abre no navegador do celular: ${SITE_URL}`;

function texto(dados: FormData, campo: string): string {
  const v = dados.get(campo);
  return typeof v === 'string' ? v : '';
}

export function FormAvaliacao() {
  const id = useId();
  const [nota, setNota] = useState<number | null>(null);
  const [estado, setEstado] = useState<Estado>({ tipo: 'parado' });
  const enviando = estado.tipo === 'enviando';

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    if (!nota) {
      setEstado({ tipo: 'erro', mensagem: 'Escolha uma nota de 1 a 5 lá em cima.' });
      return;
    }
    const dados = new FormData(evento.currentTarget);
    setEstado({ tipo: 'enviando' });
    try {
      const resposta = await fetch('/api/avaliacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nota,
          indicaria: texto(dados, 'indicaria') || null,
          ajudou: dados.getAll('ajudou').filter((v) => typeof v === 'string'),
          melhorar: texto(dados, 'melhorar'),
          perfil: texto(dados, 'perfil') || null,
          cidade: texto(dados, 'cidade'),
          contato: texto(dados, 'contato'),
          // De onde veio o link (ex.: /avaliar?origem=whatsapp).
          origem: new URLSearchParams(window.location.search).get('origem')?.slice(0, 40) ?? '',
          site: texto(dados, 'site'),
        }),
      });
      const corpo: unknown = await resposta.json().catch(() => null);
      if (resposta.ok) {
        setEstado({ tipo: 'sucesso' });
        window.scrollTo({ top: 0 });
        return;
      }
      const mensagem =
        corpo && typeof corpo === 'object' && 'erro' in corpo && typeof corpo.erro === 'string'
          ? corpo.erro
          : 'Não foi possível enviar agora. Tente de novo em alguns minutos.';
      setEstado({ tipo: 'erro', mensagem });
    } catch {
      setEstado({ tipo: 'erro', mensagem: 'Sem conexão com a internet? Confira e tente de novo.' });
    }
  }

  if (estado.tipo === 'sucesso') {
    return (
      <div role="status" className="rounded-2xl bg-marca-clara p-6">
        <p className="text-2xl font-extrabold">Obrigado pela avaliação!</p>
        <p className="mt-3 text-lg text-texto-2">
          Cada resposta ajuda a deixar o Grão Raiz melhor para quem está na lavoura. Conhece alguém que ia gostar?
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(CONVITE)}`}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-marca px-6 font-semibold text-white hover:bg-marca-escura"
            rel="noopener"
            target="_blank"
          >
            Mandar para um amigo no WhatsApp
          </a>
          {/* <a> e não <Link>: a raiz é o app web (arquivo estático), não uma página do Next. */}
          <a href="/" className="inline-flex min-h-12 items-center justify-center rounded-full border border-campo px-6 font-semibold hover:bg-superficie">
            Voltar ao app
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="relative flex flex-col gap-9" noValidate>
      <fieldset>
        <legend className={classeRotulo}>
          Que nota você dá para o Grão Raiz? <span className="font-normal text-texto-2">(obrigatório)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n}>
              <input
                type="radio"
                name="nota"
                value={n}
                checked={nota === n}
                onChange={() => {
                  setNota(n);
                  if (estado.tipo === 'erro') setEstado({ tipo: 'parado' });
                }}
                className="peer sr-only"
                aria-label={`${n} de 5: ${LEGENDA_NOTA[n]}`}
              />
              <span className={`${classeOpcao} h-14 w-14 rounded-2xl px-0 text-xl`}>{n}</span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-texto-2" aria-hidden="true">
          {nota ? `${nota} — ${LEGENDA_NOTA[nota]}` : '1 é ruim, 5 é ótimo'}
        </p>
      </fieldset>

      <fieldset>
        <legend className={classeRotulo}>Você indicaria para um vizinho?</legend>
        <div className="flex flex-wrap gap-2">
          {INDICARIA.map((o) => (
            <label key={o.valor}>
              <input type="radio" name="indicaria" value={o.valor} className="peer sr-only" />
              <span className={classeOpcao}>{o.rotulo}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={classeRotulo}>
          O que mais ajudou? <span className="font-normal text-texto-2">(marque quantos quiser)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {AJUDOU.map((o) => (
            <label key={o.valor}>
              <input type="checkbox" name="ajudou" value={o.valor} className="peer sr-only" />
              <span className={classeOpcao}>{o.rotulo}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor={`${id}-melhorar`} className={classeRotulo}>
          O que faltou, atrapalhou ou pode melhorar?
        </label>
        <textarea
          id={`${id}-melhorar`}
          name="melhorar"
          rows={4}
          maxLength={2000}
          disabled={enviando}
          placeholder="Escreva do seu jeito: o que você queria ver no app, o que não entendeu, o que deu errado."
          className={`${classeCampo} py-3`}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-perfil`} className={classeRotulo}>
            Você é
          </label>
          <select id={`${id}-perfil`} name="perfil" defaultValue="" disabled={enviando} className={classeCampo}>
            <option value="">Escolha</option>
            {PERFIS.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.rotulo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-cidade`} className={classeRotulo}>
            Cidade <span className="font-normal text-texto-2">(opcional)</span>
          </label>
          <input id={`${id}-cidade`} name="cidade" maxLength={80} autoComplete="address-level2" disabled={enviando} className={classeCampo} />
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-contato`} className={classeRotulo}>
          WhatsApp ou e-mail <span className="font-normal text-texto-2">(opcional)</span>
        </label>
        <input id={`${id}-contato`} name="contato" maxLength={120} disabled={enviando} aria-describedby={`${id}-contato-dica`} className={classeCampo} />
        <p id={`${id}-contato-dica`} className="mt-1.5 text-sm text-texto-2">
          Só se quiser que a gente responda ou chame para conversar.
        </p>
      </div>

      <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        <label>
          Site
          <input name="site" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="inline-flex min-h-14 items-center justify-center rounded-full bg-marca px-6 text-lg font-semibold text-white hover:bg-marca-escura disabled:cursor-wait disabled:opacity-70"
      >
        {enviando ? 'Enviando…' : 'Enviar avaliação'}
      </button>

      <div aria-live="polite" role="status" className="-mt-5 min-h-6">
        {estado.tipo === 'erro' && <p className="rounded-xl border border-ruim bg-fundo px-4 py-3 font-medium text-ruim">{estado.mensagem}</p>}
      </div>

      <p className="-mt-5 text-sm leading-relaxed text-texto-2">
        A avaliação é guardada sem o seu nome. O contato, se você deixar, serve só para responder.{' '}
        <Link href="/privacidade" className="font-semibold text-marca underline underline-offset-2">
          Política de privacidade
        </Link>
        .
      </p>
    </form>
  );
}
