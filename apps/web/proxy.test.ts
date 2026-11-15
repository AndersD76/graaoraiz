import { describe, expect, it } from 'vitest';
import { origemPermitida } from './proxy';

describe('bloqueio de chamadas de outros sites à API', () => {
  it('aceita a própria origem e recusa site de fora em produção', () => {
    expect(origemPermitida('https://www.appgraoraiz.com.br', 'www.appgraoraiz.com.br', true)).toBe(true);
    expect(origemPermitida('https://site-malicioso.com', 'www.appgraoraiz.com.br', true)).toBe(false);
    expect(origemPermitida('null', 'www.appgraoraiz.com.br', true)).toBe(false);
  });

  it('libera localhost só fora de produção', () => {
    expect(origemPermitida('http://localhost:8082', 'localhost:3200', false)).toBe(true);
    expect(origemPermitida('http://localhost:8082', 'www.appgraoraiz.com.br', true)).toBe(false);
  });
});
