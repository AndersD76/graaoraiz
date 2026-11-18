// Conteúdo de /llms.txt (índice) e /llms-full.txt (texto completo) para buscadores de IA citarem o Grão Raiz.
import { formatarReais, resumoUso } from '@graoraiz/clima';
import { SITE_URL } from '@/lib/config';
import { custoDeAnunciar } from '@/lib/maquinas';
import type { AnuncioPublico } from '@/lib/vitrine';

const RESUMO =
  'O Grão Raiz é um app para o produtor de grãos (soja, milho e trigo) que vigia cada talhão: diz a hora certa de pulverizar, avisa geada, temporal e risco de doença, guarda a prova (caderno de campo com foto, GPS e clima) para o seguro rural e o Proagro, confere a área no mapa oficial de desmatamento (PRODES/INPE) e no Cadastro Ambiental Rural para a lei europeia (EUDR) e o crédito rural, mostra o preço do dia (Cepea) e tem classificados de máquinas agrícolas usadas.';

export function llmsIndice(anuncios: AnuncioPublico[]): string {
  const linhas = [
    '# Grão Raiz',
    '',
    `> ${RESUMO}`,
    '',
    '## Páginas principais',
    `- [App Grão Raiz](${SITE_URL}/): o app no navegador, com clima por talhão, caderno, satélite, preços e máquinas.`,
    `- [Máquinas agrícolas usadas à venda](${SITE_URL}/maquinas-usadas): classificados de tratores, colheitadeiras, plantadeiras e pulverizadores usados, ${anuncios.length} anúncio(s) no ar.`,
    `- [Baixar o app](${SITE_URL}/baixar): como instalar o Grão Raiz.`,
    `- [Termos de uso](${SITE_URL}/termos): regras do app e dos classificados (${custoDeAnunciar()}).`,
    `- [Política de privacidade](${SITE_URL}/privacidade): dados tratados, com quem são compartilhados e direitos do titular (LGPD).`,
    '',
    '## Opcional',
    `- [Texto completo](${SITE_URL}/llms-full.txt): descrição detalhada do app e a lista de máquinas anunciadas.`,
  ];
  return `${linhas.join('\n')}\n`;
}

export function llmsCompleto(anuncios: AnuncioPublico[]): string {
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
