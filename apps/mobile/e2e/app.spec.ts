import { expect, type Page, test } from '@playwright/test';

import { DATAS, usarClimaFalso } from './clima-falso';

const CAPTURAS = 'e2e/capturas';

async function capturar(page: Page, nome: string) {
  await page.screenshot({ path: `${CAPTURAS}/${nome}.png`, fullPage: true });
}

async function irParaAba(page: Page, nome: 'Hoje' | 'Chuva' | 'Talhões' | 'Ajustes') {
  await page.getByRole('button', { name: nome, exact: true }).or(page.getByRole('tab', { name: nome })).or(page.getByRole('link', { name: nome })).first().click();
}

/** Faz a apresentação inicial e cria o primeiro talhão pela "localização do celular". */
async function cadastrarPrimeiroTalhao(page: Page) {
  await page.goto('/');
  await expect(page.getByText('O tempo certo para agir no seu talhão.')).toBeVisible();
  await capturar(page, '01-apresentacao');
  await page.getByTestId('comecar').click();

  await expect(page.getByText('Seu primeiro talhão')).toBeVisible();
  await page.getByTestId('campo-nome').fill('Talhão da Sede');
  await page.getByTestId('usar-localizacao').click();
  await expect(page.getByText('Marcado em -25.4321, -49.2715')).toBeVisible();
  await page.getByRole('button', { name: 'Soja' }).click();
  await capturar(page, '02-primeiro-talhao');
  await page.getByTestId('continuar-talhao').click();

  await expect(page.getByText('Avisos no celular')).toBeVisible();
  await page.getByTestId('pular-avisos').click();
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (d) => void d.accept());
  await usarClimaFalso(page);
});

test('apresentação, primeiro talhão e tela Hoje', async ({ page }) => {
  await cadastrarPrimeiroTalhao(page);

  await expect(page.getByText('Hoje', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Talhão da Sede').first()).toBeVisible();
  const amanha = page.getByTestId('pulverizacao-Amanhã');
  await expect(amanha.getByText('Dá para pulverizar')).toBeVisible();
  await expect(amanha.getByText('Melhor horário: das 6h às 10h')).toBeVisible();
  await expect(page.getByText('Risco alto de geada')).toBeVisible();
  await expect(page.getByText('Próximos 7 dias')).toBeVisible();
  await expect(page.getByText(/Tempo firme de/)).toBeVisible();
  await expect(page.getByText('Dados meteorológicos: Open-Meteo.com (CC BY 4.0)')).toBeVisible();
  await capturar(page, '03-hoje');

  await page.getByTestId('ver-hora-a-hora').click();
  await expect(page.getByText(/Critérios: vento na barra/)).toBeVisible();
  // No grátis, amanhã aparece bloqueado com convite para o Pro.
  await expect(page.getByText('Veja amanhã hora a hora')).toBeVisible();
  await capturar(page, '04-hora-a-hora-gratis');
});

test('pluviômetro: anotar chuva, acumulado e calendário', async ({ page }) => {
  await cadastrarPrimeiroTalhao(page);
  await irParaAba(page, 'Chuva');

  await expect(page.getByText('Quanto choveu?')).toBeVisible();
  await page.getByTestId('campo-mm').fill('12');
  await page.getByTestId('salvar-chuva').click();
  await expect(page.getByText(/Anotado: 12 mm\./)).toBeVisible();
  const resumo = page.getByTestId('resumo-safra');
  await expect(resumo.getByText(/1 dia anotado por você/)).toBeVisible();
  await expect(resumo.getByText(/Média histórica no mesmo período/)).toBeVisible();
  await capturar(page, '05-chuva');

  await page.getByTestId('abrir-cartao').click();
  await expect(page.getByTestId('cartao-chuva').getByText('12 mm')).toBeVisible();
  await capturar(page, '06-cartao-chuva');
});

test('Pro simulado libera talhões extras, 48 h e relatório', async ({ page }) => {
  await cadastrarPrimeiroTalhao(page);

  await irParaAba(page, 'Talhões');
  await expect(page.getByTestId('talhao-Talhão da Sede')).toBeVisible();
  await page.getByTestId('adicionar-talhao').click();
  await expect(page.getByText('Grão Raiz Pro').first()).toBeVisible();
  await expect(page.getByText(/R\$ 19,90 por mês ou R\$ 149,90 por ano/)).toBeVisible();
  await capturar(page, '07-assinatura');
  await page.getByTestId('simular-pro-paywall').click();
  await expect(page.getByText('Pro ativo')).toBeVisible();
  await page.goBack();

  await page.getByTestId('adicionar-talhao').click();
  await page.getByTestId('campo-nome').fill('Talhão do Rio');
  await page.getByTestId('campo-latitude').fill('-25.50');
  await page.getByTestId('campo-longitude').fill('-49.30');
  await page.getByTestId('salvar-talhao').click();
  await expect(page.getByTestId('talhao-Talhão do Rio')).toBeVisible();
  await capturar(page, '08-talhoes');

  await irParaAba(page, 'Hoje');
  await expect(page.getByRole('button', { name: 'Talhão do Rio' })).toBeVisible();
  await page.getByTestId('ver-hora-a-hora').click();
  await expect(page.getByText('Veja amanhã hora a hora')).toBeHidden();
  // Com o Pro, amanhã aparece liberado hora a hora (a faixa das 6h tem detalhes, não só o selo).
  const seisDeAmanha = page.getByTestId(`hora-${DATAS.amanha}T06:00`);
  await expect(seisDeAmanha).toBeVisible();
  await expect(seisDeAmanha.getByText(/Vento na barra/)).toBeVisible();
  await capturar(page, '09a-hora-a-hora-pro');
  await page.goBack();

  await irParaAba(page, 'Chuva');
  await page.getByRole('button', { name: 'Relatório da safra (PDF)' }).click();
  await expect(page.getByText(/safra \d{4}\/\d{2}/).first()).toBeVisible();
  await capturar(page, '09-relatorio');
});

test('ajustes: avisos, limites e apagar dados', async ({ page }) => {
  await cadastrarPrimeiroTalhao(page);
  await irParaAba(page, 'Ajustes');
  await expect(page.getByText('Avisos no celular')).toBeVisible();
  await expect(page.getByText('Limites de pulverização · Pro')).toBeVisible();
  await capturar(page, '10-ajustes');

  await page.getByTestId('apagar-dados').click();
  await expect(page.getByText('O tempo certo para agir no seu talhão.')).toBeVisible();
});
