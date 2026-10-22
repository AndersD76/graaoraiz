/** Versão web (usada nos testes no navegador): localStorage com a mesma interface. */
function armazenamento(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function ler<T>(chave: string): T | null {
  try {
    const bruto = armazenamento()?.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}

export function gravar<T>(chave: string, valor: T): void {
  armazenamento()?.setItem(chave, JSON.stringify(valor));
}

export function apagar(chave: string): void {
  armazenamento()?.removeItem(chave);
}

export function chaves(): string[] {
  const s = armazenamento();
  if (!s) return [];
  return Array.from({ length: s.length }, (_, i) => s.key(i)).filter((k): k is string => k !== null);
}
