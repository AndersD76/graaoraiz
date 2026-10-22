/** Na web não há compra pela loja; o Pro só pode ser simulado em desenvolvimento. */
export interface PlanoAssinatura {
  id: string;
  titulo: string;
  preco: string;
  descricao: string;
}

export function assinaturaDisponivel(): boolean {
  return false;
}

export async function iniciarAssinatura(): Promise<void> {}

export async function atualizarStatusAssinatura(): Promise<void> {}

export async function carregarPlanos(): Promise<PlanoAssinatura[]> {
  return [];
}

export async function comprar(): Promise<boolean> {
  return false;
}

export async function restaurarCompras(): Promise<boolean> {
  return false;
}
