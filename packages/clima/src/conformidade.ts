import { CULTURAS, type Cultura } from './culturas';
import { formatarData, formatarNumero } from './formatos';
import { areaHa } from './geo';

/**
 * Conformidade do talhão com as duas regras que usam o PRODES (INPE) como prova:
 * - EUDR (Regulamento UE 2023/1115, adiado pelo 2025/2650): soja, café, carne e outros só entram na
 *   União Europeia se a área não teve desmatamento depois de 31/12/2020. Vale de 30/12/2026 para
 *   médias e grandes empresas e de 30/06/2027 para micro e pequenas. Quem compra pede ao produtor o
 *   contorno da área (GeoJSON) e a prova.
 * - Crédito rural (Res. CMN 5.268/2025, calendário da 5.303/2026): o banco consulta o PRODES no
 *   imóvel inteiro (CAR) e trava o crédito se houver supressão de vegetação depois de 31/07/2019.
 * O resultado é checagem prévia, não laudo: o PRODES é anual e não mapeia derrubadas muito pequenas.
 */

/** Pontos [lat, lon] em graus. */
export type Anel = [number, number][];

export interface Desmatamento {
  bioma: string;
  /** Ano do PRODES: de 1º de agosto do ano anterior a 31 de julho deste. */
  ano: number;
  /** Data da imagem em que o PRODES viu o desmatamento ("2023-08-14"). */
  dataImagem: string | null;
  /** Área desmatada dentro da área consultada (talhão ou imóvel), ha. */
  areaHa: number;
  /** Partes dentro da área consultada, para desenhar no mapa. */
  partes: Anel[];
}

export interface ImovelCar {
  /** Número do recibo do CAR ("RS-4314100-48A5…"). */
  codigo: string;
  /** AT ativo, PE pendente, SU suspenso, CA cancelado. */
  situacao: string;
  /** Andamento da análise no órgão ambiental ("Aguardando análise"). */
  condicao: string | null;
  areaHa: number;
  modulosFiscais: number | null;
  municipio: string;
  uf: string;
  /** Quanto do talhão está dentro deste imóvel, ha. */
  sobreposicaoHa: number;
  /** Limite externo do imóvel, para o mapa. */
  contorno: Anel;
  /** Desmatamento mapeado no imóvel inteiro (é o que o banco consulta). */
  desmatamento: Desmatamento[];
}

export interface ResultadoConformidade {
  consultadoEm: string;
  areaTalhaoHa: number;
  desmatamentoTalhao: Desmatamento[];
  imoveis: ImovelCar[];
  /** Fontes que não responderam: a checagem fica incompleta. */
  falhas: string[];
}

export const MARCO_EUDR = '2020-12-31';
export const MARCO_CREDITO = '2019-07-31';

export const FONTES_CONFORMIDADE =
  'Desmatamento: PRODES/INPE (TerraBrasilis). Imóveis: Cadastro Ambiental Rural (SICAR/Serviço Florestal Brasileiro).';

export type Momento = 'antes' | 'depois' | 'incerto';

/**
 * Se o desmatamento é anterior ou posterior ao marco da regra. Uma imagem de antes do marco prova
 * que foi antes; um ano do PRODES que começa depois do marco prova que foi depois; o ano que
 * atravessa o marco (ou imagem tardia num ano anterior) fica para conferir.
 */
export function momentoDoDesmatamento(d: Pick<Desmatamento, 'ano' | 'dataImagem'>, marco: string): Momento {
  if (d.dataImagem && d.dataImagem <= marco) return 'antes';
  if (`${d.ano - 1}-08-01` > marco) return 'depois';
  if (!d.dataImagem && `${d.ano}-07-31` <= marco) return 'antes';
  return 'incerto';
}

export type Veredito = 'livre' | 'atencao' | 'conferir' | 'inconclusivo';

export interface ItemAvaliado extends Desmatamento {
  momento: Momento;
}

export interface Avaliacao {
  veredito: Veredito;
  titulo: string;
  texto: string;
  /** Desmatamento depois do marco, ha. */
  areaDepoisHa: number;
  /** Desmatamento que pode ser de depois do marco, ha. */
  areaIncertaHa: number;
  itens: ItemAvaliado[];
}

function somar(itens: ItemAvaliado[], momento: Momento): number {
  return itens.filter((i) => i.momento === momento).reduce((s, i) => s + i.areaHa, 0);
}

function ha(n: number): string {
  return `${formatarNumero(n, n < 10 ? 2 : 1)} ha`;
}

function dataCompleta(data: string): string {
  return `${formatarData(data)}/${data.slice(0, 4)}`;
}

const prodesFalhou = (r: ResultadoConformidade) => r.falhas.some((f) => f.startsWith('PRODES'));

/** EUDR: o que conta é o talhão (a área de produção que vai no arquivo para a UE). */
export function avaliarEudr(r: ResultadoConformidade): Avaliacao {
  const itens = r.desmatamentoTalhao.map((d) => ({ ...d, momento: momentoDoDesmatamento(d, MARCO_EUDR) }));
  const depois = somar(itens, 'depois');
  const incerta = somar(itens, 'incerto');
  if (depois > 0) {
    return {
      veredito: 'atencao',
      titulo: `Desmatamento depois de 2020: ${ha(depois)}`,
      texto: 'O PRODES mapeou supressão de vegetação no talhão depois de 31/12/2020. Essa produção não pode ir para a União Europeia; converse com a cooperativa ou a trading antes de vender.',
      areaDepoisHa: depois,
      areaIncertaHa: incerta,
      itens,
    };
  }
  if (prodesFalhou(r)) {
    return {
      veredito: 'inconclusivo',
      titulo: 'Checagem incompleta',
      texto: 'O serviço do PRODES não respondeu para todos os biomas. Tente de novo mais tarde.',
      areaDepoisHa: 0,
      areaIncertaHa: incerta,
      itens,
    };
  }
  if (incerta > 0) {
    return {
      veredito: 'conferir',
      titulo: `Conferir: ${ha(incerta)} perto do marco`,
      texto: 'O PRODES mapeou supressão num período que atravessa 31/12/2020 (o ano do PRODES vai de agosto a julho). Peça à cooperativa ou à trading a checagem com imagem diária antes de vender para a Europa.',
      areaDepoisHa: 0,
      areaIncertaHa: incerta,
      itens,
    };
  }
  return {
    veredito: 'livre',
    titulo: 'Sem desmatamento depois de 2020',
    texto: 'O PRODES não mapeou supressão de vegetação no talhão depois de 31/12/2020. Exporte o arquivo da EUDR e envie a quem compra a sua produção.',
    areaDepoisHa: 0,
    areaIncertaHa: 0,
    itens,
  };
}

/** Quando o banco passa a consultar o PRODES, pelo tamanho do imóvel em módulos fiscais (Res. CMN 5.303/2026). */
export function inicioChecagemCredito(modulosFiscais: number | null): { data: string; texto: string } {
  if (modulosFiscais !== null && modulosFiscais > 15) return { data: '2027-01-04', texto: 'a partir de 04/01/2027 (imóvel acima de 15 módulos fiscais)' };
  if (modulosFiscais !== null && modulosFiscais > 4) return { data: '2027-07-01', texto: 'a partir de 01/07/2027 (imóvel de 4 a 15 módulos fiscais)' };
  return { data: '2028-01-01', texto: 'a partir de janeiro de 2028 (imóvel de até 4 módulos fiscais)' };
}

export const ROTULO_SITUACAO_CAR: Record<string, string> = { AT: 'Ativo', PE: 'Pendente', SU: 'Suspenso', CA: 'Cancelado' };

export function rotuloSituacaoCar(situacao: string): string {
  return ROTULO_SITUACAO_CAR[situacao] ?? situacao;
}

/** O imóvel do CAR que contém a maior parte do talhão. */
export function imovelPrincipal(r: ResultadoConformidade): ImovelCar | null {
  return [...r.imoveis].sort((a, b) => b.sobreposicaoHa - a.sobreposicaoHa)[0] ?? null;
}

/** Crédito rural: o banco olha o imóvel inteiro do CAR, não só o talhão. */
export function avaliarCredito(r: ResultadoConformidade): Avaliacao & { inicio: { data: string; texto: string } | null; imovel: ImovelCar | null } {
  const imovel = imovelPrincipal(r);
  if (!imovel) {
    const semCar = r.falhas.some((f) => f.startsWith('CAR'));
    return {
      veredito: semCar ? 'inconclusivo' : 'conferir',
      titulo: semCar ? 'Não foi possível consultar o CAR' : 'Nenhum CAR encontrado neste talhão',
      texto: semCar
        ? 'O serviço do Cadastro Ambiental Rural não respondeu. Tente de novo mais tarde.'
        : 'Sem inscrição no CAR o banco não libera crédito rural (Res. CMN 5.193/2024). Se o imóvel tem CAR, confira se o contorno do talhão está no lugar certo.',
      areaDepoisHa: 0,
      areaIncertaHa: 0,
      itens: [],
      inicio: null,
      imovel: null,
    };
  }
  const itens = imovel.desmatamento.map((d) => ({ ...d, momento: momentoDoDesmatamento(d, MARCO_CREDITO) }));
  const depois = somar(itens, 'depois');
  const incerta = somar(itens, 'incerto');
  const inicio = inicioChecagemCredito(imovel.modulosFiscais);
  const base = { areaDepoisHa: depois, areaIncertaHa: incerta, itens, inicio, imovel };
  if (imovel.situacao === 'SU' || imovel.situacao === 'CA') {
    return {
      ...base,
      veredito: 'atencao',
      titulo: `CAR ${rotuloSituacaoCar(imovel.situacao).toLowerCase()}`,
      texto: 'Com o CAR suspenso ou cancelado o banco não libera crédito rural. Procure o órgão ambiental do estado para regularizar.',
    };
  }
  if (depois > 0) {
    return {
      ...base,
      veredito: 'atencao',
      titulo: `Supressão depois de 31/07/2019: ${ha(depois)}`,
      texto: `O PRODES mapeou supressão de vegetação no imóvel depois do marco. O banco passa a checar ${inicio.texto} e pode negar o crédito ou pedir prova de que foi autorizada. Junte a autorização de supressão (ASV) ou fale com o agrônomo.`,
    };
  }
  if (prodesFalhou(r)) {
    return { ...base, veredito: 'inconclusivo', titulo: 'Checagem incompleta', texto: 'O serviço do PRODES não respondeu para todos os biomas. Tente de novo mais tarde.' };
  }
  if (incerta > 0) {
    return {
      ...base,
      veredito: 'conferir',
      titulo: `Conferir: ${ha(incerta)} perto do marco`,
      texto: `O PRODES mapeou supressão num período que atravessa 31/07/2019. O banco passa a checar ${inicio.texto}: confira com o agrônomo antes de pedir o crédito.`,
    };
  }
  if (imovel.situacao === 'PE') {
    return {
      ...base,
      veredito: 'conferir',
      titulo: 'Sem supressão depois de 2019, mas CAR pendente',
      texto: `O PRODES não mapeou supressão no imóvel depois de 31/07/2019, mas o CAR está pendente. Resolva a pendência no órgão ambiental antes de pedir crédito; o banco passa a checar ${inicio.texto}.`,
    };
  }
  return {
    ...base,
    veredito: 'livre',
    titulo: 'Sem supressão depois de 31/07/2019',
    texto: `O PRODES não mapeou supressão de vegetação no imóvel depois do marco. O banco passa a checar ${inicio.texto}.`,
  };
}

// Arquivo da EUDR -------------------------------------------------------------------------------

export interface LoteEudr {
  nome: string;
  contorno: Anel;
  areaHa?: number | null;
}

interface FeicaoEudr {
  type: 'Feature';
  properties: { ProducerName?: string; ProducerCountry: 'BR'; ProductionPlace: string; Area: number };
  geometry: { type: 'Polygon'; coordinates: [number, number][][] };
}

export interface ArquivoEudr {
  type: 'FeatureCollection';
  features: FeicaoEudr[];
}

const seis = (n: number) => Math.round(n * 1e6) / 1e6;

/** Anel [lon, lat] com 6 casas (o sistema da UE corta no 6º decimal), sem pontos repetidos, fechado e anti-horário. */
function anelEudr(contorno: Anel): [number, number][] | null {
  const pontos: [number, number][] = [];
  for (const [lat, lon] of contorno) {
    const p: [number, number] = [seis(lon), seis(lat)];
    const ultimo = pontos[pontos.length - 1];
    if (!ultimo || ultimo[0] !== p[0] || ultimo[1] !== p[1]) pontos.push(p);
  }
  const primeiro = pontos[0];
  const ultimo = pontos[pontos.length - 1];
  if (primeiro && ultimo && primeiro[0] === ultimo[0] && primeiro[1] === ultimo[1]) pontos.pop();
  if (pontos.length < 3) return null;
  let dobro = 0;
  for (let i = 0; i < pontos.length; i++) {
    const [x1, y1] = pontos[i]!;
    const [x2, y2] = pontos[(i + 1) % pontos.length]!;
    dobro += x1 * y2 - x2 * y1;
  }
  if (dobro === 0) return null; // pontos em linha reta: não é área
  if (dobro < 0) pontos.reverse(); // regra da mão direita do GeoJSON (RFC 7946)
  return [...pontos, pontos[0]!];
}

/** Segmentos que se cruzam (contorno em "oito"): o sistema da UE recusa. */
export function contornoCruzado(contorno: Anel): boolean {
  const n = contorno.length;
  if (n < 4) return false;
  const lado = (a: [number, number], b: [number, number], c: [number, number]) => Math.sign((b[1] - a[1]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[1] - a[1]));
  for (let i = 0; i < n; i++) {
    const a = contorno[i]!;
    const b = contorno[(i + 1) % n]!;
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // vizinhos pelo fechamento
      const c = contorno[j]!;
      const d = contorno[(j + 1) % n]!;
      if (lado(a, b, c) * lado(a, b, d) < 0 && lado(c, d, a) * lado(c, d, b) < 0) return true;
    }
  }
  return false;
}

/** GeoJSON no formato do sistema de informação da EUDR (tipo I: um produtor, um polígono por talhão). */
export function arquivoEudr(lotes: LoteEudr[], produtor?: string): ArquivoEudr {
  const features: FeicaoEudr[] = [];
  for (const lote of lotes) {
    const anel = anelEudr(lote.contorno);
    if (!anel) continue;
    const area = lote.areaHa ?? areaHa(lote.contorno);
    features.push({
      type: 'Feature',
      properties: {
        ...(produtor?.trim() ? { ProducerName: produtor.trim() } : {}),
        ProducerCountry: 'BR',
        ProductionPlace: lote.nome,
        Area: Math.round(area * 100) / 100,
      },
      geometry: { type: 'Polygon', coordinates: [anel] },
    });
  }
  return { type: 'FeatureCollection', features };
}

// Ficha em PDF ----------------------------------------------------------------------------------

export interface DadosFicha {
  talhao: { nome: string; cultura: Cultura | null; areaHa: number | null; contorno: Anel };
  produtor?: string;
  documento?: string;
  resultado: ResultadoConformidade;
  geradoEm: string;
}

function escapar(texto: string): string {
  return texto.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

const COR_VEREDITO: Record<Veredito, string> = { livre: '#17663A', atencao: '#B3261E', conferir: '#9A6700', inconclusivo: '#5A675D' };

/** Croqui em SVG: imóvel do CAR (tracejado), talhão (verde) e desmatamento (vermelho). */
function croqui(d: DadosFicha): string {
  const imovel = imovelPrincipal(d.resultado);
  const desmat = [...d.resultado.desmatamentoTalhao, ...(imovel?.desmatamento ?? [])].flatMap((x) => x.partes);
  const todos = [...d.talhao.contorno, ...(imovel?.contorno ?? []), ...desmat.flat()];
  if (todos.length < 3) return '';
  const lats = todos.map((p) => p[0]);
  const lons = todos.map((p) => p[1]);
  const [minLat, maxLat, minLon, maxLon] = [Math.min(...lats), Math.max(...lats), Math.min(...lons), Math.max(...lons)];
  const cos = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const largura = 520;
  const altura = 300;
  const escala = Math.min((largura - 20) / Math.max((maxLon - minLon) * cos, 1e-9), (altura - 20) / Math.max(maxLat - minLat, 1e-9));
  const x = (lon: number) => 10 + (lon - minLon) * cos * escala;
  const y = (lat: number) => 10 + (maxLat - lat) * escala;
  const caminho = (anel: Anel) => `M${anel.map(([lat, lon]) => `${x(lon).toFixed(1)},${y(lat).toFixed(1)}`).join('L')}Z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}" style="background:#F4F5EF;border-radius:6px">
${imovel ? `<path d="${caminho(imovel.contorno)}" fill="none" stroke="#C99A2E" stroke-width="2" stroke-dasharray="6 4"/>` : ''}
<path d="${caminho(d.talhao.contorno)}" fill="rgba(23,102,58,0.18)" stroke="#17663A" stroke-width="2.5"/>
${desmat.map((p) => `<path d="${caminho(p)}" fill="rgba(179,38,30,0.55)" stroke="#B3261E" stroke-width="1"/>`).join('')}
</svg><p class="legenda">Verde: talhão · Tracejado: imóvel no CAR · Vermelho: desmatamento mapeado pelo PRODES desde 2019 · Norte para cima</p>`;
}

function tabelaDesmatamento(itens: ItemAvaliado[], marco: string): string {
  if (!itens.length) return '<p>Nenhum polígono de desmatamento do PRODES desde 2019 nesta área.</p>';
  const rotulo: Record<Momento, string> = { antes: 'Antes do marco', depois: 'DEPOIS do marco', incerto: 'Conferir' };
  return `<table><thead><tr><th>Bioma</th><th>Ano PRODES</th><th>Imagem</th><th>Área</th><th>Em relação a ${dataCompleta(marco)}</th></tr></thead><tbody>${itens
    .map(
      (i) =>
        `<tr${i.momento === 'depois' ? ' class="severo"' : ''}><td>${escapar(i.bioma)}</td><td>${i.ano}</td><td>${i.dataImagem ? dataCompleta(i.dataImagem) : '—'}</td><td>${ha(i.areaHa)}</td><td>${rotulo[i.momento]}</td></tr>`,
    )
    .join('')}</tbody></table>`;
}

export function montarFichaConformidadeHtml(d: DadosFicha): string {
  const eudr = avaliarEudr(d.resultado);
  const credito = avaliarCredito(d.resultado);
  const imovel = credito.imovel;
  const linha = (rotulo: string, valor: string) => `<tr><th>${escapar(rotulo)}</th><td>${escapar(valor)}</td></tr>`;
  const area = d.talhao.areaHa ?? d.resultado.areaTalhaoHa;
  const veredito = (titulo: string, a: Avaliacao) =>
    `<div class="veredito" style="border-color:${COR_VEREDITO[a.veredito]}"><p class="rotulo">${escapar(titulo)}</p><p class="titulo" style="color:${COR_VEREDITO[a.veredito]}">${escapar(a.titulo)}</p><p>${escapar(a.texto)}</p></div>`;
  const vertices = d.talhao.contorno
    .map(([lat, lon], i) => `<tr><td>${i + 1}</td><td>${lat.toFixed(6)}</td><td>${lon.toFixed(6)}</td></tr>`)
    .join('');

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Ficha de conformidade — ${escapar(d.talhao.nome)}</title>
<style>
body{font-family:-apple-system,Roboto,Helvetica,Arial,sans-serif;color:#0F1A12;margin:28px;font-size:11px}
.capa{border-bottom:3px solid #17663A;padding-bottom:10px;margin-bottom:6px}
h1{font-size:20px;color:#17663A;margin:0}h2{font-size:13px;margin:20px 0 6px;color:#17663A;text-transform:uppercase;letter-spacing:.5px}
p{margin:3px 0}table{border-collapse:collapse;width:100%;margin-top:4px}
th,td{border:1px solid #E1E5DA;padding:4px 6px;text-align:left;vertical-align:top}thead th{background:#ECEFE6}
.ficha th{width:40%;background:#F4F5EF;font-weight:600}.severo td{background:#FCE5E3}
.veredito{border-left:5px solid;padding:6px 10px;margin:8px 0;background:#FAFBF7}.veredito .rotulo{font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#5A675D}
.veredito .titulo{font-size:14px;font-weight:700}.legenda{color:#5A675D;font-size:9px}
.vertices td{padding:2px 6px;font-family:monospace}.nota{color:#5A675D;font-size:9px;margin-top:20px;border-top:1px solid #E1E5DA;padding-top:8px}
</style></head><body>
<div class="capa"><h1>Ficha de conformidade ambiental</h1>
<p><strong>${escapar(d.talhao.nome)}</strong> · EUDR (União Europeia) e crédito rural (Res. CMN 5.268/2025)</p>
<p>Consulta aos dados públicos em ${dataCompleta(d.resultado.consultadoEm.slice(0, 10))} às ${escapar(d.resultado.consultadoEm.slice(11, 16))} · gerado pelo app Grão Raiz em ${dataCompleta(d.geradoEm.slice(0, 10))}.</p></div>
<h2>Identificação</h2><table class="ficha"><tbody>${[
    d.produtor ? linha('Produtor', d.produtor) : '',
    d.documento ? linha('CPF/CNPJ', d.documento) : '',
    linha('Talhão', d.talhao.nome),
    linha('Cultura', d.talhao.cultura ? CULTURAS[d.talhao.cultura].rotulo : 'Não informada'),
    linha('Área do talhão', ha(area)),
    linha('País de produção', 'Brasil (BR)'),
    imovel ? linha('Imóvel no CAR', imovel.codigo) : linha('Imóvel no CAR', 'Não encontrado'),
    imovel ? linha('Situação do CAR', `${rotuloSituacaoCar(imovel.situacao)}${imovel.condicao ? ` — ${imovel.condicao}` : ''}`) : '',
    imovel ? linha('Imóvel', `${imovel.municipio}/${imovel.uf} · ${ha(imovel.areaHa)}${imovel.modulosFiscais !== null ? ` · ${formatarNumero(imovel.modulosFiscais, 2)} módulos fiscais` : ''}`) : '',
  ].join('')}</tbody></table>
<h2>Resultado</h2>
${veredito('Exportação para a União Europeia (EUDR) — marco 31/12/2020, no talhão', eudr)}
${veredito('Crédito rural (Res. CMN 5.268/2025) — marco 31/07/2019, no imóvel do CAR', credito)}
${d.resultado.falhas.length ? `<p><strong>Fontes que não responderam:</strong> ${escapar(d.resultado.falhas.join(', '))}.</p>` : ''}
<h2>Croqui</h2>${croqui(d)}
<h2>Desmatamento no talhão (EUDR)</h2>${tabelaDesmatamento(eudr.itens, MARCO_EUDR)}
<h2>Desmatamento no imóvel (crédito rural)</h2>${imovel ? tabelaDesmatamento(credito.itens, MARCO_CREDITO) : '<p>Sem imóvel do CAR para consultar.</p>'}
<h2>Geolocalização do talhão (WGS 84)</h2><table class="vertices"><thead><tr><th>Vértice</th><th>Latitude</th><th>Longitude</th></tr></thead><tbody>${vertices}</tbody></table>
<p class="nota">Checagem prévia feita com dados públicos oficiais, não é certificado nem laudo. O PRODES é anual (agosto a julho), usa imagens Landsat e Sentinel e não mapeia supressões muito pequenas; a análise oficial do CAR e a diligência do comprador europeu podem usar outras bases, como MapBiomas Alerta e o mapa de florestas da UE. ${escapar(FONTES_CONFORMIDADE)}</p>
</body></html>`;
}
