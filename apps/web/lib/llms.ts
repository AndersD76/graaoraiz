// Conteúdo de /llms.txt (índice) e /llms-full.txt (texto completo) para buscadores de IA citarem o Grão Raiz.
import { formatarReais, resumoUso } from '@graoraiz/clima';
import { SITE_URL } from '@/lib/config';
import { custoDeAnunciar } from '@/lib/maquinas';
import type { AnuncioPublico } from '@/lib/vitrine';
import { NOME_ESTADO } from '@/lib/ufs';

/** Conteúdo de SEO publicado que entra no llms.txt (só o que está no ar). */
export interface ExtrasLlms {
  ufs: { uf: string; n: number }[];
  termos: { slug: string; termo: string; respostaDireta: string }[];
}

const RESUMO =
  'O Grão Raiz é um app para o produtor de grãos (soja, milho e trigo) que vigia cada talhão: diz a hora certa de pulverizar, avisa geada, temporal e risco de doença, guarda a prova (caderno de campo com foto, GPS e clima) para o seguro rural e o Proagro, confere a área no mapa oficial de desmatamento (PRODES/INPE) e no Cadastro Ambiental Rural para a lei europeia (EUDR) e o crédito rural, mostra o preço do dia (Cepea) e tem classificados de máquinas agrícolas usadas.';

export function llmsIndice(anuncios: AnuncioPublico[], extras: ExtrasLlms = { ufs: [], termos: [] }): string {
  const municipios = extras.ufs.reduce((s, u) => s + u.n, 0);
  const linhas = [
    '# Grão Raiz',
    '',
    `> ${RESUMO}`,
    '',
    '## Páginas principais',
    `- [App Grão Raiz](${SITE_URL}/): o app no navegador, com clima por talhão, caderno, satélite, preços e máquinas.`,
    `- [Máquinas agrícolas usadas à venda](${SITE_URL}/maquinas-usadas): classificados de tratores, colheitadeiras, plantadeiras, pulverizadores, silos, secadores e outros equipamentos de armazenagem usados, ${anuncios.length} anúncio(s) no ar.`,
    ...(municipios
      ? [`- [Hora de pulverizar por município](${SITE_URL}/hora-de-pulverizar): janelas de pulverização de hoje e da semana, hora a hora (delta T, vento na barra, umidade e chuva), para ${municipios} municípios produtores de grãos, com a área plantada do IBGE.`]
      : []),
    `- [Calculadora de delta T](${SITE_URL}/ferramentas/delta-t): delta T pela temperatura e umidade, com tabela pronta e a faixa boa para aplicar.`,
    ...(extras.termos.length ? [`- [Glossário agrícola](${SITE_URL}/glossario): ${extras.termos.length} termos de clima, aplicação, regras ambientais e máquinas, com fonte oficial.`] : []),
    `- [Metodologia](${SITE_URL}/metodologia): critérios, fórmulas (FAO-56, Stull 2011) e fontes dos cálculos.`,
    `- [Baixar o app](${SITE_URL}/baixar): como instalar o Grão Raiz.`,
    `- [Termos de uso](${SITE_URL}/termos): regras do app e dos classificados (${custoDeAnunciar()}).`,
    `- [Política de privacidade](${SITE_URL}/privacidade): dados tratados, com quem são compartilhados e direitos do titular (LGPD).`,
    '',
    ...(extras.ufs.length
      ? ['', '## Hora de pulverizar por estado', ...extras.ufs.map((u) => `- [${NOME_ESTADO[u.uf] ?? u.uf}](${SITE_URL}/hora-de-pulverizar/${u.uf.toLowerCase()}): ${u.n} municípios.`)]
      : []),
    '',
    '## Opcional',
    `- [Texto completo](${SITE_URL}/llms-full.txt): descrição detalhada do app, o glossário e a lista de máquinas anunciadas.`,
  ];
  return `${linhas.join('\n')}\n`;
}

export function llmsCompleto(anuncios: AnuncioPublico[], extras: ExtrasLlms = { ufs: [], termos: [] }): string {
  const partes = [
    '# Grão Raiz — o vigia da lavoura',
    '',
    RESUMO,
    '',
    '## O que o app faz',
    '- Hora de pulverizar: avalia vento, delta T, umidade e chuva hora a hora para cada talhão.',
    '- Avisos: geada, temporal, chuva chegando, chuva sobre a aplicação e risco de doença pelo clima (como ferrugem-asiática).',
    '- Caderno e prova: registro da aplicação com o clima da hora, ocorrências com foto e GPS, dossiê em PDF para seguro, Proagro e banco.',
    '- Regras ambientais: checagem do talhão no PRODES (INPE) e no Cadastro Ambiental Rural, com o arquivo GeoJSON pedido pela lei europeia (EUDR); é uma verificação prévia com dados públicos, não um certificado.',
    '- Preço do dia: indicadores do Cepea/Esalq e dólar do Banco Central.',
    `- Máquinas usadas: classificados entre produtores; ${custoDeAnunciar()}.`,
    '',
    '## Onde funciona',
    `No navegador do celular e do computador (${SITE_URL}). Versões para Android e iPhone em preparação.`,
    '',
    ...(extras.termos.length
      ? ['## Glossário', ...extras.termos.map((t) => `- [${t.termo}](${SITE_URL}/glossario/${t.slug}): ${t.respostaDireta}`), '']
      : []),
    '## Máquinas anunciadas agora',
    ...(anuncios.length
      ? anuncios.map((a) => {
          const uso = resumoUso(a);
          return `- [${a.titulo}](${SITE_URL}/maquinas-usadas/${a.id}): ${formatarReais(a.preco)}${uso ? `, ${uso}` : ''}, ${a.municipio}/${a.uf}.`;
        })
      : ['- Nenhuma máquina anunciada no momento.']),
  ];
  return `${partes.join('\n')}\n`;
}
