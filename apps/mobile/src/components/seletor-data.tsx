import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { dateLocal, formatarData, isoLocal } from '@graoraiz/clima';
import { Platform, View } from 'react-native';

import { Botao, T } from '@/components/ui';

/** Escolha de data ("AAAA-MM-DD"): diálogo no Android, calendário compacto no iPhone. */
export function SeletorData({ valor, aoMudar, maximo }: { valor: string; aoMudar: (data: string) => void; maximo?: string }) {
  const data = dateLocal(`${valor}T12:00`);
  const limite = maximo ? dateLocal(`${maximo}T23:59`) : undefined;

  if (Platform.OS === 'android') {
    return (
      <View style={{ gap: 6 }}>
        <T variante="forte">{`${formatarData(valor)}/${valor.slice(0, 4)}`}</T>
        <Botao
          titulo="Mudar data"
          tipo="secundario"
          aoTocar={() =>
            DateTimePickerAndroid.open({
              value: data,
              mode: 'date',
              maximumDate: limite,
              onChange: (evento, escolhida) => {
                if (evento.type === 'set' && escolhida) aoMudar(isoLocal(escolhida).slice(0, 10));
              },
            })
          }
        />
      </View>
    );
  }

  return (
    <DateTimePicker
      value={data}
      mode="date"
      display="compact"
      maximumDate={limite}
      locale="pt-BR"
      onChange={(_, escolhida) => escolhida && aoMudar(isoLocal(escolhida).slice(0, 10))}
    />
  );
}
