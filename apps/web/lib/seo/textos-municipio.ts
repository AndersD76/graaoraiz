// Textos das páginas "hora de pulverizar em <município>": os mesmos na página e no portão de qualidade.
import { formatarJanela } from '@graoraiz/clima';
import type { MunicipioAgro } from './municipios';
import { culturasOrdenadas } from './municipios';
import { tituloAte60 } from './portao';
import type { DiaPrevisto, PrevisaoPulverizacao } from './previsao';

const fmtHa = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const diaSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' });
const diaMes = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' });

export function rotuloData(data: string, hoje: string): string {
  const d = new Date(`${data}T12:00:00Z`);
  if (data === hoje) return `hoje (${diaMes.format(d)})`;
  const amanha = new Date(`${hoje}T12:00:00Z`);
  amanha.setUTCDate(amanha.getUTCDate() + 1);
  if (data === amanha.toISOString().slice(0, 10)) return `amanhã (${diaMes.format(d)})`;
  return `${diaSemana.format(d)} (${diaMes.format(d)})`;
}

export function consultaMunicipio(m: Pick<MunicipioAgro, 'nome'>): string {
  return `hora de pulverizar em ${m.nome}`.toLowerCase();
}

export function tituloMunicipio(m: Pick<MunicipioAgro, 'nome' | 'uf'>): string {
  const longo = `Hora de pulverizar em ${m.nome} (${m.uf}): janelas de hoje`;
  return longo.length <= 60 ? longo : tituloAte60(`Hora de pulverizar em ${m.nome} (${m.uf})`);
}

export function descricaoMunicipio(m: Pick<MunicipioAgro, 'nome' | 'uf'>): string {
  const longa = `Melhor horário para pulverizar em ${m.nome} (${m.uf}) hoje e na semana: delta T, vento, umidade e chuva hora a hora. Boletim grátis.`;
  if (longa.length <= 155) return longa;
  return `Melhor horário para pulverizar em ${m.nome} (${m.uf}): delta T, vento e chuva hora a hora. Boletim grátis.`.slice(0, 155);
}

/** Só a primeira letra em minúscula: "Ar quase saturado (ΔT 1,5 °C)" vira "ar quase saturado (ΔT 1,5 °C)". */
export function inicialMinuscula(t: string): string {
  return t ? t[0].toLowerCase() + t.slice(1) : t;
}

function fraseDia(d: DiaPrevisto, hoje: string): string {
  const quando = rotuloData(d.data, hoje);
  if (d.melhorJanela) return `${quando}, a melhor janela é ${formatarJanela(d.melhorJanela)}`;
  if (d.status === 'atencao') return `${quando}, só há horários com cuidado${d.motivoPrincipal ? ` (${inicialMinuscula(d.motivoPrincipal)})` : ''}`;
  return `${quando}, não há janela boa${d.motivoPrincipal ? ` (${inicialMinuscula(d.motivoPrincipal)})` : ''}`;
}

/** Resposta direta (40–60 palavras) com o dado do dia: é o que responde a busca logo abaixo do título. */
export function respostaMunicipio(m: Pick<MunicipioAgro, 'nome' | 'uf'>, p: PrevisaoPulverizacao | null): string {
  if (!p || p.dias.length === 0) {
    return `A hora de pulverizar em ${m.nome} (${m.uf}), pelas regras do Grão Raiz, pede delta T de 2 a 8 °C, vento de 3 a 10 km/h na altura da barra e nada de chuva logo depois. A previsão por hora está indisponível agora; abra o app para ver o seu talhão.`;
  }
  const [d0, d1] = p.dias;
  const proxima = p.dias.find((d) => d.melhorJanela);
  const partes = [`Em ${m.nome} (${m.uf}), ${fraseDia(d0, p.hoje)}`];
  if (d1) partes.push(fraseDia(d1, p.hoje));
  let texto = `${partes.join('; ')}.`;
  if (!d0.melhorJanela && proxima && proxima !== d1 && proxima !== d0) texto += ` A próxima janela boa é ${rotuloData(proxima.data, p.hoje)}, ${formatarJanela(proxima.melhorJanela!)}.`;
  texto += ' O cálculo usa delta T, vento na altura da barra, umidade e chuva nas horas seguintes, pela previsão mais recente.';
  return texto;
}

/** Pontos de dado próprio da página: culturas da PAM + dias e horas de previsão avaliados. */
export function pontosDeDado(m: MunicipioAgro, p: PrevisaoPulverizacao | null): number {
  return culturasOrdenadas(m).length + (p ? p.dias.length + p.horasHoje.length : 0);
}

export function resumoCulturas(m: MunicipioAgro): string {
  const c = culturasOrdenadas(m).slice(0, 3);
  if (c.length === 0) return '';
  return `${m.nome} plantou ${c.map((x) => `${fmtHa.format(x.areaHa)} ha de ${x.nome.toLowerCase()}`).join(', ')} em ${m.anoPam}, segundo a Produção Agrícola Municipal do IBGE.`;
}
