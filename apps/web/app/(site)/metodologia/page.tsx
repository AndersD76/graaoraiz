import type { Metadata } from 'next';
import Link from 'next/link';
import { Autoria, Fontes, Trilha } from '@/components/seo/pecas';
import { metadadosPagina } from '@/lib/metadados';
import { CRITERIOS, FONTES_METODO } from '@/lib/seo/criterios';
import { LIMIAR_AREA_GRAOS_HA } from '@/lib/seo/municipios';

export const metadata: Metadata = metadadosPagina({
  titulo: 'Metodologia: como o Grão Raiz calcula a hora de pulverizar',
  tituloAbsoluto: true,
  descricao: 'Os critérios, as fórmulas e as fontes por trás das janelas de pulverização, da previsão por município e dos dados de lavoura do Grão Raiz.',
  caminho: '/metodologia',
});

export default function Metodologia() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <Trilha itens={[{ nome: 'Metodologia', caminho: '/metodologia' }]} />
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Como o Grão Raiz calcula a hora de pulverizar</h1>
      <p className="mt-4 text-lg leading-relaxed">
        Para cada hora da previsão, o Grão Raiz avalia seis critérios: delta T, vento e rajada na altura da barra, umidade, temperatura e chuva nas duas horas
        seguintes. A hora é boa quando passa em todos; basta um critério ruim para ela ficar vermelha. Janela é a sequência de pelo menos duas horas boas seguidas.
      </p>
      <Autoria revisadoEm="2026-11-18" />

      <h2 className="mt-10 text-2xl font-bold">Os critérios e as faixas</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-linha">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">Critérios de pulverização usados pelo Grão Raiz</caption>
          <thead className="bg-superficie text-texto-2">
            <tr>
              <th scope="col" className="px-4 py-3">Critério</th>
              <th scope="col" className="px-4 py-3">Boa</th>
              <th scope="col" className="px-4 py-3">Com cuidado</th>
              <th scope="col" className="px-4 py-3">Não aplicar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linha">
            {CRITERIOS.map((c) => (
              <tr key={c.criterio}>
                <th scope="row" className="px-4 py-3 font-medium">{c.criterio}</th>
                <td className="px-4 py-3">{c.boa}</td>
                <td className="px-4 py-3">{c.cuidado}</td>
                <td className="px-4 py-3">{c.naoAplicar}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-texto-2">
        As faixas seguem recomendações técnicas usuais de tecnologia de aplicação e são as mesmas em todo o app. Elas não substituem a orientação do engenheiro
        agrônomo nem a bula do produto, que podem pedir condições mais restritas.
      </p>

      <h2 className="mt-10 text-2xl font-bold">De onde vêm os números</h2>
      <ul className="mt-4 list-disc space-y-3 pl-5">
        <li>
          <strong>Previsão:</strong> temperatura, umidade, vento, rajada, chuva e chance de chuva hora a hora vêm do Open-Meteo, que reúne modelos meteorológicos
          nacionais e globais. O app pede 7 dias de previsão para o ponto.
        </li>
        <li>
          <strong>Vento na barra:</strong> os modelos informam o vento a 10 m de altura. O app converte para 2 m pelo perfil logarítmico da FAO-56 (equação 47), o
          que dá cerca de 75% do vento a 10 m.
        </li>
        <li>
          <strong>Delta T:</strong> diferença entre a temperatura do ar e a de bulbo úmido. O bulbo úmido é estimado pela fórmula de Stull (2011) a partir da
          temperatura e da umidade. Teste na <Link href="/ferramentas/delta-t" className="underline-offset-2 hover:underline">calculadora de delta T</Link>.
        </li>
        <li>
          <strong>Geada:</strong> o app procura noites frias com céu limpo e vento calmo, quando a folha esfria mais que o ar a 2 m, e estima a temperatura na relva.
        </li>
      </ul>

      <h2 className="mt-10 text-2xl font-bold">As páginas por município</h2>
      <p className="mt-4">
        Cada página de <Link href="/hora-de-pulverizar" className="underline-offset-2 hover:underline">hora de pulverizar por município</Link> usa o centro da malha
        municipal do IBGE como ponto da previsão. Só ganha página o município com pelo menos {LIMIAR_AREA_GRAOS_HA.toLocaleString('pt-BR')} ha de grãos plantados na
        Produção Agrícola Municipal (PAM) do IBGE, para que a página traga dado local de verdade. A previsão é guardada por algumas horas e recalculada depois.
        Para o ponto exato da lavoura, o app grátis usa a localização do talhão.
      </p>

      <h2 className="mt-10 text-2xl font-bold">Limites</h2>
      <p className="mt-4">
        Previsões são estimativas e podem errar, principalmente em chuva de verão e em vento perto do chão. O centro do município pode ficar longe da sua lavoura.
        Confira sempre as condições no local antes de aplicar. O Grão Raiz não é receituário agronômico e não recomenda produto, dose nem momento de aplicação.
      </p>

      <Fontes fontes={FONTES_METODO} />
    </article>
  );
}
