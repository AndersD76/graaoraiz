// Teste ponta a ponta do painel administrativo (/admin) num navegador, contra servidor LOCAL ou de homologação.
// Cria contas, anúncios e uma venda de teste e apaga tudo no fim (inclusive o registro de ações delas).
//
// Uso: node qa/testes/admin.mjs <url-base> <chave-do-painel> [pasta-para-capturas]
//   ex.: node qa/testes/admin.mjs http://localhost:3300 teste-local-123
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '../..');
const exigir = createRequire(join(raiz, 'package.json'));
const pg = exigir('pg');
const { chromium } = exigir('playwright');

const [base, chavePainel, pastaCapturas] = process.argv.slice(2);
if (!base || !chavePainel) {
  console.error('Uso: node qa/testes/admin.mjs <url-base> <chave-do-painel> [pasta-para-capturas]');
  process.exit(2);
}
if (/appgraoraiz\.com\.br|railway\.app/.test(base)) {
  console.error('Recusado: estes testes criam e apagam dados. Use o servidor local ou de homologação.');
  process.exit(2);
}

function urlDoBanco() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const linha = readFileSync(join(raiz, 'apps/web/.env.local'), 'utf8').split(/\r?\n/).find((l) => l.startsWith('DATABASE_URL='));
  return linha?.slice('DATABASE_URL='.length).replace(/^["']|["']$/g, '');
}
const db = new pg.Pool({ connectionString: urlDoBanco(), max: 2 });

let falhas = 0;
const ok = (cond, msg) => {
  if (!cond) falhas++;
  console.log(`${cond ? 'OK    ' : 'FALHOU'} ${msg}`);
};

async function api(caminho, { metodo = 'GET', corpo, token } = {}) {
  const r = await fetch(base + caminho, {
    method: metodo,
    headers: { ...(corpo ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined,
    redirect: 'manual',
  });
  let json = null;
  try {
    json = await r.json();
  } catch {}
  return { status: r.status, json, headers: r.headers };
}

const marca = Date.now().toString(36);
const admin = { nome: 'QA Admin', email: `qa-admin-${marca}@exemplo.com`, senha: `senha-admin-${marca}` };
const vendedor = { nome: 'QA Vendedor', email: `qa-vend-${marca}@exemplo.com`, senha: `senha-vend-${marca}` };
const jpeg = () => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(300)]).toString('base64');
const anuncio = (fotos, titulo) => ({
  categoria: 'trator', titulo, ano: 2014, horas: 7000, preco: 150000, municipio: 'Passo Fundo', uf: 'RS',
  whatsapp: '54999990000', fotos, descricao: 'Teste do painel.', aceiteComissao: true,
});
const situacaoNoBanco = async (id) => (await db.query('select situacao from app.anuncio where id = $1', [id])).rows[0]?.situacao;

const navegador = await chromium.launch();
const ids = { admin: null, vendedor: null };
try {
  // ---------- preparação: vendedor com dois anúncios ----------
  const v = await api('/api/conta/cadastro', { metodo: 'POST', corpo: vendedor });
  ids.vendedor = v.json?.conta?.id;
  const foto = (await api('/api/anuncios/fotos', { metodo: 'POST', token: v.json?.token, corpo: { base64: jpeg() } })).json?.id;
  const A = (await api('/api/anuncios', { metodo: 'POST', token: v.json?.token, corpo: anuncio([foto], `QA Painel Trator ${marca}`) })).json?.id;
  const B = (await api('/api/anuncios', { metodo: 'POST', token: v.json?.token, corpo: anuncio([foto], `QA Painel Vendido ${marca}`) })).json?.id;
  await api(`/api/anuncios/${B}/vendido`, { metodo: 'POST', token: v.json?.token, corpo: { valor: 100000 } });
  ok(ids.vendedor && A && B, 'vendedor de teste com um anúncio no ar e uma venda');
  // Hoje anunciar e vender é grátis (COMISSAO_PERCENTUAL vazia); com a variável definida, o painel ganha a parte de comissão.
  const pctVenda = Number((await db.query('select comissao_percentual from app.venda where anuncio_id = $1', [B])).rows[0]?.comissao_percentual ?? 0);
  const comComissao = pctVenda > 0;
  console.log(`(modo do servidor: ${comComissao ? `comissão de ${pctVenda}%` : 'grátis, sem comissão'})`);

  // ---------- sem sessão ----------
  const ctx = await navegador.newContext({ viewport: { width: 1366, height: 900 }, locale: 'pt-BR' });
  const p = await ctx.newPage();
  const errosJs = [];
  p.on('pageerror', (e) => errosJs.push(String(e)));
  p.on('console', (m) => m.type() === 'error' && errosJs.push(m.text()));
  p.on('dialog', (d) => d.accept());

  await p.goto(`${base}/admin/usuarios`);
  await p.waitForURL('**/admin/entrar');
  ok(true, 'sem sessão, o painel manda para /admin/entrar');
  const semSessao = await fetch(`${base}/admin/usuarios`).then((r) => r.text());
  // Procura os e-mails das contas de teste: a tela de entrar tem o exemplo "voce@exemplo.com" no campo.
  ok(!semSessao.includes(vendedor.email) && !semSessao.includes(admin.email), 'HTML do painel sem sessão não traz dados de contas');
  const planilhaSem = await fetch(`${base}/admin/vendas/planilha`, { redirect: 'manual' });
  ok([401, 307].includes(planilhaSem.status), `planilha sem sessão é recusada (${planilhaSem.status})`);
  const semCookie = await fetch(`${base}/admin`, { redirect: 'manual' });
  ok(semCookie.status === 307 && (semCookie.headers.get('location') ?? '').endsWith('/admin/entrar'), `sem cookie, o servidor redireciona direto para a entrada (${semCookie.status})`);
  const cookieFalso = await fetch(`${base}/admin/usuarios`, { headers: { cookie: 'graoraiz_admin=falso.falso' } }).then((r) => r.text());
  ok(!cookieFalso.includes(vendedor.email) && !cookieFalso.includes(admin.email), 'cookie falso não mostra dados');

  // ---------- primeiro acesso (se ainda não há administrador) ou promoção pelo banco ----------
  const haAdmin = (await db.query('select 1 from app.conta where admin limit 1')).rowCount > 0;
  if (!haAdmin) {
    ok(await p.getByText('Primeiro acesso ao painel').isVisible(), 'sem administrador, a tela oferece o primeiro acesso');
    await p.fill('#chave', 'chave-errada');
    await p.fill('#nome', admin.nome);
    await p.fill('#email', admin.email);
    await p.fill('#senha', admin.senha);
    await p.getByRole('button', { name: 'Criar acesso de administrador' }).click();
    await p.getByRole('alert').filter({ hasText: 'Chave do painel incorreta' }).waitFor();
    ok(true, 'chave errada é recusada');
    ok((await p.inputValue('#email')) === admin.email && (await p.inputValue('#nome')) === admin.nome, 'depois do erro, nome e e-mail continuam preenchidos');
    ok((await p.inputValue('#senha')) === '' && (await p.inputValue('#chave')) === '', 'depois do erro, senha e chave são apagadas');
    await p.fill('#chave', chavePainel);
    await p.fill('#senha', 'curta123');
    await p.getByRole('button', { name: 'Criar acesso de administrador' }).click();
    await p.getByRole('alert').filter({ hasText: 'pelo menos 10 caracteres' }).waitFor();
    ok(true, 'conta nova de administrador exige senha de 10 caracteres ou mais');
    await p.fill('#chave', chavePainel);
    await p.fill('#senha', admin.senha);
    await p.getByRole('button', { name: 'Criar acesso de administrador' }).click();
    await p.waitForURL(`${base}/admin`);
    await p.getByRole('heading', { name: 'Dashboard', exact: true }).waitFor();
    ids.admin = (await db.query('select id from app.conta where email = $1 and admin', [admin.email])).rows[0]?.id;
    ok(Boolean(ids.admin), 'primeiro acesso cria a conta de administrador e entra');
  } else {
    const c = await api('/api/conta/cadastro', { metodo: 'POST', corpo: admin });
    ids.admin = c.json?.conta?.id;
    await db.query('update app.conta set admin = true where id = $1', [ids.admin]);
    await p.fill('#email', admin.email);
    await p.fill('#senha', admin.senha);
    await p.getByRole('button', { name: 'Entrar' }).click();
    await p.waitForURL(`${base}/admin`);
    // O endereço muda antes da tela: confere que o Dashboard apareceu de fato (em produção chegou a não aparecer).
    await p.getByRole('heading', { name: 'Dashboard', exact: true }).waitFor();
    ok(Boolean(ids.admin), 'já havia administrador: conta de teste promovida, login por e-mail e senha abre o Dashboard');
  }

  const cookie = (await ctx.cookies()).find((c) => c.name === 'graoraiz_admin');
  ok(cookie?.httpOnly && cookie?.sameSite === 'Strict' && cookie?.path === '/admin', 'cookie da sessão: httpOnly, SameSite=Strict, só em /admin');

  // ---------- todas as telas ----------
  const telas = [
    ['/admin', 'Dashboard'],
    ['/admin/usuarios', 'Usuários'],
    [`/admin/usuarios/${ids.vendedor}`, vendedor.nome],
    ['/admin/anuncios', 'Anúncios'],
    ['/admin/vendas', comComissao ? 'Vendas e comissões' : 'Vendas'],
    ['/admin/contatos', 'Pedidos de contato'],
    ['/admin/funil', 'Funil'],
    ['/admin/avaliacoes', 'Avaliações'],
    ['/admin/configuracoes', 'Configurações'],
    [`/admin/busca?q=${encodeURIComponent(`QA Painel`)}`, 'Busca'],
  ];
  for (const [caminho, titulo] of telas) {
    const r = await p.goto(base + caminho);
    const h1 = await p.locator('h1').first().textContent();
    ok(r?.status() === 200 && h1?.includes(titulo), `${caminho.split('?')[0].replace(ids.vendedor, '<id>')} abre (${r?.status()}, “${h1}”)`);
  }
  await p.goto(`${base}/admin`);
  await p.getByText(comComissao ? 'Comissão a receber' : 'Grátis', { exact: true }).waitFor();
  ok(true, `dashboard mostra os números (${comComissao ? 'com comissão a receber' : 'comissão: Grátis'})`);
  if (pastaCapturas) await p.screenshot({ path: join(pastaCapturas, 'admin-dashboard.png'), fullPage: true });

  // ---------- ações em anúncios ----------
  await p.goto(`${base}/admin/anuncios?q=${encodeURIComponent(`QA Painel Trator ${marca}`)}`);
  const linhaA = p.locator('tr', { hasText: `QA Painel Trator ${marca}` });
  await linhaA.getByRole('button', { name: 'Pausar' }).click();
  await linhaA.getByRole('button', { name: 'Reativar' }).waitFor();
  ok((await situacaoNoBanco(A)) === 'pausado', 'Pausar: anúncio pausado no banco');
  await linhaA.getByRole('button', { name: 'Reativar' }).click();
  await linhaA.getByRole('button', { name: 'Pausar' }).waitFor();
  ok((await situacaoNoBanco(A)) === 'ativo', 'Reativar: anúncio no ar de novo');
  if (pastaCapturas) await p.screenshot({ path: join(pastaCapturas, 'admin-anuncios.png'), fullPage: true });
  await linhaA.getByRole('button', { name: 'Tirar do ar' }).click();
  await linhaA.getByText('Removido').waitFor();
  ok((await situacaoNoBanco(A)) === 'removido', 'Tirar do ar (com confirmação): anúncio removido');
  ok((await api(`/api/anuncios/${A}`)).status === 404, 'anúncio removido some da API pública');

  // ---------- comissão (ou venda grátis) ----------
  await p.goto(`${base}/admin/vendas`);
  const linhaB = p.locator('tr', { hasText: `QA Painel Vendido ${marca}` });
  if (comComissao) {
    await linhaB.getByRole('button', { name: 'Marcar paga' }).click();
    await p.locator('tr', { hasText: `QA Painel Vendido ${marca}` }).waitFor({ state: 'detached' });
    const paga = async () => (await db.query('select comissao_paga_em from app.venda where anuncio_id = $1', [B])).rows[0]?.comissao_paga_em;
    ok(Boolean(await paga()), 'Marcar paga: comissão paga no banco (e sai da lista “a receber”)');
    await p.goto(`${base}/admin/vendas?status=pago`);
    await p.locator('tr', { hasText: `QA Painel Vendido ${marca}` }).getByRole('button', { name: 'Desfazer' }).click();
    await p.locator('tr', { hasText: `QA Painel Vendido ${marca}` }).waitFor({ state: 'detached' });
    ok(!(await paga()), 'Desfazer (com confirmação): comissão volta para “a receber”');
  } else {
    await linhaB.waitFor();
    ok((await linhaB.getByRole('button', { name: 'Marcar paga' }).count()) === 0 && !(await p.content()).includes('A receber'), 'sem comissão: a venda aparece em Vendas, sem “a receber” nem “Marcar paga”');
    await p.locator('summary[aria-label^="Pendências:"]').click();
    const noSino = (await p.locator('a', { hasText: /comiss(ão|ões) a receber/ }).locator('span').first().textContent())?.trim();
    ok(noSino === '0', `sino não conta venda grátis como comissão a receber (${noSino})`);
    await p.locator('summary[aria-label^="Pendências:"]').click();
  }

  const planilha = await p.request.get(`${base}/admin/vendas/planilha`);
  const csv = await planilha.text();
  ok(planilha.status() === 200 && /text\/csv/.test(planilha.headers()['content-type'] ?? '') && csv.includes(`QA Painel Vendido ${marca}`), 'planilha CSV de vendas com sessão');

  // ---------- registro de ações ----------
  await p.goto(`${base}/admin/configuracoes`);
  const registro = await p.locator('table', { hasText: 'Quem' }).last().textContent();
  const esperadas = ['Pausou anúncio', 'Reativou anúncio', 'Tirou anúncio do ar', 'Baixou a planilha de vendas', ...(comComissao ? ['Marcou comissão paga', 'Reabriu comissão'] : [])];
  ok(esperadas.every((t) => registro?.includes(t)), 'registro de ações guarda cada ação do painel');

  // ---------- tema escuro ----------
  await p.getByRole('button', { name: 'Alternar tema claro e escuro' }).click();
  const tema1 = await p.locator('#admin').getAttribute('data-tema');
  await p.reload();
  await p.locator('h2', { hasText: 'Registro de ações' }).waitFor();
  const tema2 = await p.locator('#admin').getAttribute('data-tema');
  ok(tema1 && tema1 === tema2, `tema escolhido fica guardado (${tema2})`);
  if (pastaCapturas) await p.screenshot({ path: join(pastaCapturas, 'admin-configuracoes-escuro.png'), fullPage: true });

  // ---------- celular ----------
  const cel = await ctx.newPage();
  cel.on('pageerror', (e) => errosJs.push(String(e)));
  await cel.setViewportSize({ width: 390, height: 844 });
  await cel.goto(`${base}/admin`);
  await cel.getByRole('button', { name: 'Abrir o menu' }).click();
  await cel.getByRole('dialog', { name: 'Menu do painel' }).getByRole('link', { name: 'Usuários' }).click();
  await cel.waitForURL('**/admin/usuarios');
  ok(!(await cel.getByRole('dialog', { name: 'Menu do painel' }).isVisible()), 'celular: menu em gaveta abre, navega e fecha');
  const largura = await cel.evaluate(() => document.documentElement.scrollWidth);
  ok(largura <= 390, `celular: sem rolagem lateral na página (${largura}px)`);
  await cel.locator('h1', { hasText: 'Usuários' }).waitFor();
  if (pastaCapturas) await cel.screenshot({ path: join(pastaCapturas, 'admin-celular.png'), fullPage: true });

  // ---------- conta comum não entra ----------
  const ctx2 = await navegador.newContext();
  const p2 = await ctx2.newPage();
  await p2.goto(`${base}/admin/entrar`);
  await p2.fill('#email', vendedor.email);
  await p2.fill('#senha', vendedor.senha);
  await p2.getByRole('button', { name: 'Entrar' }).click();
  await p2.getByRole('alert').filter({ hasText: 'não tem acesso ao painel' }).waitFor();
  ok(true, 'conta comum (não administradora) não entra');
  await ctx2.close();

  // ---------- excluir conta pelo painel ----------
  await p.goto(`${base}/admin/usuarios/${ids.vendedor}`);
  await db.query('delete from app.evento where conta_id = $1', [ids.vendedor]);
  await p.getByRole('button', { name: 'Excluir conta' }).click();
  await p.waitForURL('**/admin/usuarios');
  await p.getByRole('heading', { name: 'Usuários', exact: true }).waitFor();
  ok((await p.locator('h1').allInnerTexts()).join('|') === 'Usuários', 'depois de excluir, abre só a lista de usuários (sem restos da ficha)');
  ok((await db.query('select 1 from app.conta where id = $1', [ids.vendedor])).rowCount === 0, 'Excluir conta (com confirmação): conta apagada');
  const vendaFicou = (await db.query('select 1 from app.venda where anuncio_id = $1', [B])).rowCount === 1;
  ok(
    comComissao ? vendaFicou : !vendaFicou,
    comComissao ? 'a venda com comissão continua registrada depois da exclusão (prazo legal)' : 'sem comissão, a venda sai junto com a conta (LGPD)',
  );
  ids.vendedor = null;

  // ---------- endereços antigos ----------
  const antigo = await fetch(`${base}/painel/maquinas?chave=x`, { redirect: 'manual' });
  ok([301, 308].includes(antigo.status) && (antigo.headers.get('location') ?? '').includes('/admin/vendas'), `/painel/maquinas redireciona para o painel novo (${antigo.status})`);
  ok((await fetch(`${base}/api/painel/maquinas`, { method: 'POST' })).status === 404, 'API antiga do painel (chave no formulário) não existe mais');
  const cab = await fetch(`${base}/admin/entrar`);
  ok(/noindex/.test(cab.headers.get('x-robots-tag') ?? '') && cab.headers.get('referrer-policy') === 'no-referrer', 'painel fora dos buscadores e sem referrer');

  // ---------- sair ----------
  await p.goto(`${base}/admin`);
  await p.locator('summary[aria-label^="Conta:"]').click();
  await p.getByRole('button', { name: 'Sair' }).click();
  await p.waitForURL('**/admin/entrar');
  await p.getByRole('button', { name: 'Entrar' }).waitFor();
  // Em produção, o Sair antigo deixava o título da página anterior junto com o da tela de entrar.
  ok((await p.locator('h1').allInnerTexts()).join('|') === 'Painel do Grão Raiz', 'depois de sair, só a tela de entrar aparece');
  await p.goto(`${base}/admin`);
  await p.waitForURL('**/admin/entrar');
  ok(true, 'Sair encerra a sessão');

  ok(errosJs.length === 0, `sem erro de JavaScript no painel${errosJs.length ? `: ${errosJs.slice(0, 3).join(' | ')}` : ''}`);
} catch (e) {
  falhas++;
  console.error('FALHOU (erro):', e instanceof Error ? e.message : e);
} finally {
  const contas = Object.values(ids).filter(Boolean);
  await db.query("delete from app.venda where vendedor_email like 'qa-vend-%@exemplo.com'");
  if (ids.admin) await db.query('delete from app.acao_admin where admin_id = $1', [ids.admin]);
  if (contas.length) {
    await db.query('delete from app.evento where conta_id = any($1::uuid[])', [contas]);
    await db.query('delete from app.conta where id = any($1::uuid[])', [contas]);
  }
  await db.end();
  await navegador.close();
  console.log(`\n${falhas === 0 ? 'Tudo certo' : `${falhas} falha(s)`}. Dados de teste apagados.`);
  process.exitCode = falhas === 0 ? 0 : 1;
}
