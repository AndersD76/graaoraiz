import { DefaultTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { Colors } from '@/constants/theme';
import { iniciarAssinatura } from '@/lib/assinatura';
import { configurarNotificacoes, ouvirToqueNosAvisos, reagendarAvisos } from '@/lib/avisos';
import { obterEstado, selecionarTalhao } from '@/lib/estado';
// A tarefa em si é definida no index.ts (ponto de entrada); aqui só pedimos o registro.
import { registrarTarefaFundo } from '@/lib/tarefa-fundo';

SplashScreen.preventAutoHideAsync();
configurarNotificacoes();

// Ao abrir por link direto numa tela empilhada, as abas ficam por baixo para o "voltar" funcionar.
export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  const router = useRouter();

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

  // Tocar num aviso abre a tela Hoje no talhão do aviso.
  useEffect(
    () =>
      ouvirToqueNosAvisos((talhaoId) => {
        if (obterEstado().talhoes.some((t) => t.id === talhaoId)) selecionarTalhao(talhaoId);
        router.navigate('/');
      }),
    [router],
  );

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
