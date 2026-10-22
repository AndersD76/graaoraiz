import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

import { ENTITLEMENT_PRO, REVENUECAT_ANDROID, REVENUECAT_IOS } from '@/lib/config';
import { definirPro } from '@/lib/estado';

export interface PlanoAssinatura {
  id: string;
  titulo: string;
  preco: string;
  descricao: string;
}

const chave = Platform.OS === 'ios' ? REVENUECAT_IOS : REVENUECAT_ANDROID;
let configurado = false;

/** A assinatura só funciona com a chave do RevenueCat configurada (EXPO_PUBLIC_REVENUECAT_*). */
export function assinaturaDisponivel(): boolean {
  return chave !== null;
}

function aplicar(info: CustomerInfo): void {
  definirPro(info.entitlements.active[ENTITLEMENT_PRO] !== undefined);
}

export async function iniciarAssinatura(): Promise<void> {
  if (!chave || configurado) return;
  try {
    Purchases.configure({ apiKey: chave });
    configurado = true;
    Purchases.addCustomerInfoUpdateListener(aplicar);
    aplicar(await Purchases.getCustomerInfo());
  } catch {
    // Sem conexão com a loja: mantém o último estado salvo.
  }
}

/** Relê o status na loja (ex.: depois de apagar os dados do aparelho, para o assinante continuar Pro). */
export async function atualizarStatusAssinatura(): Promise<void> {
  if (!configurado) return;
  try {
    aplicar(await Purchases.getCustomerInfo());
  } catch {
    // Sem conexão: o listener corrige quando a loja responder.
  }
}

const UNIDADES: Record<string, [string, string]> = {
  DAY: ['dia', 'dias'],
  WEEK: ['semana', 'semanas'],
  MONTH: ['mês', 'meses'],
  YEAR: ['ano', 'anos'],
};

/** "14 dias grátis, depois R$ 149,90 por ano" — a loja exige o teste e o preço visíveis antes da compra. */
function descrever(p: PurchasesPackage): PlanoAssinatura {
  const anual = p.packageType === 'ANNUAL';
  const intro = p.product.introPrice;
  const cobranca = anual ? 'por ano' : 'por mês';
  let descricao = `cobrado ${anual ? 'uma vez por ano' : 'todo mês'}`;
  if (intro) {
    const [um, varios] = UNIDADES[intro.periodUnit] ?? ['período', 'períodos'];
    const duracao = `${intro.periodNumberOfUnits} ${intro.periodNumberOfUnits === 1 ? um : varios}`;
    descricao = intro.price === 0
      ? `${duracao} grátis, depois ${p.product.priceString} ${cobranca}`
      : `${intro.priceString} por ${duracao}, depois ${p.product.priceString} ${cobranca}`;
  }
  return {
    id: p.identifier,
    titulo: anual ? 'Anual' : p.packageType === 'MONTHLY' ? 'Mensal' : p.product.title,
    preco: p.product.priceString,
    descricao,
  };
}

export async function carregarPlanos(): Promise<PlanoAssinatura[]> {
  if (!configurado) return [];
  const ofertas = await Purchases.getOfferings();
  return (ofertas.current?.availablePackages ?? []).map(descrever);
}

/** Compra o plano; devolve true se o Pro ficou ativo. Cancelamento pelo usuário devolve false. */
export async function comprar(planoId: string): Promise<boolean> {
  if (!configurado) return false;
  const ofertas = await Purchases.getOfferings();
  const pacote = ofertas.current?.availablePackages.find((p) => p.identifier === planoId);
  if (!pacote) throw new Error('Plano indisponível no momento.');
  try {
    const { customerInfo } = await Purchases.purchasePackage(pacote);
    aplicar(customerInfo);
    return customerInfo.entitlements.active[ENTITLEMENT_PRO] !== undefined;
  } catch (e) {
    if (typeof e === 'object' && e !== null && 'userCancelled' in e && e.userCancelled) return false;
    throw e;
  }
}

export async function restaurarCompras(): Promise<boolean> {
  if (!configurado) return false;
  const info = await Purchases.restorePurchases();
  aplicar(info);
  return info.entitlements.active[ENTITLEMENT_PRO] !== undefined;
}
