import { boletimFalado, dataDe, diaDaSemana, formatarData, saudacao } from '@graoraiz/clima';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icone, Ilustracao } from '@/components/icone';
import { Botao, T } from '@/components/ui';
import { ICONE_CATEGORIA } from '@/components/vigia';
import { MaxContentWidth, Raio, Spacing } from '@/constants/theme';
import { useAgora } from '@/hooks/use-agora';
import { usePrevisao } from '@/hooks/use-previsao';
import { useVigia } from '@/hooks/use-vigia';
import { talhaoAtual, useEstado, usePro } from '@/lib/estado';

const COR_STATUS = { bom: '#7BE0A0', atencao: '#FFC965', ruim: '#FF8A80' } as const;

/** Boletim do dia: o resumo do vigia em tela cheia, para ouvir (voz do celular) ou mandar no WhatsApp. */
export default function BoletimScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const estado = useEstado();
  const pro = usePro();
  const agora = useAgora();
  const talhao = talhaoAtual(estado);
  const { resultado } = usePrevisao(talhao?.lat, talhao?.lon);
  const itens = useVigia(talhao, resultado, agora);
  const [falando, setFalando] = useState(false);
  // No grátis o boletim mostra o que é do grátis; os itens do Pro aparecem como convite.
  const visiveis = itens.filter((i) => pro || !i.pro).slice(0, 5);
  const escondidos = itens.length - visiveis.length;

  useEffect(() => () => void Speech.stop(), []);

  if (!talhao) return null;
  const hoje = dataDe(agora);
  const texto = boletimFalado(visiveis, talhao.nome, agora, estado.produtor || undefined);

  const ouvir = async () => {
    if (falando) {
      await Speech.stop();
      setFalando(false);
      return;
    }
    setFalando(true);
    Speech.speak(texto, { language: 'pt-BR', rate: 0.95, onDone: () => setFalando(false), onStopped: () => setFalando(false), onError: () => setFalando(false) });
  };

  const compartilhar = () =>
    Share.share({
      message: `*Boletim do ${talhao.nome}* — ${diaDaSemana(hoje, true)}, ${formatarData(hoje)}\n\n${visiveis.map((i) => `• ${i.titulo}. ${i.texto}`).join('\n')}\n\nGrão Raiz, o vigia da lavoura.`,
    });

  return (
    <LinearGradient colors={['#0B3D22', '#145A33', '#1F7A45']} style={estilos.tela}>
      <ScrollView contentContainerStyle={[estilos.conteudo, { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.four }]}>
        <View style={estilos.topo}>
          <T variante="rotulo" cor="#A8E6BF" style={estilos.flex}>
            Boletim · {diaDaSemana(hoje, true)}, {formatarData(hoje)}
          </T>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Fechar" style={estilos.fechar} hitSlop={10}>
            <Icone nome="fechar" tamanho={20} cor="#ffffff" />
          </Pressable>
        </View>
        <View style={estilos.saudacao}>
          <Ilustracao nome="man_farmer" tamanho={72} />
          <View style={estilos.flex}>
            <T variante="titulo" cor="#ffffff">
              {saudacao(agora)}
              {estado.produtor ? `, ${estado.produtor}` : ''}!
            </T>
            <T cor="rgba(255,255,255,0.85)">O vigia olhou o {talhao.nome} para você.</T>
          </View>
        </View>

        {visiveis.map((i) => (
          <View key={i.id} style={estilos.item}>
            <View style={[estilos.icone, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
              <Icone nome={ICONE_CATEGORIA[i.categoria]} tamanho={22} cor={COR_STATUS[i.status]} />
            </View>
            <View style={estilos.flex}>
              <T variante="forte" cor="#ffffff">
                {i.titulo}
              </T>
              <T variante="pequeno" cor="rgba(255,255,255,0.8)">
                {i.texto}
              </T>
            </View>
          </View>
        ))}
        {!resultado ? <T cor="rgba(255,255,255,0.85)">Sem previsão salva ainda. Abra o app com sinal para o vigia trabalhar.</T> : null}

        {escondidos > 0 ? (
          <Pressable onPress={() => router.push('/assinatura')} style={estilos.convite} accessibilityRole="button">
            <Icone nome="cadeado" tamanho={18} cor="#FFD27A" />
            <T variante="forte" cor="#FFD27A" style={estilos.flex}>
              Mais {escondidos} {escondidos === 1 ? 'alerta' : 'alertas'} do vigia no Pro
            </T>
          </Pressable>
        ) : null}

        <Botao titulo={falando ? 'Parar' : 'Ouvir o boletim'} tipo="claro" icone={falando ? 'fechar' : 'microfone'} aoTocar={ouvir} testID="ouvir-boletim" />
        <Botao titulo="Mandar no WhatsApp" tipo="secundario" icone="whatsapp" aoTocar={compartilhar} testID="compartilhar-boletim" />
        <T variante="pequeno" cor="rgba(255,255,255,0.7)" style={estilos.centro}>
          Todo dia às {estado.preferencias.horaBoletim}h o boletim chega como aviso{pro ? '' : ' (Pro)'}. Ajuste o horário em Ajustes.
        </T>
      </ScrollView>
    </LinearGradient>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { paddingHorizontal: Spacing.three, gap: Spacing.three, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  topo: { flexDirection: 'row', alignItems: 'center' },
  fechar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  saudacao: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  flex: { flex: 1, gap: 2 },
  item: { flexDirection: 'row', gap: Spacing.three, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: Raio.grande - 4, padding: 14, alignItems: 'center' },
  icone: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  convite: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: Raio.medio, borderWidth: 1, borderColor: 'rgba(255,210,122,0.5)', padding: 12 },
  centro: { textAlign: 'center' },
});
