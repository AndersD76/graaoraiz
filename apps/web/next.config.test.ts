import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { telasDoApp } from './next.config';

describe('telas do app servidas pelo index.html', () => {
  const telas = telasDoApp(join(__dirname, '../mobile/src/app'));

  it('lê as rotas do expo-router sem grupo, layout ou index', () => {
    expect(telas).toContain('/chuva');
    expect(telas).toContain('/lavoura');
    expect(telas).toContain('/maquina/:id');
    expect(telas).toContain('/anunciar');
    expect(telas.some((t) => t.includes('(') || t.includes('_layout') || t.endsWith('/index'))).toBe(false);
    expect(telas).not.toContain('/');
  });

  it('não engole as páginas do site nem endereços inventados', () => {
    for (const fora of ['/maquinas-usadas', '/privacidade', '/termos', '/rota-que-nao-existe', '/api/anuncios']) {
      expect(telas).not.toContain(fora);
    }
  });
});
