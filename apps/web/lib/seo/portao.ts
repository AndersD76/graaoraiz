// Portão de qualidade: toda página passa por estas regras antes de ser publicada. O resultado de cada
// regra fica gravado em app.seo_pagina.qualidade e aparece no painel /admin/seo.

export interface ModeloPagina {
  caminho: string;
  tipo: 'pilar' | 'satelite' | 'modelo' | 'glossario' | 'norma' | 'comparativo' | 'ferramenta' | 'programatica' | 'setor' | 'hub' | 'institucional';
  consulta: string;
  /** Título completo como aparece na busca (com o sufixo da marca, se houver). */
  titulo: string;
  descricao: string;
  /** As duas primeiras frases da página (resposta direta). */
  resposta: string;
  /** Texto principal, para medir tamanho e semelhança com outras páginas. */
  corpo: string;
  /** O que esta página tem que o top 3 da busca não costuma ter (dado próprio, cálculo, modelo...). */
  valorProprio: string;
  fontes: { nome: string; url: string }[];
  linksSaida: string[];
  linksEntrada: number;
  isca: string | null;
  jsonLd: string[];
  /** Pontos de dado próprio na página (para páginas programáticas: culturas, dias de previsão...). */
  pontosDeDado?: number;
}

export interface ResultadoRegra {
  ok: boolean;
  detalhe: string;
}

export interface ResultadoPortao {
  aprovada: boolean;
  regras: Record<string, ResultadoRegra>;
  avaliadaEm: string;
}

const PARADAS = new Set(
  'a o as os de da do das dos e em no na nos nas para por com um uma que como qual quais é o que hoje se ao à'.split(' '),
);

export function palavras(texto: string): string[] {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** A resposta cita a maior parte das palavras importantes da consulta? */
export function respondeAConsulta(resposta: string, consulta: string): boolean {
  const alvo = palavras(consulta).filter((p) => !PARADAS.has(p) && p.length > 2);
  if (alvo.length === 0) return true;
  const r = new Set(palavras(resposta));
  const achadas = alvo.filter((p) => r.has(p) || [...r].some((x) => x.startsWith(p.slice(0, 5))));
  return achadas.length / alvo.length >= 0.6;
}

/** Tamanho esperado por tipo (em palavras), guiado pela intenção. Programática e ferramenta: o valor está no dado. */
const TAMANHO: Partial<Record<ModeloPagina['tipo'], [number, number]>> = {
  glossario: [150, 1200],
  pilar: [800, 5000],
  satelite: [300, 2500],
  hub: [80, 4000],
  institucional: [80, 3000],
};

/** Vetor de frequência de termos (TF) para a semelhança por cosseno. */
export function vetor(texto: string): Map<string, number> {
  const v = new Map<string, number>();
  for (const p of palavras(texto)) if (!PARADAS.has(p) && p.length > 2) v.set(p, (v.get(p) ?? 0) + 1);
  return v;
}

export function cosseno(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [, x] of a) na += x * x;
  for (const [, y] of b) nb += y * y;
  for (const [k, x] of a) dot += x * (b.get(k) ?? 0);
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/** Limite de semelhança com outra página do site: acima disso, é duplicada (vira fusão + 301). */
export const LIMIAR_SEMELHANCA = 0.8;

export function avaliarPagina(m: ModeloPagina, outras: { caminho: string; corpo: string }[] = []): ResultadoPortao {
  const regras: Record<string, ResultadoRegra> = {};
  const nPalavrasResposta = palavras(m.resposta).length;
  regras.resposta_direta = {
    ok: nPalavrasResposta >= 20 && nPalavrasResposta <= 80 && respondeAConsulta(m.resposta, m.consulta),
    detalhe: `${nPalavrasResposta} palavras; ${respondeAConsulta(m.resposta, m.consulta) ? 'responde' : 'não responde'} “${m.consulta}”`,
  };
  regras.valor_proprio = { ok: m.valorProprio.trim().length >= 20, detalhe: m.valorProprio || 'sem elemento próprio' };
  regras.fontes = { ok: m.fontes.length > 0 && m.fontes.every((f) => /^https:\/\//.test(f.url)), detalhe: `${m.fontes.length} fonte(s)` };
  regras.titulo = { ok: m.titulo.length > 0 && m.titulo.length <= 60, detalhe: `${m.titulo.length} caracteres` };
  regras.descricao = { ok: m.descricao.length >= 70 && m.descricao.length <= 155, detalhe: `${m.descricao.length} caracteres` };
  regras.canonical = { ok: m.caminho.startsWith('/') && !m.caminho.includes('?'), detalhe: m.caminho };
  regras.json_ld = { ok: m.jsonLd.length > 0, detalhe: m.jsonLd.join(', ') || 'nenhum' };
  const saida = new Set(m.linksSaida.filter((l) => l.startsWith('/') && l !== m.caminho));
  regras.links_saida = { ok: saida.size >= 3, detalhe: `${saida.size} link(s) internos` };
  regras.links_entrada = { ok: m.linksEntrada >= 3, detalhe: `${m.linksEntrada} página(s) apontam para esta` };
  regras.isca = { ok: Boolean(m.isca), detalhe: m.isca ?? 'sem isca' };

  const faixa = TAMANHO[m.tipo];
  const n = palavras(m.corpo).length;
  regras.tamanho = faixa ? { ok: n >= faixa[0] && n <= faixa[1], detalhe: `${n} palavras (faixa ${faixa[0]}–${faixa[1]})` } : { ok: true, detalhe: `${n} palavras (valor no dado)` };

  if (m.tipo === 'programatica') {
    const pontos = m.pontosDeDado ?? 0;
    regras.dado_proprio = { ok: pontos >= 5, detalhe: `${pontos} pontos de dado próprio` };
    // Programática: o texto fixo se repete por desenho; a semelhança que importa é a do dado, medida acima.
    regras.semelhanca = { ok: true, detalhe: 'medida pelo dado (página programática)' };
  } else {
    const v = vetor(m.corpo);
    let maior = 0;
    let qual = '';
    for (const o of outras) {
      if (o.caminho === m.caminho) continue;
      const s = cosseno(v, vetor(o.corpo));
      if (s > maior) {
        maior = s;
        qual = o.caminho;
      }
    }
    regras.semelhanca = { ok: maior < LIMIAR_SEMELHANCA, detalhe: maior ? `${(maior * 100).toFixed(0)}% com ${qual}` : 'sem página parecida' };
  }

  return { aprovada: Object.values(regras).every((r) => r.ok), regras, avaliadaEm: new Date().toISOString() };
}

/** Corta o título para caber em 60 caracteres sem quebrar palavra. */
export function tituloAte60(base: string, sufixo = ''): string {
  const max = 60 - sufixo.length;
  if (base.length <= max) return `${base}${sufixo}`;
  const cortado = base.slice(0, max).replace(/\s+\S*$/, '');
  return `${cortado}${sufixo}`;
}
