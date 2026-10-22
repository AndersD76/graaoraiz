import { dataDe, somarHoras } from './datas';
import { formatarNumero } from './formatos';
import { deltaT } from './psicrometria';
import { type Hora, piorStatus, type Status } from './tipos';
import { ventoA2m } from './vento';

/**
 * Limiares da janela de pulverização. Os padrões seguem recomendações técnicas usuais
 * (vento 3–10 km/h na barra, delta T 2–8 °C, sem chuva logo após a aplicação) e devem
 * ser validados por um agrônomo; o usuário Pro pode ajustá-los.
 */
export interface LimiaresPulverizacao {
  /** Vento na altura da barra (2 m), km/h. */
  vento2m: { minimo: number; idealMaximo: number; maximo: number };
  /** Rajada na altura da barra (2 m), km/h. */
  rajada2m: { atencao: number; maximo: number };
  /** Delta T, °C. */
  deltaT: { idealMinimo: number; idealMaximo: number; maximo: number };
  /** Umidade relativa, %. */
  umidade: { idealMinima: number; minima: number };
  /** Temperatura do ar, °C. */
  temperatura: { idealMaxima: number; maxima: number };
  /** Chuva depois da aplicação. */
  chuva: { horasSemChuvaApos: number; mmMaximo: number; probAtencao: number; probMaxima: number };
}

export const LIMIARES_PULVERIZACAO_PADRAO: LimiaresPulverizacao = {
  vento2m: { minimo: 3, idealMaximo: 10, maximo: 15 },
  rajada2m: { atencao: 15, maximo: 20 },
  deltaT: { idealMinimo: 2, idealMaximo: 8, maximo: 10 },
  umidade: { idealMinima: 55, minima: 45 },
  temperatura: { idealMaxima: 30, maxima: 35 },
  chuva: { horasSemChuvaApos: 2, mmMaximo: 0.5, probAtencao: 40, probMaxima: 60 },
};

export type Criterio = 'vento' | 'rajada' | 'deltaT' | 'umidade' | 'temperatura' | 'chuva' | 'dados';

export interface Motivo {
  criterio: Criterio;
  status: Exclude<Status, 'bom'>;
  texto: string;
}

export interface AvaliacaoHora {
  hora: string;
  status: Status;
  /** Só o que impede ou pede cuidado; vazio quando a hora é boa. */
  motivos: Motivo[];
  deltaT: number;
  vento2m: number;
  rajada2m: number;
}

function arredondar(n: number): number {
  return Math.round(n);
}

/** Avalia uma hora da série, olhando também as horas seguintes para a chuva pós-aplicação. */
export function avaliarHora(
  horas: Hora[],
  indice: number,
  limiares: LimiaresPulverizacao = LIMIARES_PULVERIZACAO_PADRAO,
): AvaliacaoHora {
  const h = horas[indice];
  if (!h) throw new RangeError(`Hora ${indice} fora da série`);

  const motivos: Motivo[] = [];
  const adicionar = (criterio: Criterio, status: Motivo['status'], texto: string) =>
    motivos.push({ criterio, status, texto });

  const v2 = ventoA2m(h.vento10m);
  const r2 = ventoA2m(h.rajada10m);
  const dt = deltaT(h.temperatura, h.umidade);
  const L = limiares;

  if (v2 > L.vento2m.maximo) adicionar('vento', 'ruim', `vento forte (${arredondar(v2)} km/h)`);
  else if (v2 > L.vento2m.idealMaximo) adicionar('vento', 'atencao', `vento acima do ideal (${arredondar(v2)} km/h)`);
  else if (v2 < L.vento2m.minimo) adicionar('vento', 'atencao', `vento fraco: risco de inversão térmica (${arredondar(v2)} km/h)`);

  if (r2 >= L.rajada2m.maximo) adicionar('rajada', 'ruim', `rajadas fortes (${arredondar(r2)} km/h)`);
  else if (r2 >= L.rajada2m.atencao) adicionar('rajada', 'atencao', `rajadas (${arredondar(r2)} km/h)`);

  if (dt > L.deltaT.maximo) adicionar('deltaT', 'ruim', `ar muito seco: gotas evaporam (ΔT ${formatarNumero(dt, 1)} °C)`);
  else if (dt > L.deltaT.idealMaximo) adicionar('deltaT', 'atencao', `ΔT acima do ideal (${formatarNumero(dt, 1)} °C)`);
  else if (dt < L.deltaT.idealMinimo) adicionar('deltaT', 'atencao', `ar quase saturado (ΔT ${formatarNumero(dt, 1)} °C)`);

  if (h.umidade < L.umidade.minima) adicionar('umidade', 'ruim', `umidade baixa (${arredondar(h.umidade)}%)`);
  else if (h.umidade < L.umidade.idealMinima) adicionar('umidade', 'atencao', `umidade abaixo do ideal (${arredondar(h.umidade)}%)`);

  if (h.temperatura > L.temperatura.maxima) adicionar('temperatura', 'ruim', `calor forte (${arredondar(h.temperatura)} °C)`);
  else if (h.temperatura > L.temperatura.idealMaxima) adicionar('temperatura', 'atencao', `temperatura acima do ideal (${arredondar(h.temperatura)} °C)`);

  // Chuva agora ou nas horas seguintes lava o produto.
  const n = L.chuva.horasSemChuvaApos;
  const seguintes = horas.slice(indice + 1, indice + 1 + n);
  const chuvaSeguinte = seguintes.reduce((soma, x) => soma + x.chuva, 0);
  const probs = [h, ...seguintes].map((x) => x.probChuva).filter((p): p is number => p !== null);
  const probMax = probs.length ? Math.max(...probs) : null;

  if (h.chuva > 0) adicionar('chuva', 'ruim', 'chovendo');
  else if (chuvaSeguinte >= L.chuva.mmMaximo) adicionar('chuva', 'ruim', `chuva prevista em até ${n} h`);
  else if (probMax !== null && probMax >= L.chuva.probMaxima) adicionar('chuva', 'ruim', `chance alta de chuva em até ${n} h (${probMax}%)`);
  else if (probMax !== null && probMax >= L.chuva.probAtencao) adicionar('chuva', 'atencao', `chance de chuva em até ${n} h (${probMax}%)`);

  if (seguintes.length < n) adicionar('dados', 'atencao', 'previsão insuficiente para as horas seguintes');

  const status = motivos.reduce<Status>((s, m) => piorStatus(s, m.status), 'bom');
  return { hora: h.hora, status, motivos, deltaT: dt, vento2m: v2, rajada2m: r2 };
}

export function avaliarSerie(
  horas: Hora[],
  limiares: LimiaresPulverizacao = LIMIARES_PULVERIZACAO_PADRAO,
): AvaliacaoHora[] {
  return horas.map((_, i) => avaliarHora(horas, i, limiares));
}

export interface Janela {
  /** Início da primeira hora da janela. */
  inicio: string;
  /** Fim da última hora da janela (início + duração). */
  fim: string;
  horas: number;
  /** Pior status dentro da janela. */
  status: Status;
}

export interface OpcoesJanela {
  /** Duração mínima em horas para contar como janela. */
  duracaoMinima: number;
  /** Se true, horas em "atencao" também formam janela. */
  aceitarAtencao: boolean;
}

const OPCOES_JANELA_PADRAO: OpcoesJanela = { duracaoMinima: 2, aceitarAtencao: false };

/** Agrupa horas consecutivas aptas em janelas. */
export function janelasPulverizacao(avaliacoes: AvaliacaoHora[], opcoes: Partial<OpcoesJanela> = {}): Janela[] {
  const { duracaoMinima, aceitarAtencao } = { ...OPCOES_JANELA_PADRAO, ...opcoes };
  const apta = (a: AvaliacaoHora) => a.status === 'bom' || (aceitarAtencao && a.status === 'atencao');

  const janelas: Janela[] = [];
  let atual: { inicio: string; ultima: string; horas: number; status: Status } | null = null;

  const fechar = () => {
    if (atual && atual.horas >= duracaoMinima) {
      janelas.push({ inicio: atual.inicio, fim: somarHoras(atual.ultima, 1), horas: atual.horas, status: atual.status });
    }
    atual = null;
  };

  for (const a of avaliacoes) {
    const continua = atual !== null && somarHoras(atual.ultima, 1) === a.hora;
    if (!apta(a) || (atual !== null && !continua)) fechar();
    if (!apta(a)) continue;
    if (atual === null) atual = { inicio: a.hora, ultima: a.hora, horas: 1, status: a.status };
    else {
      atual.ultima = a.hora;
      atual.horas += 1;
      atual.status = piorStatus(atual.status, a.status);
    }
  }
  fechar();
  return janelas;
}

export interface ResumoPulverizacaoDia {
  data: string;
  status: Status;
  /** Maior janela boa do dia (empate: a mais cedo). */
  melhorJanela: Janela | null;
  janelas: Janela[];
  /** Motivo mais frequente entre as horas ruins do dia, quando não há janela boa. */
  motivoPrincipal: string | null;
}

/** Semáforo de um dia: bom se há janela boa, atenção se só há janela com cuidados, ruim se não há janela. */
export function resumoPulverizacaoDia(
  avaliacoes: AvaliacaoHora[],
  data: string,
  opcoes: Partial<OpcoesJanela> = {},
): ResumoPulverizacaoDia {
  const doDia = avaliacoes.filter((a) => dataDe(a.hora) === data);
  const boas = janelasPulverizacao(doDia, { ...opcoes, aceitarAtencao: false });
  const comCuidado = janelasPulverizacao(doDia, { ...opcoes, aceitarAtencao: true });

  const melhorJanela =
    boas.reduce<Janela | null>((melhor, j) => (melhor === null || j.horas > melhor.horas ? j : melhor), null);

  let status: Status = 'ruim';
  if (boas.length > 0) status = 'bom';
  else if (comCuidado.length > 0) status = 'atencao';

  let motivoPrincipal: string | null = null;
  if (status !== 'bom') {
    const contagem = new Map<Criterio, { n: number; texto: string }>();
    for (const a of doDia) {
      for (const m of a.motivos) {
        if (m.status !== 'ruim' && status === 'ruim') continue;
        const c = contagem.get(m.criterio);
        contagem.set(m.criterio, { n: (c?.n ?? 0) + 1, texto: c?.texto ?? m.texto });
      }
    }
    let maior = 0;
    for (const { n, texto } of contagem.values()) {
      if (n > maior) {
        maior = n;
        motivoPrincipal = texto;
      }
    }
  }

  return { data, status, melhorJanela, janelas: status === 'bom' ? boas : comCuidado, motivoPrincipal };
}
