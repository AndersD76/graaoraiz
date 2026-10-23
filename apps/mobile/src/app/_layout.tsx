import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { Fontes } from '@/constants/theme';
import { useEsquema, useTheme } from '@/hooks/use-theme';
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
  const esquema = useEsquema();
  const tema = useTheme();
  const [fontesProntas, erroFontes] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  // Sem as fontes (falha rara), o app segue com a fonte do sistema em vez de travar na abertura.
  const pronto = fontesProntas || erroFontes !== null;

  useEffect(() => {
    if (pronto) void SplashScreen.hideAsync();
  }, [pronto]);

  useEffect(() => {
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

  if (!pronto) return null;

  const base = esquema === 'dark' ? DarkTheme : DefaultTheme;
  const temaNavegacao = {
    ...base,
    colors: { ...base.colors, primary: tema.marca, background: tema.background, card: tema.background, text: tema.text, border: tema.borda },
  };

  return (
    <ThemeProvider value={temaNavegacao}>
      <StatusBar style={esquema === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerTintColor: tema.marca,
          headerTitleStyle: { fontFamily: Fontes.negrito, color: tema.text },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: tema.background },
          headerBackTitle: 'Voltar',
          contentStyle: { backgroundColor: tema.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="talhao" options={{ title: 'Talhão' }} />
        <Stack.Screen name="pulverizacao" options={{ title: 'Pulverização hora a hora' }} />
        <Stack.Screen name="cartao-chuva" options={{ title: 'Cartão de chuva' }} />
        <Stack.Screen name="satelite" options={{ title: 'Satélite' }} />
        <Stack.Screen name="dossie" options={{ title: 'Dossiê do talhão' }} />
        <Stack.Screen name="aplicacao" options={{ title: 'Apliquei agora', presentation: 'modal' }} />
        <Stack.Screen name="ocorrencia" options={{ title: 'Ocorrência', presentation: 'modal' }} />
        <Stack.Screen name="boletim" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen name="assinatura" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
