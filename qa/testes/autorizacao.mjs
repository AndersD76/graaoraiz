// Testes de autorização, validação e segurança da API contra um servidor LOCAL ou de homologação.
// Nunca rode contra produção: cria contas, anúncios e vendas de teste (tudo apagado no fim).
//
// Uso: node qa/testes/autorizacao.mjs <url-base> <chave-do-painel> (a chave não é mais usada; fica pelo formato do comando)
//   ex.: node qa/testes/autorizacao.mjs http://localhost:3300 teste-local-123
// O banco vem de DATABASE_URL (ou de apps/web/.env.local); o valor nunca é impresso.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const [base, chavePainel] = process.argv.slice(2);
if (!base || !chavePainel) {
  console.error('Uso: node qa/testes/autorizacao.mjs <url-base> <chave-do-painel>');
  process.exit(2);
}
if (/appgraoraiz\.com\.br|railway\.app/.test(base)) {
  console.error('Recusado: estes testes criam e apagam dados. Use o servidor local ou de homologação.');
  process.exit(2);
}

function urlDoBanco() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const raiz = join(dirname(fileURLToPath(import.meta.url)), '../..');
  const linha = readFileSync(join(raiz, 'apps/web/.env.local'), 'utf8').split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL='));
  return linha?.slice('DATABASE_URL='.length).replace(/^["']|["']$/g, '');
}
const db = new pg.Pool({ connectionString: urlDoBanco(), max: 2 });

let falhas = 0;
const ok = (cond, msg) => {
  if (!cond) falhas++;
  console.log(`${cond ? 'OK    ' : 'FALHOU'} ${msg}`);
};

async function api(caminho, { metodo = 'GET', corpo, token, headers = {}, bruto } = {}) {
  const r = await fetch(base + caminho, {
    method: metodo,
    headers: { ...(corpo !== undefined || bruto ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    body: bruto ?? (corpo !== undefined ? JSON.stringify(corpo) : undefined),
    redirect: 'manual',
  });
  const texto = await r.text();
  let json = null;
  try {
    json = JSON.parse(texto);
  } catch {}
  return { status: r.status, json, texto, headers: r.headers };
}

const marca = Date.now().toString(36);
const novaConta = (n) => ({ nome: `QA ${n}`, email: `qa-autz-${n}-${marca}@exemplo.com`, senha: `senha-qa-${marca}` });
const anuncio = (fotos, extra = {}) => ({
  categoria: 'trator', titulo: `QA Trator ${marca}`, ano: 2015, horas: 5000, preco: 100000, municipio: 'Passo Fundo', uf: 'RS',
  whatsapp: '54999990000', fotos, descricao: 'Anúncio de teste automático.', aceiteComissao: true, ...extra,
});
// O servidor só confere a assinatura de bytes do JPEG; o resto pode ser qualquer coisa (por isso o teste de nosniff abaixo).
const fotoFalsa = () => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('<script>alert(1)</script>'), Buffer.alloc(200)]).toString('base64');

const contas = {};
try {
  // ---------- Preparação: três contas (A dona, B intrusa, C demonstração) ----------
  for (const n of ['a', 'b', 'c']) {
    const dados = novaConta(n);
    const r = await api('/api/conta/cadastro', { metodo: 'POST', corpo: dados });
    contas[n] = { ...dados, token: r.json?.token, id: r.json?.conta?.id };
  }
  ok(contas.a.token && contas.b.token && contas.c.token, 'três contas de teste criadas');
  await db.query('update app.conta set demo = true where id = $1', [contas.c.id]);

  const fotoA = (await api('/api/anuncios/fotos', { metodo: 'POST', token: contas.a.token, corpo: { base64: fotoFalsa() } })).json?.id;
  const fotoB = (await api('/api/anuncios/fotos', { metodo: 'POST', token: contas.b.token, corpo: { base64: fotoFalsa() } })).json?.id;
  ok(fotoA && fotoB, 'fotos de A e B enviadas');
  const criado = await api('/api/anuncios', { metodo: 'POST', token: contas.a.token, corpo: anuncio([fotoA]) });
  const L = criado.json?.id;
  ok(criado.status === 201 || criado.status === 200, `A cria anúncio (${criado.status})`);

  // ---------- Visitante sem token ----------
  const semToken = [
    ['POST', '/api/anuncios', anuncio([fotoA])],
    ['PUT', `/api/anuncios/${L}`, anuncio([fotoA])],
    ['DELETE', `/api/anuncios/${L}`],
    ['POST', `/api/anuncios/${L}/situacao`, { situacao: 'pausado' }],
    ['POST', `/api/anuncios/${L}/vendido`, { valor: 1000 }],
    ['POST', `/api/anuncios/${L}/contato`],
    ['GET', '/api/anuncios/meus'],
    ['GET', '/api/conta/dados'],
    ['GET', '/api/conta/dados'],
    ['PUT', '/api/conta/dados', { estado: {} }],
    ['POST', '/api/anuncios/fotos', { base64: fotoFalsa() }],
    ['DELETE', '/api/conta'],
  ];
  for (const [metodo, caminho, corpo] of semToken) {
    const r = await api(caminho, { metodo, corpo });
    ok(r.status === 401, `visitante: ${metodo} ${caminho.replace(L, '<id>')} → 401 (${r.status})`);
  }

  // ---------- Token adulterado ----------
  const t = contas.a.token;
  const [corpoA, assinaturaA] = t.split('.');
  const adulterados = [
    `${corpoA}.${assinaturaA.slice(0, -1)}${assinaturaA.at(-1) === 'A' ? 'B' : 'A'}`, // assinatura alterada
    `${Buffer.from(JSON.stringify({ sub: contas.b.id, exp: 9999999999 })).toString('base64url')}.${assinaturaA}`, // corpo trocado para a conta B
    `${Buffer.from(JSON.stringify({ sub: contas.a.id, exp: 1 })).toString('base64url')}.${assinaturaA}`, // validade trocada
    `${corpoA}.`, // sem assinatura
    'x.y.z',
    'null',
  ];
  for (const [i, falso] of adulterados.entries()) {
    const r = await api('/api/conta/dados', { token: falso });
    ok(r.status === 401, `token adulterado #${i + 1} recusado (${r.status})`);
  }

  // ---------- B tenta mexer no anúncio de A (IDOR) ----------
  const b = contas.b.token;
  ok((await api(`/api/anuncios/${L}`, { metodo: 'PUT', token: b, corpo: anuncio([fotoB], { titulo: 'INVADIDO por B' }) })).status === 404, 'B não edita anúncio de A');
  ok((await api(`/api/anuncios/${L}`, { metodo: 'DELETE', token: b })).status === 404, 'B não tira do ar anúncio de A');
  ok((await api(`/api/anuncios/${L}/situacao`, { metodo: 'POST', token: b, corpo: { situacao: 'pausado' } })).status === 404, 'B não pausa anúncio de A');
  ok((await api(`/api/anuncios/${L}/vendido`, { metodo: 'POST', token: b, corpo: { valor: 1 } })).status === 404, 'B não marca vendido o anúncio de A');
  ok((await api('/api/anuncios', { metodo: 'POST', token: b, corpo: anuncio([fotoA]) })).status === 400, 'B não usa foto de A no próprio anúncio');
  const meusB = await api('/api/anuncios/meus', { token: b });
  ok(meusB.status === 200 && !meusB.json.anuncios.some((x) => x.id === L), 'anúncio de A não aparece em "meus anúncios" de B');
  const intacto = await api(`/api/anuncios/${L}`);
  ok(intacto.json?.titulo === `QA Trator ${marca}` && intacto.json?.situacao === 'ativo' && !('whatsapp' in intacto.json), 'anúncio de A intacto e sem WhatsApp no detalhe público');
  const banL = await db.query('select situacao, titulo from app.anuncio where id = $1', [L]);
  ok(banL.rows[0]?.situacao === 'ativo' && !banL.rows[0]?.titulo.includes('INVADIDO'), 'banco confirma: nada mudou');

  // ---------- Atribuição em massa (campos que o cliente não pode definir) ----------
  const massa = await api('/api/anuncios', {
    metodo: 'POST', token: contas.a.token,
    corpo: anuncio([fotoA], { titulo: `QA Massa ${marca}`, situacao: 'vendido', comissaoPercentual: 0, comissao_percentual: 0, contaId: contas.b.id, conta_id: contas.b.id, id: '00000000-0000-4000-8000-000000000000' }),
  });
  const M = massa.json?.id;
  const linhaM = (await db.query('select conta_id, situacao, comissao_percentual from app.anuncio where id = $1', [M])).rows[0];
  ok(M && M !== '00000000-0000-4000-8000-000000000000', 'id do anúncio vem do servidor');
  // A comissão gravada é sempre a do servidor (hoje 0%, grátis), nunca a que o cliente manda.
  const pctServidor = Number((await api('/api/anuncios?pagina=0')).json?.comissaoPercentual ?? -1);
  ok(
    linhaM?.conta_id === contas.a.id && linhaM?.situacao === 'ativo' && Number(linhaM?.comissao_percentual) === pctServidor,
    `dono, situação e comissão ignoram o corpo (comissão ${linhaM?.comissao_percentual}%, a do servidor: ${pctServidor}%)`,
  );

  // ---------- Anúncio pausado só aparece para o dono ----------
  await api(`/api/anuncios/${M}/situacao`, { metodo: 'POST', token: contas.a.token, corpo: { situacao: 'pausado' } });
  ok((await api(`/api/anuncios/${M}`)).status === 404, 'pausado: visitante não vê');
  ok((await api(`/api/anuncios/${M}`, { token: b })).status === 404, 'pausado: outra conta não vê');
  ok((await api(`/api/anuncios/${M}`, { token: contas.a.token })).json?.meu === true, 'pausado: o dono vê');
  // Buscadores e prévias de link recebem 404 de verdade; o navegador recebe a casca já enviada (200) com noindex.
  const pausadoBot = await api(`/maquinas-usadas/${M}`, { headers: { 'user-agent': 'Googlebot/2.1' } });
  ok(pausadoBot.status === 404 || (pausadoBot.status === 200 && /noindex/.test(pausadoBot.texto) && !pausadoBot.texto.includes(`QA Massa ${marca}`)), `pausado: buscador não vê o anúncio (${pausadoBot.status})`);
  ok(/noindex/.test((await api(`/maquinas-usadas/${M}`)).texto), 'pausado: no navegador, a página sai com noindex');

  // ---------- Conta de demonstração ----------
  const c = contas.c.token;
  ok((await api('/api/anuncios', { metodo: 'POST', token: c, corpo: anuncio([fotoA]) })).status === 403, 'demo não anuncia');
  ok((await api('/api/anuncios/fotos', { metodo: 'POST', token: c, corpo: { base64: fotoFalsa() } })).status === 403, 'demo não envia foto');
  ok((await api(`/api/anuncios/${L}/contato`, { metodo: 'POST', token: c })).status === 403, 'demo não pega WhatsApp');
  ok((await api('/api/conta/dados', { metodo: 'PUT', token: c, corpo: { estado: { x: 1 } } })).status === 403, 'demo não grava dados');

  // ---------- Contato e dados da conta ----------
  const contato = await api(`/api/anuncios/${L}/contato`, { metodo: 'POST', token: b });
  ok(contato.status === 200 && contato.json?.whatsapp, 'B (com conta) recebe o WhatsApp de A');
  const meusA = await api('/api/anuncios/meus', { token: contas.a.token });
  ok(meusA.json?.anuncios.find((x) => x.id === L)?.contatos === 1, 'A vê 1 contato recebido');
  await api('/api/conta/dados', { metodo: 'PUT', token: contas.a.token, corpo: { estado: { segredoDeA: 'talhao-secreto' } } });
  const dadosB = await api('/api/conta/dados', { token: b });
  ok(dadosB.status === 200 && !dadosB.texto.includes('talhao-secreto'), 'B não lê os dados de lavoura de A');

  // ---------- Validação de entrada ----------
  const xss = await api('/api/anuncios', { metodo: 'POST', token: contas.a.token, corpo: anuncio([fotoA], { titulo: `<script>alert(1)</script> QA ${marca}` }) });
  if (xss.json?.id) {
    const pagina = await api(`/maquinas-usadas/${xss.json.id}`);
    ok(!pagina.texto.includes('<script>alert(1)</script>'), 'título com <script> sai escapado na página pública');
  } else ok(xss.status === 400, 'título com <script> recusado');
  const grande = await api('/api/anuncios', { metodo: 'POST', token: contas.a.token, bruto: JSON.stringify(anuncio([fotoA], { descricao: 'x'.repeat(30_000) })) });
  ok(grande.status === 413, `corpo grande demais → 413 (${grande.status})`);
  ok((await api('/api/anuncios', { metodo: 'POST', token: contas.a.token, bruto: '{"titulo":' })).status === 400, 'JSON quebrado → 400');
  ok((await api('/api/anuncios', { metodo: 'POST', token: contas.a.token, corpo: anuncio([fotoA], { preco: -1 }) })).status === 400, 'preço negativo → 400');
  ok((await api('/api/anuncios', { metodo: 'POST', token: contas.a.token, corpo: anuncio([fotoA], { aceiteComissao: false }) })).status === 400, 'sem aceite dos termos → 400');
  for (const injecao of ["' or 1=1--", "1;drop table app.conta"]) {
    const lista = await api(`/api/anuncios?categoria=${encodeURIComponent(injecao)}&uf=${encodeURIComponent(injecao)}`);
    ok(lista.status < 500, `filtro com injeção SQL não quebra o servidor (${lista.status})`);
    ok((await api(`/api/anuncios/${encodeURIComponent(injecao)}`)).status === 404, 'id com injeção SQL → 404');
  }
  ok((await api('/api/conta/entrar', { metodo: 'POST', corpo: { email: "' or 1=1--", senha: 'x' } })).status === 400, 'login com injeção no e-mail → 400');
  const foto = await fetch(`${base}/api/anuncios/fotos/${fotoA}`);
  ok(/image\/(jpeg|webp)/.test(foto.headers.get('content-type') ?? '') && foto.headers.get('x-content-type-options') === 'nosniff', 'foto servida como imagem com nosniff (não executa script embutido)');

  // ---------- Venda, comissão e painel ----------
  const venda = await api(`/api/anuncios/${L}/vendido`, { metodo: 'POST', token: contas.a.token, corpo: { valor: 100000 } });
  ok(venda.status === 200 && venda.json?.comissaoValor === Math.round(100000 * venda.json?.comissaoPercentual) / 100, `comissão calculada no servidor (${venda.json?.comissaoPercentual}% = R$ ${venda.json?.comissaoValor})`);
  ok((await api(`/api/anuncios/${L}/vendido`, { metodo: 'POST', token: contas.a.token, corpo: { valor: 1 } })).status === 404, 'não dá para vender de novo (valor da comissão não muda)');
  ok((await api(`/api/anuncios/${L}`, { metodo: 'PUT', token: contas.a.token, corpo: anuncio([fotoA]) })).status === 404, 'anúncio vendido não é mais editado');
  // A comissão paga e as demais ações do administrador são testadas em qa/testes/admin.mjs (painel com login).
  ok((await api('/api/painel/maquinas', { metodo: 'POST', bruto: 'acao=comissao-paga' })).status === 404, 'API antiga do painel (chave no formulário) não existe mais');

  // ---------- Conta: senha, enumeração e exclusão ----------
  const r1 = await api('/api/conta/recuperar', { metodo: 'POST', corpo: { email: contas.b.email } });
  const r2 = await api('/api/conta/recuperar', { metodo: 'POST', corpo: { email: `qa-nao-existe-${marca}@exemplo.com` } });
  ok(r1.status === r2.status && r1.texto === r2.texto, `"esqueci a senha" responde igual com e sem conta (${r1.status}/${r2.status})`);
  let bloqueou = false;
  for (let i = 0; i < 12 && !bloqueou; i++) bloqueou = (await api('/api/conta/entrar', { metodo: 'POST', corpo: { email: contas.b.email, senha: 'errada' } })).status === 429;
  ok(bloqueou, 'senha errada repetida é bloqueada (429)');
  await api(`/api/anuncios/${M}/situacao`, { metodo: 'POST', token: contas.a.token, corpo: { situacao: 'ativo' } });
  ok((await api('/maquinas-usadas')).texto.includes(`QA Massa ${marca}`), 'anúncio reativado volta à vitrine pública');
  const tokenAntigo = contas.a.token;
  await db.query('delete from app.evento where conta_id = $1', [contas.a.id]); // não sujar o funil com eventos de teste
  ok((await api('/api/conta', { metodo: 'DELETE', token: tokenAntigo })).status === 200, 'A exclui a própria conta');
  ok((await api('/api/conta/dados', { token: tokenAntigo })).status === 401, 'token de conta excluída não vale mais');
  ok((await api(`/api/anuncios/${M}`)).status === 404, 'anúncios de conta excluída saem do ar');
  const vitrine = await api('/maquinas-usadas');
  ok(!vitrine.texto.includes(`QA Massa ${marca}`) && !vitrine.texto.includes(`QA Trator ${marca}`), 'vitrine pública esquece na hora os anúncios da conta excluída (cache limpo)');
  const vendaFicou = (await db.query('select 1 from app.venda where anuncio_id = $1', [L])).rowCount === 1;
  ok(
    pctServidor > 0 ? vendaFicou : !vendaFicou,
    pctServidor > 0 ? 'registro da venda com comissão continua após excluir a conta' : 'sem comissão, o registro da venda sai junto com a conta (LGPD)',
  );
  contas.a.excluida = true;
} catch (e) {
  falhas++;
  console.error('FALHOU (erro):', e instanceof Error ? e.message : e);
} finally {
  // Limpeza: vendas e eventos de teste, depois as contas (cascata em anúncios, fotos e contatos).
  const ids = Object.values(contas).map((x) => x.id).filter(Boolean);
  await db.query("delete from app.venda where vendedor_email like 'qa-autz-%@exemplo.com'");
  if (ids.length) {
    await db.query('delete from app.evento where conta_id = any($1::uuid[])', [ids]);
    await db.query('delete from app.conta where id = any($1::uuid[])', [ids]);
  }
  await db.end();
  console.log(`\n${falhas === 0 ? 'Tudo certo' : `${falhas} falha(s)`}. Dados de teste apagados.`);
  process.exitCode = falhas === 0 ? 0 : 1;
}
