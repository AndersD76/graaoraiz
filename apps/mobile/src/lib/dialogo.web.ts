export async function confirmar(titulo: string, mensagem: string): Promise<boolean> {
  return window.confirm(`${titulo}\n\n${mensagem}`);
}

export function informar(titulo: string, mensagem: string): void {
  window.alert(`${titulo}\n\n${mensagem}`);
}
