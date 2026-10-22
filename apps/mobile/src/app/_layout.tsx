import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { Colors } from '@/constants/theme';
import { iniciarAssinatura } from '@/lib/assinatura';
import { configurarNotificacoes, reagendarAvisos } from '@/lib/avisos';
// Importado aqui para a tarefa em segundo plano ser definida assim que o app carrega.
import { registrarTarefaFundo } from '@/lib/tarefa-fundo';

SplashScreen.preventAutoHideAsync();
configurarNotificacoes();

export default function RootLayout() {
  useEffect(() => {
    // O estado é lido de forma síncrona do aparelho: a primeira tela já está pronta.
    void SplashScreen.hideAsync();
    void iniciarAssinatura();
    void registrarTarefaFundo();
    void reagendarAvisos({ buscar: true });
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void reagendarAvisos({ buscar: true });
    });
    return () => assinatura.remove();
  }, []);

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack
        screenOptions={{
          headerTintColor: Colors.light.marca,
          headerTitleStyle: { fontWeight: '700', color: Colors.light.text },
          headerBackTitle: 'Voltar',
          contentStyle: { backgroundColor: Colors.light.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="talhao" options={{ title: 'Talhão' }} />
        <Stack.Screen name="pulverizacao" options={{ title: 'Pulverização hora a hora' }} />
        <Stack.Screen name="cartao-chuva" options={{ title: 'Cartão de chuva' }} />
        <Stack.Screen name="relatorio" options={{ title: 'Relatório da safra' }} />
        <Stack.Screen name="assinatura" options={{ title: 'Grão Raiz Pro', presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
