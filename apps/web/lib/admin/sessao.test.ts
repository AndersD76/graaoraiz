import { describe, expect, it } from 'vitest';
import { emitirToken } from '@/lib/contas';
import { emitirSessao, impressaoSenha, lerSessao, VALIDADE_ADMIN_S } from './sessao';

const CONTA = '6f2c1d3e-1111-4222-8333-444455556666';
const HASH = 'scrypt$16384$8$1$c2Fs$aGFzaA==';

describe('sessão do painel administrativo', () => {
  it('lê a sessão que emitiu, presa à senha', () => {
    const s = lerSessao(emitirSessao(CONTA, HASH));
    expect(s?.sub).toBe(CONTA);
    expect(s?.s).toBe(impressaoSenha(HASH));
    expect(s?.s).not.toContain(HASH);
  });

  it('recusa sessão vencida', () => {
    const agora = Date.now();
    const valor = emitirSessao(CONTA, HASH, agora);
    expect(lerSessao(valor, agora + (VALIDADE_ADMIN_S - 5) * 1000)).not.toBeNull();
    expect(lerSessao(valor, agora + (VALIDADE_ADMIN_S + 1) * 1000)).toBeNull();
  });

  it('recusa sessão adulterada', () => {
    const [corpo, assinatura] = emitirSessao(CONTA, HASH).split('.');
    const outroCorpo = Buffer.from(JSON.stringify({ sub: 'outra-conta', exp: 9999999999, s: 'x' })).toString('base64url');
    expect(lerSessao(`${outroCorpo}.${assinatura}`)).toBeNull();
    expect(lerSessao(`${corpo}.${assinatura.slice(0, -1)}${assinatura.at(-1) === 'A' ? 'B' : 'A'}`)).toBeNull();
    expect(lerSessao(`${corpo}.`)).toBeNull();
    expect(lerSessao(`${corpo}.${assinatura}.extra`)).toBeNull();
    expect(lerSessao('')).toBeNull();
    expect(lerSessao(undefined)).toBeNull();
  });

  it('token do app não vale como sessão de administrador', () => {
    expect(lerSessao(emitirToken(CONTA))).toBeNull();
  });
});
