import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd, Trilha } from '@/components/seo/pecas';
import { ContatoWhatsApp } from '@/components/contato-whatsapp';
import { CONTATO_WHATSAPP_TELEFONE, RESPONSAVEL, RESPONSAVEL_PENDENTE } from '@/lib/config';
import { metadadosPagina } from '@/lib/metadados';
import { absoluta } from '@/lib/seo';

export const metadata: Metadata = metadadosPagina({
  titulo: 'Sobre o Grão Raiz e política editorial',
  tituloAbsoluto: true,
  descricao: 'Quem faz o Grão Raiz, de onde vêm os dados das páginas e como o conteúdo é escrito, revisado e corrigido.',
  caminho: '/sobre',
});

export default function Sobre() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <Trilha itens={[{ nome: 'Sobre', caminho: '/sobre' }]} />
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Sobre o Grão Raiz</h1>
      <p className="mt-4 text-lg leading-relaxed">
        O Grão Raiz é um app grátis para o produtor de grãos: mostra a hora certa de pulverizar, avisa geada e temporal, guarda o caderno de campo e reúne preços,
        satélite e classificados de máquinas usados sem comissão. O responsável pelo app e pelo conteúdo deste site é {RESPONSAVEL}.
      </p>

      <h2 className="mt-10 text-2xl font-bold">Contato</h2>
      <p className="mt-3">
        Fale com a gente pelo <ContatoWhatsApp mensagem="Olá! Vim pelo site do Grão Raiz." className="font-semibold underline-offset-2 hover:underline" />. Para dados pessoais, veja a{' '}
        <Link href="/privacidade" className="underline-offset-2 hover:underline">Política de Privacidade</Link>.
      </p>

      <h2 className="mt-10 text-2xl font-bold">Política editorial</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <li>
          <strong>Dado primeiro.</strong> As páginas por município são montadas com dado de verdade: a previsão hora a hora do Open-Meteo, as regras de aplicação do
          app e a Produção Agrícola Municipal do IBGE. Município sem dado suficiente não ganha página.
        </li>
        <li>
          <strong>Nada inventado.</strong> Todo número, faixa, norma ou prazo citado tem fonte oficial ou técnica, listada no fim da página com a data da consulta.
          Quando não há fonte confiável, o número não entra.
        </li>
        <li>
          <strong>Portão de qualidade.</strong> Antes de ir ao ar, cada página passa por uma checagem: responde a pergunta logo no começo, tem fonte, tem algo
          próprio (cálculo, dado ou exemplo), não repete outra página do site e leva o leitor para onde ele precisa ir.
        </li>
        <li>
          <strong>Revisão e correção.</strong> Cada página mostra a data da última atualização. Achou um erro? Escreva para o e-mail acima; a correção é feita e a data
          muda.
        </li>
        <li>
          <strong>Limites.</strong> O Grão Raiz não é receituário agronômico: produto, dose e momento de aplicação são orientação do engenheiro agrônomo responsável.
          Previsões são estimativas. Veja a <Link href="/metodologia" className="underline-offset-2 hover:underline">metodologia</Link>.
        </li>
      </ul>
      <JsonLd
        dados={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          url: absoluta('/sobre'),
          name: 'Sobre o Grão Raiz',
          mainEntity: {
            '@type': 'Organization',
            name: 'Grão Raiz',
            url: absoluta('/'),
            telephone: CONTATO_WHATSAPP_TELEFONE,
            ...(RESPONSAVEL_PENDENTE ? {} : { founder: { '@type': 'Person', name: RESPONSAVEL } }),
          },
        }}
      />
    </article>
  );
}
