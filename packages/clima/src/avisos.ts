import { riscoGeada, riscoTemporal } from './alertas';
import { dataDe, diasEntre, somarDias, somarHoras, somarMinutos } from './datas';
import { diaDaSemana, formatarData, formatarHora, formatarJanela, rotuloDia } from './formatos';
import { avaliarSerie, LIMIARES_PULVERIZACAO_PADRAO, type LimiaresPulverizacao, resumoPulverizacaoDia } from './pulverizacao';
import { janelasSecas } from './secas';
import type { Dia, Hora } from './tipos';

export type TipoAviso = 'geada' | 'temporal' | 'pulverizacao' | 'janelaSeca' | 'veranico';

export interface PreferenciasAvisos {
  geada: boolean;
  temporal: boolean;
  /** Na véspera, no horário escolhido: "amanhã dá para pulverizar das 6h às 10h". */
  pulverizacao: boolean;
  janelaSeca: boolean;
  veranico: boolean;
  /** Hora do aviso de pulverização da véspera (0–23). */
  horaPulverizacao: number;
  /** Silêncio para avisos não urgentes, de `silencioInicio` até `silencioFim` (horas). */
  silencioInicio: number;
  silencioFim: number;
}

export const PREFERENCIAS_AVISOS_PADRAO: PreferenciasAvisos = {
  geada: true,
  temporal: true,
  pulverizacao: true,
  janelaSeca: true,
  veranico: true,
  horaPulverizacao: 18,
  silencioInicio: 21,
  silencioFim: 6,
};

export interface AvisoPlanejado {
  /** Chave estável: o mesmo evento gera sempre o mesmo id (evita aviso repetido). */
  id: string;
  tipo: TipoAviso;
  talhaoId: string;
  /** Momento local do disparo: "2026-10-22T18:00". */
  quando: string;
  titulo: string;
  corpo: string;
}

export interface EntradaAvisos {
  talhao: { id: string; nome: string };
  horas: Hora[];
  dias: Dia[];
  /** Agora, em hora local: "2026-10-22T14:35". */
  agora: string;
  preferencias?: PreferenciasAvisos;
  limiares?: LimiaresPulverizacao;
  /** Dias seguidos sem chuva até hoje (anotada ou estimada); null se não houver dado. */
  diasSemChuva?: number | null;
  /** Só avisa veranico com lavoura plantada. */
  plantado?: boolean;
}

function doisDigitos(n: number): string {
  return String(n).padStart(2, '0');
}

function maisTarde(a: string, b: string): string {
  return a > b ? a : b;
}

/** Empurra avisos não urgentes para fora do horário de silêncio. */
function respeitarSilencio(quando: string, p: PreferenciasAvisos): string {
  const hora = Number(quando.slice(11, 13));
  const fim = `T${doisDigitos(p.silencioFim)}:00`;
  if (p.silencioInicio > p.silencioFim) {
    if (hora >= p.silencioInicio) return `${somarDias(dataDe(quando), 1)}${fim}`;
    if (hora < p.silencioFim) return `${dataDe(quando)}${fim}`;
  } else if (hora >= p.silencioInicio && hora < p.silencioFim) {
    return `${dataDe(quando)}${fim}`;
  }
  return quando;
}

/**
 * Decide quais avisos agendar para um talhão a partir da previsão.
 * Função pura: o app chama de novo a cada atualização e reagenda tudo pelo id.
 */
export function planejarAvisos(entrada: EntradaAvisos): AvisoPlanejado[] {
  const p = entrada.preferencias ?? PREFERENCIAS_AVISOS_PADRAO;
  const { talhao, agora } = entrada;
  const hoje = dataDe(agora);
  const logo = somarMinutos(agora, 1);
  const avisos: AvisoPlanejado[] = [];

  if (p.geada) {
    for (const dia of entrada.dias) {
      if (dia.data < hoje || dia.data > somarDias(hoje, 2)) continue;
      const risco = riscoGeada(dia);
      if (!risco) continue;
      const limite = `${dia.data}T07:00`;
      let quando = maisTarde(`${somarDias(dia.data, -1)}T16:00`, logo);
      if (risco === 'moderado') quando = respeitarSilencio(quando, p);
      if (quando >= limite) continue;
      avisos.push({
        id: `geada-${talhao.id}-${dia.data}`,
        tipo: 'geada',
        talhaoId: talhao.id,
        quando,
        titulo: risco === 'alto' ? 'Risco alto de geada' : 'Risco de geada',
        corpo: `${talhao.nome}: mínima de ${Math.round(dia.tMin)} °C prevista para a madrugada de ${diaDaSemana(dia.data, true)} (${formatarData(dia.data)}).`,
      });
    }
  }

  if (p.temporal) {
    const proximas = entrada.horas.filter((h) => h.hora >= agora.slice(0, 13) + ':00' && h.hora <= somarHoras(agora, 24));
    const primeiro = riscoTemporal(proximas)[0];
    if (primeiro) {
      avisos.push({
        id: `temporal-${talhao.id}-${dataDe(primeiro.hora)}`,
        tipo: 'temporal',
        talhaoId: talhao.id,
        quando: maisTarde(somarHoras(primeiro.hora, -3), logo),
        titulo: 'Risco de temporal',
        corpo: `${talhao.nome}: ${primeiro.motivos.join(', ')} por volta das ${formatarHora(primeiro.hora)} de ${rotuloDia(dataDe(primeiro.hora), hoje)}.`,
      });
    }
  }

  if (p.pulverizacao) {
    const amanha = somarDias(hoje, 1);
    const resumo = resumoPulverizacaoDia(avaliarSerie(entrada.horas, entrada.limiares ?? LIMIARES_PULVERIZACAO_PADRAO), amanha);
    const quando = `${hoje}T${doisDigitos(p.horaPulverizacao)}:00`;
    if (resumo.status === 'bom' && resumo.melhorJanela && quando > agora) {
      avisos.push({
        id: `pulverizacao-${talhao.id}-${amanha}`,
        tipo: 'pulverizacao',
        talhaoId: talhao.id,
        quando,
        titulo: 'Amanhã dá para pulverizar',
        corpo: `${talhao.nome}: melhor janela ${formatarJanela(resumo.melhorJanela)}.`,
      });
    }
  }

  if (p.janelaSeca) {
    const futuras = entrada.dias.filter((d) => d.data >= hoje);
    const janela = janelasSecas(futuras, { diasMinimos: 3 }).find((j) => j.inicio <= somarDias(hoje, 2));
    if (janela) {
      let quando = `${somarDias(janela.inicio, -1)}T07:00`;
      if (quando <= agora) quando = logo;
      quando = respeitarSilencio(quando, p);
      // Se o aviso cair depois do início, conta só os dias firmes que ainda restam.
      const desde = maisTarde(janela.inicio, dataDe(quando));
      const restantes = diasEntre(desde, janela.fim) + 1;
      if (restantes >= 2) {
        avisos.push({
          id: `janelaSeca-${talhao.id}-${janela.inicio}`,
          tipo: 'janelaSeca',
          talhaoId: talhao.id,
          quando,
          titulo: 'Janela de tempo firme',
          corpo: `${talhao.nome}: tempo firme de ${diaDaSemana(desde)} a ${diaDaSemana(janela.fim)} (${restantes} dias). Boa janela para colher ou entrar com máquina.`,
        });
      }
    }
  }

  const semChuva = entrada.diasSemChuva ?? null;
  if (p.veranico && entrada.plantado && semChuva !== null && semChuva >= 10) {
    const faixa = Math.floor(semChuva / 5) * 5;
    let quando = `${hoje}T08:00`;
    if (quando <= agora) quando = logo;
    avisos.push({
      id: `veranico-${talhao.id}-${faixa}`,
      tipo: 'veranico',
      talhaoId: talhao.id,
      quando: respeitarSilencio(quando, p),
      titulo: 'Veranico',
      corpo: `${talhao.nome}: ${semChuva} dias sem chuva significativa.`,
    });
  }

  return avisos.sort((a, b) => a.quando.localeCompare(b.quando));
}
