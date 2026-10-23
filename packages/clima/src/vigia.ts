import { riscoTemporal } from './alertas';
import { type Aplicacao, PRODUTOS, protecaoAtual, verificarLavagem } from './aplicacoes';
import { chuvaChegando, diasDeSecagem } from './colheita';
import { CULTURAS, type Cultura } from './culturas';
import { dataDe, somarDias, somarHoras } from './datas';
import { resumoDoencas } from './doencas';
import { formatarData, formatarHora, formatarJanela, formatarMm, noDia, rotuloDia } from './formatos';
import { geadasPrevistas, ROTULO_GEADA } from './geada';
import { decidirPlantio, type JanelaZarc, type Solo } from './plantio';
import { avaliarSerie, LIMIARES_PULVERIZACAO_PADRAO, type LimiaresPulverizacao, resumoPulverizacaoDia } from './pulverizacao';
import type { Dia, Hora, Status } from './tipos';

/**
 * O vigia da lavoura: junta tudo o que o app sabe de um talhão e devolve, em ordem de urgência,
 * o que o produtor precisa saber agora. Alimenta a tela Hoje e o boletim falado da manhã.
 */

export type CategoriaVigia =
  | 'temporal'
  | 'chuva'
  | 'geada'
  | 'lavagem'
  | 'protecao'
  | 'doenca'
  | 'pulverizacao'
  | 'plantio'
  | 'secagem'
  | 'veranico';

export interface ItemVigia {
  id: string;
  categoria: CategoriaVigia;
  /** 1 = agir já; 2 = planejar hoje; 3 = bom saber. */
  prioridade: 1 | 2 | 3;
  status: Status;
  titulo: string;
  texto: string;
  /** Recurso do plano Pro (no grátis aparece como prévia). */
  pro: boolean;
}

export interface TalhaoVigia {
  id: string;
  nome: string;
  cultura: Cultura | null;
  solo: Solo;
  zarc: JanelaZarc | null;
  plantado: boolean;
  baixada?: boolean;
}

export interface EntradaVigia {
  talhao: TalhaoVigia;
  horas: Hora[];
  dias: Dia[];
  /** "2026-10-22T06:10". */
  agora: string;
  limiares?: LimiaresPulverizacao;
  aplicacoes?: Aplicacao[];
  diasSemChuva?: number | null;
}

export function vigiar(e: EntradaVigia): ItemVigia[] {
  const itens: ItemVigia[] = [];
  const { talhao, horas, agora } = e;
  const hoje = dataDe(agora);
  const info = talhao.cultura ? CULTURAS[talhao.cultura] : null;
  const horaAtual = `${agora.slice(0, 13)}:00`;
  const futuras = horas.filter((h) => h.hora >= horaAtual);

  const temporal = riscoTemporal(futuras.filter((h) => h.hora <= somarHoras(agora, 24)))[0];
  if (temporal) {
    itens.push({
      id: `temporal-${temporal.hora}`,
      categoria: 'temporal',
      prioridade: 1,
      status: 'ruim',
      titulo: 'Temporal a caminho',
      texto: `${capitalizar(temporal.motivos.join(', '))} por volta das ${formatarHora(temporal.hora)} de ${rotuloDia(dataDe(temporal.hora), hoje)}. Recolha máquinas e proteja o que puder.`,
      pro: false,
    });
  }

  const chegando = chuvaChegando(horas, agora, 4);
  if (chegando && !temporal) {
    const acao = info?.secagem ? 'Amontoe e cubra o café no terreiro.' : 'Termine o serviço no campo e recolha o que molha.';
    itens.push({
      id: `chuva-${chegando.hora}`,
      categoria: 'chuva',
      prioridade: 1,
      status: 'atencao',
      titulo: `Chuva por volta das ${formatarHora(chegando.hora)}`,
      texto: `${chegando.mm >= 0.5 ? `${formatarMm(chegando.mm)} previstos na primeira hora. ` : ''}${acao}`,
      pro: false,
    });
  }

  if (!info || info.sensivelGeada) {
    const geada = geadasPrevistas(futuras, { baixada: talhao.baixada }).find((g) => g.data <= somarDias(hoje, 2));
    if (geada) {
      itens.push({
        id: `geada-${geada.data}`,
        categoria: 'geada',
        prioridade: geada.nivel === 'fraca' ? 2 : 1,
        status: geada.nivel === 'fraca' ? 'atencao' : 'ruim',
        titulo: `${ROTULO_GEADA[geada.nivel]} ${rotuloDia(geada.data, hoje) === 'hoje' ? 'nesta madrugada' : `na madrugada de ${rotuloDia(geada.data, hoje)}`}`,
        texto: `Ar a ${Math.round(geada.tMinAr)} °C por volta das ${formatarHora(geada.horaMinima)}; na folha pode chegar a ${Math.round(geada.tMinRelva)} °C. Proteja mudas e viveiros${info?.secagem ? ' e faça o chegamento de terra nas plantas novas' : ''}.`,
        pro: false,
      });
    }
  }

  const limiares = e.limiares ?? LIMIARES_PULVERIZACAO_PADRAO;
  const aplicacoes = e.aplicacoes ?? [];
  for (const a of aplicacoes.filter((x) => x.quando >= somarHoras(agora, -48) && x.quando <= agora)) {
    const lavagem = verificarLavagem(a, horas, agora);
    if (lavagem.situacao === 'lavou' || lavagem.situacao === 'risco') {
      const nome = a.produto || PRODUTOS[a.tipo].rotulo;
      itens.push({
        id: `lavagem-${a.id}-${lavagem.situacao}`,
        categoria: 'lavagem',
        prioridade: lavagem.situacao === 'lavou' ? 1 : 2,
        status: lavagem.situacao === 'lavou' ? 'ruim' : 'atencao',
        titulo: lavagem.situacao === 'lavou' ? `Chuva pode ter lavado o ${nome.toLowerCase()}` : `Risco de chuva sobre o ${nome.toLowerCase()}`,
        texto:
          lavagem.situacao === 'lavou'
            ? `${formatarMm(lavagem.mm)} nas ${a.horasSemChuva} h depois da aplicação de ${rotuloDia(dataDe(a.quando), hoje)}. Avalie reaplicar com seu agrônomo.`
            : `Chuva prevista antes das ${formatarHora(lavagem.ate)}, fim do prazo sem chuva do produto.`,
        pro: true,
      });
    }
  }

  const avaliacoes = avaliarSerie(horas, limiares).filter((a) => a.hora >= horaAtual);
  const doencas = info ? resumoDoencas(futuras, info.doencas, hoje, 7) : [];
  const protecao = protecaoAtual(aplicacoes, hoje);
  const piorDoenca = doencas.find((d) => d.nivel !== 'baixo');
  if (piorDoenca && piorDoenca.quando) {
    const protegido = protecao !== null && protecao.vence >= piorDoenca.quando;
    if (!protegido) {
      // Sugere a última janela de pulverização antes do dia de risco.
      const dias = [hoje, somarDias(hoje, 1), somarDias(hoje, 2), somarDias(hoje, 3)].filter((d) => d < piorDoenca.quando! || d === hoje);
      const janela = dias
        .map((d) => ({ d, r: resumoPulverizacaoDia(avaliacoes, d) }))
        .find((x) => x.r.status === 'bom' && x.r.melhorJanela);
      const quando = rotuloDia(piorDoenca.quando, hoje);
      const vencida = protecao && protecao.diasRestantes < 0 ? ' A proteção da última aplicação já venceu.' : protecao ? ` A proteção atual vence em ${formatarData(protecao.vence)}.` : '';
      itens.push({
        id: `doenca-${piorDoenca.doenca}-${piorDoenca.quando}`,
        categoria: protecao ? 'protecao' : 'doenca',
        prioridade: piorDoenca.nivel === 'alto' ? 1 : 2,
        status: piorDoenca.nivel === 'alto' ? 'ruim' : 'atencao',
        titulo: `${piorDoenca.nome}: risco ${piorDoenca.nivel} ${quando === 'hoje' ? 'hoje' : quando === 'amanhã' ? 'amanhã' : noDia(piorDoenca.quando)}`,
        texto: `Clima favorável à infecção.${vencida}${janela?.r.melhorJanela ? ` Melhor janela para proteger: ${rotuloDia(janela.d, hoje)} ${formatarJanela(janela.r.melhorJanela)}.` : ''}`,
        pro: true,
      });
    }
  } else if (protecao && protecao.diasRestantes >= 0 && protecao.diasRestantes <= 2) {
    itens.push({
      id: `protecao-${protecao.aplicacaoId}`,
      categoria: 'protecao',
      prioridade: 3,
      status: 'bom',
      titulo: `Proteção do fungicida vence ${protecao.diasRestantes === 0 ? 'hoje' : `em ${protecao.diasRestantes} ${protecao.diasRestantes === 1 ? 'dia' : 'dias'}`}`,
      texto: 'O clima dos próximos dias não favorece doença: dá para esperar e economizar uma aplicação.',
      pro: true,
    });
  }

  const resumoHoje = resumoPulverizacaoDia(avaliacoes, hoje);
  const resumoAmanha = resumoPulverizacaoDia(avaliacoes, somarDias(hoje, 1));
  const jHoje = resumoHoje.status === 'bom' ? resumoHoje.melhorJanela : null;
  const jAmanha = resumoAmanha.status === 'bom' ? resumoAmanha.melhorJanela : null;
  itens.push({
    id: `pulverizacao-${hoje}`,
    categoria: 'pulverizacao',
    prioridade: 3,
    status: jHoje ? 'bom' : jAmanha ? 'atencao' : 'ruim',
    titulo: jHoje ? `Pulverize hoje ${formatarJanela(jHoje)}` : jAmanha ? `Pulverização só amanhã, ${formatarJanela(jAmanha)}` : 'Sem janela de pulverização até amanhã',
    texto: jHoje
      ? 'Vento, delta T, umidade e chuva dentro do limite.'
      : resumoHoje.motivoPrincipal
        ? `Hoje: ${resumoHoje.motivoPrincipal}.`
        : 'Sem mais horas boas hoje.',
    pro: false,
  });

  if (!talhao.plantado && info?.cicloDias) {
    const decisao = decidirPlantio({ horas, dias: e.dias, hoje, solo: talhao.solo, zarc: talhao.zarc, tSoloMinima: info.tSoloMinima });
    itens.push({
      id: `plantio-${hoje}`,
      categoria: 'plantio',
      prioridade: decisao.zarc && decisao.zarc.situacao === 'aberta' && decisao.zarc.dias <= 7 ? 2 : 3,
      status: decisao.status,
      titulo: `Planto ou espero? ${decisao.titulo}`,
      texto: decisao.motivos.length ? `${capitalizar(decisao.motivos.map((m) => m.texto).join('; '))}.` : `Solo com umidade boa e ${formatarMm(decisao.chuva7dias)} previstos em 7 dias.`,
      pro: true,
    });
  }

  if (info?.secagem) {
    const secos = diasDeSecagem(futuras).filter((d) => d.data >= hoje);
    let seguidos = 0;
    for (const d of secos) {
      if (!d.seco) break;
      seguidos += 1;
    }
    itens.push({
      id: `secagem-${hoje}`,
      categoria: 'secagem',
      prioridade: 3,
      status: seguidos >= 3 ? 'bom' : seguidos >= 1 ? 'atencao' : 'ruim',
      titulo: seguidos >= 1 ? `Terreiro: ${seguidos} ${seguidos === 1 ? 'dia seco' : 'dias secos'} pela frente` : 'Terreiro: dia úmido ou com chuva',
      texto: seguidos >= 3 ? 'Boa sequência para secar e esparramar.' : 'Mantenha lonas à mão e esparrame só com tempo firme.',
      pro: true,
    });
  }

  const semChuva = e.diasSemChuva ?? null;
  if (talhao.plantado && semChuva !== null && semChuva >= 10) {
    itens.push({
      id: `veranico-${somarDias(hoje, -semChuva)}`,
      categoria: 'veranico',
      prioridade: 2,
      status: semChuva >= 15 ? 'ruim' : 'atencao',
      titulo: `Veranico: ${semChuva} dias sem chuva`,
      texto: 'Registre no dossiê e, se houver perda, comunique o banco ou a seguradora o quanto antes.',
      pro: true,
    });
  }

  return itens.sort((a, b) => a.prioridade - b.prioridade);
}

function capitalizar(s: string): string {
  return s ? s[0]!.toUpperCase() + s.slice(1) : s;
}

export function saudacao(agora: string): string {
  const hh = Number(agora.slice(11, 13));
  if (hh < 12) return 'Bom dia';
  if (hh < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Texto do boletim para ler em voz alta (o celular fala com a voz do sistema). */
export function boletimFalado(itens: ItemVigia[], talhao: string, agora: string, nome?: string): string {
  const abertura = `${saudacao(agora)}${nome ? `, ${nome}` : ''}. Resumo do ${talhao}.`;
  const principais = itens.slice(0, 4).map((i) => `${i.titulo}. ${i.texto}`);
  const fecho = itens.some((i) => i.prioridade === 1) ? 'Fique atento aos avisos.' : 'Bom trabalho.';
  return [abertura, ...principais, fecho]
    .join(' ')
    .replace(/(\d+)h(\d\d)/g, '$1 e $2')
    .replace(/(\d+)h\b/g, '$1 horas')
    .replace(/ mm\b/g, ' milímetros')
    .replace(/km\/h/g, 'quilômetros por hora')
    .replace(/°C/g, 'graus');
}
