import { afterEach, describe, expect, it } from 'vitest';
import { lerAtribuicao } from '@/lib/atribuicao';
import { emitirToken, lerToken } from '@/lib/contas';
import { criarLimite } from '@/lib/limite';
import { esquemaAnuncio } from '@/lib/maquinas';
import { chavePainelConfere } from '@/lib/painel';
import { cortar, crawlerDeIa, jsonLd } from '@/lib/seo';

const anuncioValido = {
  categoria: 'trator',
  titulo: 'Trator John Deere 6110J',
  preco: 285000,
  municipio: 'Passo Fundo',
  uf: 'RS',
  whatsapp: '(54) 99999-0000',
  fotos: ['8b6f3f5e-2d0a-4f6e-9a3c-1d2e3f4a5b6c'],
};

describe('limite de uso', () => {
  it('libera até o máximo e bloqueia depois, por chave', () => {
    const permitido = criarLimite({ max: 2, janelaMs: 1000 });
    expect([permitido('a', 0), permitido('a', 10), permitido('a', 20)]).toEqual([true, true, false]);
    expect(permitido('b', 20)).toBe(true);
  });

  it('volta a liberar quando a janela passa', () => {
    const permitido = criarLimite({ max: 1, janelaMs: 1000 });
    expect(permitido('a', 0)).toBe(true);
    expect(permitido('a', 500)).toBe(false);
    expect(permitido('a', 1500)).toBe(true);
  });
});

describe('SEO', () => {
  it('JSON-LD não deixa texto do usuário fechar a tag script', () => {
    const saida = jsonLd({ name: '</script><script>alert(1)</script>' });
    expect(saida).not.toContain('</script>');
    expect(JSON.parse(saida).name).toBe('</script><script>alert(1)</script>');
  });

  it('corta sem partir palavra e respeita o limite', () => {
    const t = cortar('Trator John Deere 6110J em Passo Fundo/RS com pneus novos', 30);
    expect(t.length).toBeLessThanOrEqual(30);
    expect(t.endsWith('…')).toBe(true);
    expect(cortar('curto', 30)).toBe('curto');
  });

  it('reconhece crawlers de IA e ignora navegador comum', () => {
    expect(crawlerDeIa('Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)')).toBe('OAI-SearchBot');
    expect(crawlerDeIa('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0)')).toBe('ClaudeBot');
    expect(crawlerDeIa('Mozilla/5.0 (Windows NT 10.0) Chrome/120 Safari/537.36')).toBeNull();
    expect(crawlerDeIa(null)).toBeNull();
  });
});

describe('validação de entrada', () => {
  it('aceita um anúncio completo e limpa o WhatsApp', () => {
    const r = esquemaAnuncio.safeParse(anuncioValido);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.whatsapp).toBe('54999990000');
  });

  it('recusa anúncio sem foto, com UF inventada ou foto que não é id', () => {
    expect(esquemaAnuncio.safeParse({ ...anuncioValido, fotos: [] }).success).toBe(false);
    expect(esquemaAnuncio.safeParse({ ...anuncioValido, uf: 'XX' }).success).toBe(false);
    expect(esquemaAnuncio.safeParse({ ...anuncioValido, fotos: ["1' or '1'='1"] }).success).toBe(false);
  });

  it('ignora campos que o vendedor não pode definir (situação, comissão, conta)', () => {
    const r = esquemaAnuncio.safeParse({ ...anuncioValido, situacao: 'vendido', comissao_percentual: 0, conta_id: 'outra' });
    expect(r.success).toBe(true);
    if (r.success) expect(Object.keys(r.data)).not.toEqual(expect.arrayContaining(['situacao', 'comissao_percentual', 'conta_id']));
  });

  it('atribuição malformada não impede nada e campos estranhos são descartados', () => {
    expect(lerAtribuicao('lixo')).toBeNull();
    expect(lerAtribuicao({})).toBeNull();
    const a = lerAtribuicao({ primeiro: { utm_source: 'whatsapp', senha: 'x' } });
    expect(a?.primeiro).toEqual({ utm_source: 'whatsapp' });
  });
});

describe('sessão e painel', () => {
  const chaveOriginal = process.env.PAINEL_CHAVE;
  afterEach(() => {
    process.env.PAINEL_CHAVE = chaveOriginal;
  });

  it('token adulterado é recusado', () => {
    const token = emitirToken('conta-1');
    expect(lerToken(token)).toBe('conta-1');
    const [corpo, assinatura] = token.split('.');
    const outroCorpo = Buffer.from(JSON.stringify({ sub: 'conta-2', exp: 9999999999 })).toString('base64url');
    expect(lerToken(`${outroCorpo}.${assinatura}`)).toBeNull();
    expect(lerToken(`${corpo}.x${assinatura.slice(1)}`)).toBeNull();
    expect(lerToken('lixo')).toBeNull();
  });

  it('painel só abre com a chave exata', () => {
    process.env.PAINEL_CHAVE = 'chave-de-teste-123';
    expect(chavePainelConfere('chave-de-teste-123')).toBe(true);
    expect(chavePainelConfere('chave-de-teste-12')).toBe(false);
    expect(chavePainelConfere(undefined)).toBe(false);
    expect(chavePainelConfere(['chave-de-teste-123'])).toBe(false);
  });
});
