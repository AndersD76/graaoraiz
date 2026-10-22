/**
 * Versão web (testes no navegador): banco local do navegador (localStorage), com a mesma interface
 * do SQLite usado no celular. Os dados persistem entre recargas, por navegador.
 * O expo-sqlite na web ainda é experimental e, nos testes, não manteve os dados após recarregar.
 */
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
