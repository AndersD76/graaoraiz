import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { dadosIniciais, FormTalhao } from '@/components/form-talhao';
import { Aviso, Botao, Cartao, T, Tela } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { pedirPermissaoNotificacoes, reagendarAvisos } from '@/lib/avisos';
import { obterEstado, salvarTalhao } from '@/lib/estado';

const RECURSOS = [
  ['Pulverização', 'Semáforo com o melhor horário do dia, pelo vento na barra, delta T, umidade e chuva.'],
  ['Colheita', 'Janela de tempo firme para colher ou entrar com máquina.'],
  ['Chuva', 'Seu pluviômetro no celular, com estimativa automática e cartão para o WhatsApp.'],
  ['Avisos', 'Geada e temporal avisados com antecedência, mesmo com o app fechado.'],
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const tema = useTheme();
  const [passo, setPasso] = useState<'inicio' | 'talhao' | 'avisos'>('inicio');
  const [dados, setDados] = useState(() => dadosIniciais());
  const [ativando, setAtivando] = useState(false);
  // Quem já tem talhão e cai aqui (link direto) volta para o app: a apresentação não cria talhão extra.
  const [jaTinhaTalhao] = useState(() => obterEstado().talhoes.length > 0);

  if (jaTinhaTalhao) return <Redirect href="/" />;

  const concluir = () => {
    void reagendarAvisos({ buscar: true });
    router.replace('/');
  };

  if (passo === 'inicio') {
    return (
      <Tela comAbas={false}>
        <View style={{ gap: 8, paddingTop: 24 }}>
          <T variante="titulo" cor={tema.marca}>
            Grão Raiz
          </T>
          <T variante="subtitulo">O tempo certo para agir no seu talhão.</T>
        </View>
        {RECURSOS.map(([titulo, texto]) => (
          <Cartao key={titulo}>
            <T variante="forte">{titulo}</T>
            <T>{texto}</T>
          </Cartao>
        ))}
        <T variante="pequeno">Sem cadastro: seus dados ficam no seu celular.</T>
        <Botao titulo="Começar" aoTocar={() => setPasso('talhao')} testID="comecar" />
      </Tela>
    );
  }

  if (passo === 'talhao') {
    const valido = dados.nome.trim().length > 0 && dados.coordenada !== null;
    return (
      <Tela comAbas={false} titulo="Seu primeiro talhão" subtitulo="A previsão é feita para este ponto. Dá para mudar depois.">
        <FormTalhao dados={dados} aoMudar={setDados} comPlantio={false} />
        <Botao
          titulo="Continuar"
          desabilitado={!valido}
          testID="continuar-talhao"
          aoTocar={() => {
            if (!dados.coordenada) return;
            salvarTalhao({
              nome: dados.nome.trim(),
              lat: dados.coordenada.lat,
              lon: dados.coordenada.lon,
              cultura: dados.cultura,
              dataPlantio: null,
            });
            setPasso('avisos');
          }}
        />
      </Tela>
    );
  }

  return (
    <Tela comAbas={false} titulo="Avisos no celular">
      <Aviso titulo="Para não ser pego de surpresa">
        O app avisa risco de geada na tarde anterior e temporal com algumas horas de antecedência. Você escolhe quais avisos quer receber em Ajustes.
      </Aviso>
      <Botao
        titulo="Ativar avisos"
        carregando={ativando}
        testID="ativar-avisos"
        aoTocar={async () => {
          setAtivando(true);
          await pedirPermissaoNotificacoes().catch(() => false);
          setAtivando(false);
          concluir();
        }}
      />
      <Botao titulo="Agora não" tipo="texto" aoTocar={concluir} testID="pular-avisos" />
    </Tela>
  );
}
