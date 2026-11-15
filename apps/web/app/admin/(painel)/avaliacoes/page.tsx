import { MessageSquareText, Phone, Star, ThumbsUp } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BarrasDeitadas } from '@/components/admin/graficos';
import { CabecalhoPagina, Cartao, CartaoNumero, Carregando, fmtDataHora, fmtNumero, Selo, Vazio } from '@/components/admin/ui';
import { exigirAdmin } from '@/lib/admin/auth';
import { avaliacoes } from '@/lib/admin/consultas';
import { AJUDOU, INDICARIA, PERFIS, rotuloDe } from '@/lib/avaliacoes';

export const metadata: Metadata = { title: 'Avaliações' };

async function Conteudo() {
  await exigirAdmin();
  const linhas = await avaliacoes();
  const media = linhas.length ? linhas.reduce((s, l) => s + l.nota, 0) / linhas.length : null;
  const comIndicacao = linhas.filter((l) => l.indicaria);
  const pct = (n: number, de: number) => (de ? `${Math.round((n / de) * 100)}%` : '—');
  const contagem = AJUDOU.map((o) => ({ rotulo: o.rotulo, n: linhas.filter((l) => l.ajudou.includes(o.valor)).length })).sort((a, b) => b.n - a.n);

  return (
    <>
      <CabecalhoPagina titulo="Avaliações" descricao="Respostas do formulário da versão de teste (página /avaliar)." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CartaoNumero rotulo="Avaliações" valor={fmtNumero.format(linhas.length)} icone={MessageSquareText} />
        <CartaoNumero rotulo="Nota média (0 a 10)" valor={media === null ? '—' : media.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} icone={Star} />
        <CartaoNumero rotulo="Indicariam" valor={pct(comIndicacao.filter((l) => l.indicaria === 'sim').length, comIndicacao.length)} icone={ThumbsUp} />
        <CartaoNumero rotulo="Deixaram contato" valor={fmtNumero.format(linhas.filter((l) => l.contato).length)} icone={Phone} />
      </div>

      {linhas.length ? (
        <div className="grid gap-6 xl:grid-cols-3">
          <Cartao titulo="O que mais ajudou">
            <BarrasDeitadas titulo="O que mais ajudou" dados={contagem} />
          </Cartao>
          <Cartao titulo="Respostas" className="xl:col-span-2">
            <ul className="-my-3 divide-y divide-adm-linha">
              {linhas.map((l, i) => (
                <li key={i} className="py-3 text-sm">
                  <p className="flex flex-wrap items-center gap-2">
                    <Selo tom={l.nota >= 8 ? 'bom' : l.nota >= 6 ? 'atencao' : 'ruim'}>Nota {l.nota}</Selo>
                    <span className="font-medium">Indicaria: {rotuloDe(INDICARIA, l.indicaria)}</span>
                    <span className="text-adm-texto-2">
                      {rotuloDe(PERFIS, l.perfil)}
                      {l.cidade ? ` · ${l.cidade}` : ''}
                    </span>
                  </p>
                  {l.ajudou.length ? <p className="mt-1 text-adm-texto-2">Ajudou: {l.ajudou.map((v) => rotuloDe(AJUDOU, v)).join(', ')}</p> : null}
                  {l.melhorar ? <p className="mt-2 whitespace-pre-line">{l.melhorar}</p> : null}
                  <p className="mt-2 text-adm-texto-2">
                    {fmtDataHora.format(l.criado_em)}
                    {l.origem ? ` · veio de ${l.origem}` : ''}
                    {l.contato ? ` · contato: ${l.contato}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </Cartao>
        </div>
      ) : (
        <Cartao>
          <Vazio titulo="Nenhuma avaliação ainda" texto="Mande o link /avaliar junto do convite para testar o app." />
        </Cartao>
      )}
    </>
  );
}

export default function Avaliacoes() {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo />
    </Suspense>
  );
}
