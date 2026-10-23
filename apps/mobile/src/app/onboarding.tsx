import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dadosIniciais, FormTalhao } from '@/components/form-talhao';
import { Ilustracao, type NomeIlustracao } from '@/components/icone';
import { Botao, T, Tela } from '@/components/ui';
import { MaxContentWidth, Raio, Spacing } from '@/constants/theme';
import { pedirPermissaoNotificacoes, reagendarAvisos } from '@/lib/avisos';
import { obterEstado, salvarTalhao } from '@/lib/estado';

const RECURSOS: { ilustracao: NomeIlustracao; titulo: string; texto: string }[] = [
  { ilustracao: 'bell', titulo: 'Vigia 24 horas', texto: 'Chuva chegando, geada, doença e chuva sobre o produto aplicado — por talhão, antes de acontecer.' },
  { ilustracao: 'satellite', titulo: 'Olho do satélite', texto: 'Imagem e vigor da sua lavoura a cada passagem do satélite, para achar a mancha antes de rodar a área toda.' },
  { ilustracao: 'clipboard', titulo: 'Prazo e prova', texto: 'Caderno de campo automático e dossiê em PDF para o banco, a seguradora e o Proagro.' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
      <LinearGradient colors={['#0B3D22', '#17663A', '#2E8B57']} style={estilos.tela}>
        <ScrollView contentContainerStyle={[estilos.inicio, { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + Spacing.four }]}>
          <View style={estilos.cena}>
            <View style={[estilos.bolha, estilos.bolhaSol]}>
              <Ilustracao nome="sun_behind_rain_cloud" tamanho={72} />
            </View>
            <Ilustracao nome="man_farmer" tamanho={150} />
            <View style={[estilos.bolha, estilos.bolhaTrator]}>
              <Ilustracao nome="tractor" tamanho={76} />
            </View>
            <View style={[estilos.bolha, estilos.bolhaBroto]}>
              <Ilustracao nome="seedling" tamanho={52} />
            </View>
          </View>
          <View style={estilos.textos}>
            <T variante="rotulo" cor="#A8E6BF">
              Grão Raiz
            </T>
            <T variante="titulo" cor="#ffffff" style={estilos.manchete}>
              O vigia da sua lavoura, no bolso.
            </T>
            <T variante="corpo" cor="rgba(255,255,255,0.86)">
              Avisa a hora certa de plantar, pulverizar e colher — e guarda a prova quando o tempo virar.
            </T>
          </View>
          {RECURSOS.map((r) => (
            <View key={r.titulo} style={estilos.recurso}>
              <Ilustracao nome={r.ilustracao} tamanho={44} />
              <View style={estilos.flex}>
                <T variante="forte" cor="#ffffff">
                  {r.titulo}
                </T>
                <T variante="pequeno" cor="rgba(255,255,255,0.8)">
                  {r.texto}
                </T>
              </View>
            </View>
          ))}
          <Botao titulo="Começar" tipo="claro" icone="direita" aoTocar={() => setPasso('talhao')} testID="comecar" />
          <T variante="pequeno" cor="rgba(255,255,255,0.75)" style={estilos.centro}>
            Sem cadastro e sem anúncios. Seus dados ficam no seu celular.
          </T>
        </ScrollView>
      </LinearGradient>
    );
  }

  if (passo === 'talhao') {
    const valido = dados.nome.trim().length > 0 && dados.coordenada !== null;
    return (
      <Tela comAbas={false} titulo="Seu primeiro talhão" subtitulo="O vigia trabalha para este ponto. Dá para ajustar tudo depois.">
        <FormTalhao dados={dados} aoMudar={setDados} completo={false} />
        <Botao
          titulo="Continuar"
          icone="direita"
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
    <Tela comAbas={false}>
      <View style={estilos.avisos}>
        <Ilustracao nome="bell" tamanho={120} />
        <T variante="titulo" style={estilos.centro}>
          Avisos no celular
        </T>
        <T style={estilos.centro}>
          O vigia avisa chuva chegando, geada na tarde anterior e temporal com horas de antecedência — mesmo com o app fechado. Toda manhã, um boletim do seu talhão.
        </T>
      </View>
      <Botao
        titulo="Ativar avisos"
        icone="sino"
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

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  inicio: { paddingHorizontal: Spacing.four, gap: Spacing.three, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  cena: { height: 210, alignItems: 'center', justifyContent: 'flex-end' },
  bolha: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: Raio.total, padding: 10 },
  bolhaSol: { top: 0, left: '8%' },
  bolhaTrator: { bottom: 6, right: '4%' },
  bolhaBroto: { top: 24, right: '14%' },
  textos: { gap: Spacing.two },
  manchete: { fontSize: 34, lineHeight: 40 },
  recurso: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Raio.grande - 4,
    padding: 14,
  },
  flex: { flex: 1, gap: 2 },
  centro: { textAlign: 'center' },
  avisos: { alignItems: 'center', gap: Spacing.three, paddingTop: Spacing.five },
});
