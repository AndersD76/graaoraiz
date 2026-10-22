'use client';

import Link from 'next/link';
import { useId, useRef, useState, type FormEvent } from 'react';
import { UFS } from '@/lib/ufs';

type Estado =
  | { tipo: 'parado' }
  | { tipo: 'enviando' }
  | { tipo: 'sucesso' }
  | { tipo: 'erro'; mensagem: string };

const CULTURAS = ['Soja', 'Milho', 'Trigo', 'Soja e milho', 'Feijão', 'Algodão', 'Café', 'Arroz'];

const classeCampo =
  'block min-h-12 w-full rounded-xl border border-campo bg-fundo px-4 text-base text-texto placeholder:text-texto-2 disabled:bg-superficie';
const classeRotulo = 'mb-1.5 block font-semibold';

function texto(dados: FormData, campo: string): string {
  const v = dados.get(campo);
  return typeof v === 'string' ? v : '';
}

export function FormListaEspera() {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [estado, setEstado] = useState<Estado>({ tipo: 'parado' });
  const enviando = estado.tipo === 'enviando';

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    const dados = new FormData(evento.currentTarget);
    setEstado({ tipo: 'enviando' });

    try {
      const resposta = await fetch('/api/lista-espera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: texto(dados, 'nome'),
          contato: texto(dados, 'contato'),
          cidade: texto(dados, 'cidade'),
          uf: texto(dados, 'uf'),
          cultura: texto(dados, 'cultura'),
          querTestar: dados.get('querTestar') === 'sim',
          site: texto(dados, 'site'),
        }),
      });
      const corpo: unknown = await resposta.json().catch(() => null);
      if (resposta.ok) {
        formRef.current?.reset();
        setEstado({ tipo: 'sucesso' });
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

  return (
    <form ref={formRef} onSubmit={enviar} className="relative flex flex-col gap-5">
      <div>
        <label htmlFor={`${id}-contato`} className={classeRotulo}>
          WhatsApp ou e-mail <span className="font-normal text-texto-2">(obrigatório)</span>
        </label>
        <input
          id={`${id}-contato`}
          name="contato"
          type="text"
          required
          maxLength={120}
          autoComplete="on"
          aria-describedby={`${id}-contato-dica`}
          className={classeCampo}
          disabled={enviando}
        />
        <p id={`${id}-contato-dica`} className="mt-1.5 text-sm text-texto-2">
          Ex.: (41) 99999-1234 ou nome@email.com
        </p>
      </div>

      <div>
        <label htmlFor={`${id}-nome`} className={classeRotulo}>
          Nome <span className="font-normal text-texto-2">(opcional)</span>
        </label>
        <input
          id={`${id}-nome`}
          name="nome"
          type="text"
          maxLength={80}
          autoComplete="name"
          className={classeCampo}
          disabled={enviando}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
        <div>
          <label htmlFor={`${id}-cidade`} className={classeRotulo}>
            Cidade <span className="font-normal text-texto-2">(opcional)</span>
          </label>
          <input
            id={`${id}-cidade`}
            name="cidade"
            type="text"
            maxLength={80}
            autoComplete="address-level2"
            className={classeCampo}
            disabled={enviando}
          />
        </div>
        <div>
          <label htmlFor={`${id}-uf`} className={classeRotulo}>
            UF <span className="font-normal text-texto-2">(opcional)</span>
          </label>
          <select
            id={`${id}-uf`}
            name="uf"
            defaultValue=""
            autoComplete="address-level1"
            className={classeCampo}
            disabled={enviando}
          >
            <option value="">—</option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-cultura`} className={classeRotulo}>
          Principal cultura <span className="font-normal text-texto-2">(opcional)</span>
        </label>
        <input
          id={`${id}-cultura`}
          name="cultura"
          type="text"
          maxLength={40}
          list={`${id}-culturas`}
          placeholder="Ex.: soja e milho"
          className={classeCampo}
          disabled={enviando}
        />
        <datalist id={`${id}-culturas`}>
          {CULTURAS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-linha bg-fundo px-4 py-2">
        <input
          type="checkbox"
          name="querTestar"
          value="sim"
          className="h-6 w-6 shrink-0 accent-marca"
          disabled={enviando}
        />
        <span>Quero testar a versão de teste no Android</span>
      </label>

      {/* Armadilha para robôs: fora da tela, fora da ordem de tabulação e oculta de leitores de tela. */}
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        <label htmlFor={`${id}-site`}>Site</label>
        <input id={`${id}-site`} name="site" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-marca px-6 text-base font-semibold text-white hover:bg-marca-escura disabled:cursor-wait disabled:opacity-70"
      >
        {enviando ? 'Enviando…' : 'Entrar na lista de espera'}
      </button>

      <div aria-live="polite" role="status" className="min-h-6">
        {estado.tipo === 'sucesso' && (
          <p className="rounded-xl border border-bom bg-marca-clara px-4 py-3 font-medium text-texto">
            Pronto! Você está na lista. Vamos avisar quando o app estiver disponível.
          </p>
        )}
        {estado.tipo === 'erro' && (
          <p className="rounded-xl border border-ruim bg-fundo px-4 py-3 font-medium text-ruim">{estado.mensagem}</p>
        )}
      </div>

      <p className="text-sm leading-relaxed text-texto-2">
        Usamos esses dados só para avisar sobre o lançamento e convidar para testes. Você pode pedir a remoção quando
        quiser. Veja a{' '}
        <Link href="/privacidade" className="font-semibold text-marca underline underline-offset-2">
          Política de Privacidade
        </Link>
        .
      </p>
    </form>
  );
}
