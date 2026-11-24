import { readFileSync } from 'node:fs';

import { CATEGORIAS_MAQUINA } from '@graoraiz/clima';
import { describe, expect, it } from 'vitest';

import { PLURAL_CATEGORIA } from './vitrine';

describe('categorias de máquina', () => {
  it('o check de app.anuncio no banco aceita exatamente as categorias do app', () => {
    const sql = readFileSync(new URL('../db/contas.sql', import.meta.url), 'utf8');
    const trecho = sql.match(/add constraint anuncio_categoria_check check \(categoria in \(([^)]*)\)\)/);
    expect(trecho).not.toBeNull();
    const doBanco = [...trecho![1].matchAll(/'([a-z]+)'/g)].map((m) => m[1]).sort();
    expect(doBanco).toEqual(CATEGORIAS_MAQUINA.map((c) => c.valor).sort());
  });

  it('toda categoria tem plural para as páginas do site', () => {
    for (const c of CATEGORIAS_MAQUINA) expect(PLURAL_CATEGORIA[c.valor]).toBeTruthy();
  });
});
