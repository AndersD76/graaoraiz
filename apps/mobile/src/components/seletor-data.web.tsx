import { useState } from 'react';

import { Campo } from '@/components/ui';

/** Na web (testes no navegador) a data é digitada. */
export function SeletorData({ valor, aoMudar, maximo }: { valor: string; aoMudar: (data: string) => void; maximo?: string }) {
  const [texto, setTexto] = useState(valor);
  return (
    <Campo
      rotulo="Data (AAAA-MM-DD)"
      value={texto}
      onChangeText={(v) => {
        setTexto(v);
        if (/^\d{4}-\d{2}-\d{2}$/.test(v) && (!maximo || v <= maximo)) aoMudar(v);
      }}
      testID="campo-data"
    />
  );
}
