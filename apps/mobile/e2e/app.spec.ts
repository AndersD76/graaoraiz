import { expect, type Page, test } from '@playwright/test';

import { DATAS, usarClimaFalso } from './clima-falso';

const CAPTURAS = 'e2e/capturas';

async function capturar(page: Page, nome: string) {
  await page.screenshot({ path: `${CAPTURAS}/${nome}.png`, fullPage: true });
}

async function irParaAba(page: Page, nome: 'Hoje' | 'Lavoura' | 'Caderno' | 'Chuva' | 'Ajustes') {
  await page.getByRole('tab', { name: nome, exact: true }).or(page.getByRole('link', { name: nome, exact: true })).first().click();
}

/** Faz a apresentação inicial e cria o primeiro talhão pela "localização do celular". */
async function cadastrarPrimeiroTalhao(page: Page) {
  await page.goto('/');
  await expect(page.getByText('O vigia da sua lavoura, no bolso.')).toBeVisible();
  await capturar(page, '01-apresentacao');
  await page.getByTestId('comecar').click();

  await expect(page.getByText('Seu primeiro talhão')).toBeVisible();
  await page.getByTestId('campo-nome').fill('Talhão da Sede');
  await page.getByTestId('usar-localizacao').click();
  await expect(page.getByText('Marcado em -25.4321, -49.2715')).toBeVisible();
  await page.getByTestId('cultura-soja').click();
  await capturar(page, '02-primeiro-talhao');
  await page.getByTestId('continuar-talhao').click();

  await expect(page.getByText('Avisos no celular')).toBeVisible();
  await page.getByTestId('pular-avisos').click();
  await expect(page.getByTestId('capa-tempo')).toBeVisible();
}

async function simularPro(page: Page) {
  await irParaAba(page, 'Ajustes');
  await page.getByTestId('simular-pro').click();
  await irParaAba(page, 'Hoje');
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (d) => void d.accept());
  await usarClimaFalso(page);
});

test('apresentação, primeiro talhão e tela Hoje com o vigia', async ({ page }) => {
  await cadastrarPrimeiroTalhao(page);

  await expect(page.getByText('Talhão da Sede').first()).toBeVisible();
  await expect(page.getByText('O vigia diz')).toBeVisible();
  await expect(page.getByTestId('vigia-pulverizacao').getByText(/das 6h às 10h/)).toBeVisible();
  await expect(page.getByTestId('vigia-geada').getByText(/madrugada/)).toBeVisible();
  // No grátis, a doença aparece como prévia: título visível, detalhes no Pro.
  const doenca = page.getByTestId('vigia-doenca');
  await expect(doenca.getByText(/Ferrugem-asiática: risco alto/)).toBeVisible();
  await expect(doenca.getByText('Detalhes e aviso no celular com o Pro')).toBeVisible();
  await expect(page.getByTestId('faixa-horas')).toBeVisible();
  await expect(page.getByText('Próximos 7 dias')).toBeVisible();
  await expect(page.getByText(/Mais 9 dias de previsão no Pro/)).toBeVisible();
  await expect(page.getByText('Dados meteorológicos: Open-Meteo.com (CC BY 4.0)')).toBeVisible();
  await capturar(page, '03-hoje');

  await page.getByTestId('vigia-pulverizacao').click();
  await expect(page.getByText(/Critérios: vento na barra/)).toBeVisible();
  await expect(page.getByText('Veja amanhã hora a hora')).toBeVisible();
  await capturar(page, '04-hora-a-hora-gratis');
});

test('boletim do dia para ouvir e mandar no WhatsApp', async ({ page }) => {
  await cadastrarPrimeiroTalhao(page);
  await page.getByTestId('abrir-boletim').click();
  await expect(page.getByText('O vigia olhou o Talhão da Sede para você.')).toBeVisible();
  await expect(page.getByTestId('ouvir-boletim')).toBeVisible();
  await expect(page.getByTestId('compartilhar-boletim')).toBeVisible();
  await expect(page.getByText(/alertas? do vigia no Pro/)).toBeVisible();
  await capturar(page, '05-boletim');
});

test('pluviômetro: anotar chuva, acumulado e cartão', async ({ page }) => {
  await cadastrarPrimeiroTalhao(page);
  await irParaAba(page, 'Chuva');

  await expect(page.getByText('Quanto choveu no pluviômetro?')).toBeVisible();
  await page.getByTestId('campo-mm').fill('12');
  await page.getByTestId('salvar-chuva').click();
  await expect(page.getByText(/Anotado: 12 mm\./)).toBeVisible();
  const resumo = page.getByTestId('resumo-safra');
  await expect(resumo.getByText(/1 dia anotado por você/)).toBeVisible();
  await expect(resumo.getByText(/Média histórica no mesmo período/)).toBeVisible();
  await capturar(page, '06-chuva');

  await page.getByTestId('abrir-cartao').click();
  await expect(page.getByTestId('cartao-chuva').getByText('12 mm')).toBeVisible();
  await capturar(page, '07-cartao-chuva');
});

test('caderno: apliquei agora e ocorrência com prova', async ({ page }) => {
  await cadastrarPrimeiroTalhao(page);
  await page.getByTestId('acao-aplicacao').click();
  await expect(page.getByText('O que foi aplicado')).toBeVisible();
  await page.getByTestId('tipo-fungicida').click();
  await page.getByTestId('campo-produto').fill('Fungicida X');
  await expect(page.getByTestId('condicoes-aplicacao').getByText('Temperatura')).toBeVisible();
  await capturar(page, '08-apliquei-agora');
  await page.getByTestId('salvar-aplicacao').click();

  await irParaAba(page, 'Caderno');
  const aplicacao = page.getByTestId('registro-aplicacao');
  await expect(aplicacao.getByText('Fungicida X')).toBeVisible();
  await expect(page.getByText(/Proteção do fungicida: 14 dias/)).toBeVisible();

  await page.getByTestId('caderno-ocorrencia').click();
  await page.getByTestId('ocorrencia-granizo').click();
  await page.getByTestId('campo-nota').fill('pedras pequenas na baixada');
  await page.getByTestId('salvar-ocorrencia').click();
  const ocorrencia = page.getByTestId('registro-ocorrencia');
  await expect(ocorrencia.getByText('Granizo')).toBeVisible();
  await expect(ocorrencia.getByText('pedras pequenas na baixada')).toBeVisible();
  await capturar(page, '09-caderno');
});

test('Pro simulado: paywall, talhões extras, 48 h, satélite e dossiê', async ({ page }) => {
  await cadastrarPrimeiroTalhao(page);

  await irParaAba(page, 'Lavoura');
  await expect(page.getByTestId('talhao-Talhão da Sede')).toBeVisible();
  await page.getByTestId('adicionar-talhao').click();
  await expect(page.getByText('Grão Raiz Pro').first()).toBeVisible();
  const calculadora = page.getByTestId('calculadora');
  await expect(calculadora.getByText('R$ 7.500')).toBeVisible(); // 50 ha × R$ 150/ha
  await expect(page.getByText(/14 dias grátis, depois R\$ 249,90 por ano/)).toBeVisible();
  await capturar(page, '10-assinatura');
  await page.getByTestId('simular-pro-paywall').click();
  await expect(page.getByText('Pro ativo')).toBeVisible();
  await page.goBack();

  await page.getByTestId('adicionar-talhao').click();
  await page.getByTestId('campo-nome').fill('Talhão do Rio');
  await page.getByTestId('campo-latitude').fill('-25.50');
  await page.getByTestId('campo-longitude').fill('-49.30');
  await page.getByTestId('salvar-talhao').click();
  await expect(page.getByTestId('talhao-Talhão do Rio')).toBeVisible();
  await capturar(page, '11-lavoura');

  await irParaAba(page, 'Hoje');
  await expect(page.getByRole('button', { name: 'Talhão do Rio' })).toBeVisible();
  await expect(page.getByText(/Próximos 16 dias/)).toBeVisible();
  await expect(page.getByTestId('vigia-doenca').getByText(/Melhor janela para proteger/)).toBeVisible();
  await page.getByTestId('vigia-pulverizacao').click();
  await expect(page.getByText('Veja amanhã hora a hora')).toBeHidden();
  const seisDeAmanha = page.getByTestId(`hora-${DATAS.amanha}T06:00`);
  await expect(seisDeAmanha).toBeVisible();
  await expect(seisDeAmanha.getByText(/km\/h/).first()).toBeVisible();
  await capturar(page, '12-hora-a-hora-pro');
  await page.goBack();

  await page.getByTestId('acao-satelite').click();
  await expect(page.getByText('Vigor médio')).toBeVisible();
  await expect(page.getByTestId('vigor-medio')).toHaveText('0,71');
  await expect(page.getByText(/% do talhão com vigor abaixo do resto/)).toBeVisible();
  await page.getByTestId('modo-vigor').click();
  await capturar(page, '13-satelite');
  await page.goBack();

  await irParaAba(page, 'Caderno');
  await page.getByTestId('abrir-dossie').click();
  await expect(page.getByTestId('resumo-dossie').getByText('Chuva acumulada')).toBeVisible();
  await expect(page.getByTestId('gerar-pdf')).toBeVisible();
  await capturar(page, '14-dossie');
});

test('banco local: dados continuam depois de recarregar', async ({ page }) => {
  await cadastrarPrimeiroTalhao(page);
  await irParaAba(page, 'Chuva');
  await page.getByTestId('campo-mm').fill('7,5');
  await page.getByTestId('salvar-chuva').click();
  await expect(page.getByText(/Anotado: 7,5 mm\./)).toBeVisible();

  // Recarregar zera a memória da página: o que aparecer vem do banco.
  await page.reload();
  await expect(page.getByText('Talhão da Sede').first()).toBeVisible();
  await expect(page.getByText('O vigia da sua lavoura, no bolso.')).toBeHidden();
  await irParaAba(page, 'Chuva');
  await expect(page.getByText(/Anotado: 7,5 mm\./)).toBeVisible();
});

test('talhão: editar plantio, ZARC e área, depois excluir', async ({ page }) => {
  await cadastrarPrimeiroTalhao(page);

  await irParaAba(page, 'Lavoura');
  await page.getByTestId('editar-Talhão da Sede').click();
  await page.getByTestId('campo-nome').fill('Talhão Norte');
  await page.getByRole('button', { name: 'Já plantei' }).click();
  await page.getByTestId('campo-area').fill('42');
  await page.getByTestId('salvar-talhao').click();
  const cartao = page.getByTestId('talhao-Talhão Norte');
  await expect(cartao).toBeVisible();
  await expect(cartao.getByText(/Soja · 42 ha/)).toBeVisible();
  await expect(cartao.getByText(/0 dias desde o plantio/)).toBeVisible();

  await page.getByTestId('editar-Talhão Norte').click();
  await page.getByTestId('excluir-talhao').click(); // confirmação aceita pelo handler de diálogo
  // Sem talhões, o app volta para a apresentação.
  await expect(page.getByText('O vigia da sua lavoura, no bolso.')).toBeVisible();
});

test('sem internet: continua mostrando a previsão salva', async ({ page, context }) => {
  await cadastrarPrimeiroTalhao(page);
  await expect(page.getByTestId('vigia-pulverizacao')).toBeVisible();

  // Corta a rede para o Open-Meteo e recarrega: a previsão salva no banco continua aparecendo.
  await page.unroute(/open-meteo\.com/);
  await context.route(/open-meteo\.com/, (rota) => rota.abort());
  await page.reload();
  await expect(page.getByTestId('capa-tempo')).toBeVisible();
  await expect(page.getByTestId('vigia-pulverizacao')).toBeVisible();
});

test('ajustes: tema escuro, seguro, Pro simulado e apagar dados', async ({ page }) => {
  await cadastrarPrimeiroTalhao(page);
  await irParaAba(page, 'Ajustes');
  await expect(page.getByText('Avisos no celular')).toBeVisible();
  await expect(page.getByText('Limites de pulverização · Pro')).toBeVisible();
  await page.getByTestId('seguro-proagro').click();
  await page.getByTestId('prazo-5').click();
  await page.getByTestId('tema-escuro').click();
  await capturar(page, '15-ajustes-escuro');
  await irParaAba(page, 'Hoje');
  await capturar(page, '16-hoje-escuro');
  await irParaAba(page, 'Ajustes');
  await page.getByTestId('tema-claro').click();

  await simularPro(page);
  await expect(page.getByTestId('vigia-doenca').getByText(/Clima favorável à infecção/)).toBeVisible();

  await irParaAba(page, 'Ajustes');
  await page.getByTestId('apagar-dados').click();
  await expect(page.getByText('O vigia da sua lavoura, no bolso.')).toBeVisible();
});
