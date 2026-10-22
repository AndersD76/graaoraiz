/** Na versão web (testes no navegador) não há notificações locais. */
export function configurarNotificacoes(): void {}

export async function permissaoNotificacoes(): Promise<'concedida' | 'negada' | 'pendente'> {
  return 'negada';
}

export async function pedirPermissaoNotificacoes(): Promise<boolean> {
  return false;
}

export async function reagendarAvisos(): Promise<number> {
  return 0;
}
