import { Alert } from 'react-native';

export function confirmar(titulo: string, mensagem: string, acao = 'Confirmar'): Promise<boolean> {
  return new Promise((resolver) => {
    Alert.alert(titulo, mensagem, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolver(false) },
      { text: acao, style: 'destructive', onPress: () => resolver(true) },
    ]);
  });
}

export function informar(titulo: string, mensagem: string): void {
  Alert.alert(titulo, mensagem);
}
