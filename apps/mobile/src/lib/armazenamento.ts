import Storage from 'expo-sqlite/kv-store';

/** Chave-valor persistente no aparelho (SQLite). Valores em JSON. */
export function ler<T>(chave: string): T | null {
  try {
    const bruto = Storage.getItemSync(chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}

export function gravar<T>(chave: string, valor: T): void {
  Storage.setItemSync(chave, JSON.stringify(valor));
}

export function apagar(chave: string): void {
  Storage.removeItemSync(chave);
}

export function chaves(): string[] {
  return Storage.getAllKeysSync();
}
