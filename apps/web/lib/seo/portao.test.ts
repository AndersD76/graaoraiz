import { describe, expect, it } from 'vitest';
import { canalDaVisita } from './config';
import { avaliarPagina, cosseno, type ModeloPagina, respondeAConsulta, tituloAte60, vetor } from './portao';

const base: ModeloPagina = {
  caminho: '/glossario/delta-t',
  tipo: 'glossario',
  consulta: 'o que é delta t',
  titulo: 'Delta T: o que é e como usar na pulverização',
  descricao: 'Delta T é a diferença entre a temperatura do ar e a de bulbo úmido. Veja a faixa boa para aplicar e calcule grátis.',
  resposta: 'Delta T é a diferença entre a temperatura do ar e a temperatura de bulbo úmido. Ele mostra quanto a gota evapora no caminho até a folha e ajuda a escolher a hora de pulverizar.',
  corpo: 'delta t temperatura bulbo úmido evaporação gota pulverização '.repeat(30),
  valorProprio: 'Calculadora de delta T na página, com a mesma fórmula do app.',
  fontes: [{ nome: 'Embrapa', url: 'https://www.embrapa.br/' }],
  linksSaida: ['/glossario', '/ferramentas/delta-t', '/hora-de-pulverizar'],
  linksEntrada: 3,
  isca: 'calculadora-delta-t',
  jsonLd: ['DefinedTerm', 'BreadcrumbList'],
};

describe('portão de qualidade', () => {
  it('aprova a página completa', () => {
    const r = avaliarPagina(base);
    expect(Object.entries(r.regras).filter(([, v]) => !v.ok)).toEqual([]);
    expect(r.aprovada).toBe(true);
  });

  it('reprova título longo, sem isca, sem fonte e com poucos links', () => {
    const r = avaliarPagina({ ...base, titulo: 'x'.repeat(61), isca: null, fontes: [], linksSaida: ['/glossario'], linksEntrada: 1 });
    expect(r.aprovada).toBe(false);
    for (const regra of ['titulo', 'isca', 'fontes', 'links_saida', 'links_entrada']) expect(r.regras[regra].ok).toBe(false);
  });

  it('aceita resposta que responde com outras palavras (pergunta e flexão)', () => {
    expect(respondeAConsulta('Um milímetro de chuva equivale a 1 litro de água caindo sobre 1 metro quadrado.', 'quanto é 1 mm de chuva')).toBe(true);
    expect(respondeAConsulta('O CAR é o registro público eletrônico obrigatório para todos os imóveis rurais.', 'o que é CAR cadastro ambiental rural')).toBe(true);
  });

  it('reprova a resposta que não responde a consulta', () => {
    expect(respondeAConsulta('Hoje vai chover bastante na região, leve guarda-chuva e cuide da colheita.', 'o que é delta t')).toBe(false);
    expect(avaliarPagina({ ...base, resposta: 'Hoje vai chover bastante na região, leve guarda-chuva e cuide da colheita para não perder tempo.' }).regras.resposta_direta.ok).toBe(false);
  });

  it('acusa página quase igual a outra (fusão + 301)', () => {
    const r = avaliarPagina(base, [{ caminho: '/glossario/outro', corpo: base.corpo }]);
    expect(r.regras.semelhanca.ok).toBe(false);
    expect(cosseno(vetor('soja milho trigo'), vetor('trator plantadeira colheitadeira'))).toBe(0);
  });

  it('página programática precisa de dado próprio', () => {
    const prog = { ...base, tipo: 'programatica' as const, pontosDeDado: 2 };
    expect(avaliarPagina(prog).regras.dado_proprio.ok).toBe(false);
    expect(avaliarPagina({ ...prog, pontosDeDado: 12 }).regras.dado_proprio.ok).toBe(true);
  });

  it('corta título sem quebrar palavra', () => {
    const t = tituloAte60('Hora de pulverizar em São Sebastião do Paraíso (MG): janelas de hoje e da semana');
    expect(t.length).toBeLessThanOrEqual(60);
    expect(t.endsWith(' ')).toBe(false);
  });
});

describe('canal da visita', () => {
  it('separa IA, busca orgânica, social e direto', () => {
    expect(canalDaVisita('https://chatgpt.com/')).toEqual({ canal: 'ia', fonte: 'chatgpt' });
    expect(canalDaVisita('https://www.perplexity.ai/search')).toEqual({ canal: 'ia', fonte: 'perplexity' });
    expect(canalDaVisita('https://www.google.com.br/')).toEqual({ canal: 'organico', fonte: 'google' });
    expect(canalDaVisita('https://www.bing.com/')).toEqual({ canal: 'organico', fonte: 'bing' });
    expect(canalDaVisita('https://l.instagram.com/')).toMatchObject({ canal: 'social' });
    expect(canalDaVisita('https://www.embrapa.br/noticias')).toEqual({ canal: 'referencia', fonte: 'www.embrapa.br' });
    expect(canalDaVisita('https://www.linkedin.com/feed')).toMatchObject({ canal: 'social' });
    expect(canalDaVisita('')).toEqual({ canal: 'direto', fonte: '(direto)' });
    expect(canalDaVisita('https://www.google.com/', 'whatsapp', 'social')).toEqual({ canal: 'social', fonte: 'whatsapp' });
  });
});
