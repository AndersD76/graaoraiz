import { acumulado, dataDe, formatarData, formatarMm, safraDe, somarDias } from '@graoraiz/clima';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { type HostInstance, StyleSheet, View } from 'react-native';

import { IconeTempo } from '@/components/icone';
import { Botao, Chip, Linha, T, Tela } from '@/components/ui';
import { Fontes } from '@/constants/theme';
import { useAgora } from '@/hooks/use-agora';
import { useChuvaSafra } from '@/hooks/use-chuva-safra';
import { SITE_URL } from '@/lib/config';
import { informar } from '@/lib/dialogo';
import { talhaoAtual, useEstado } from '@/lib/estado';
import { compartilharImagem } from '@/lib/exportar';

type Periodo = 'hoje' | 'semana' | 'mes' | 'safra';

const PERIODOS: { valor: Periodo; rotulo: string }[] = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: 'semana', rotulo: '7 dias' },
  { valor: 'mes', rotulo: 'Mês' },
  { valor: 'safra', rotulo: 'Safra' },
];

export default function CartaoChuvaScreen() {
  const estado = useEstado();
  const talhao = talhaoAtual(estado);
  const hoje = dataDe(useAgora());
  const { registros } = useChuvaSafra(talhao, hoje);
  const [periodo, setPeriodo] = useState<Periodo>('hoje');
  const [compartilhando, setCompartilhando] = useState(false);
  const cartao = useRef<HostInstance>(null);

  const safra = safraDe(hoje);
  const inicio = { hoje, semana: somarDias(hoje, -6), mes: `${hoje.slice(0, 7)}-01`, safra: safra.inicio }[periodo];
  const mm = acumulado(registros, inicio, hoje);
  const frase = {
    hoje: `choveu hoje (${formatarData(hoje)})`,
    semana: 'nos últimos 7 dias',
    mes: 'neste mês',
    safra: `na safra ${safra.rotulo}`,
  }[periodo];
  const site = SITE_URL.replace(/^https?:\/\//, '');

  const compartilhar = async () => {
    setCompartilhando(true);
    try {
      await compartilharImagem(cartao, 'Compartilhar chuva');
    } catch (e) {
      informar('Compartilhar', e instanceof Error ? e.message : 'Não foi possível compartilhar o cartão.');
    } finally {
      setCompartilhando(false);
    }
  };

  return (
    <Tela comAbas={false} cabecalhoNativo>
      <Linha>
        {PERIODOS.map((p) => (
          <Chip key={p.valor} rotulo={p.rotulo} ativo={periodo === p.valor} aoTocar={() => setPeriodo(p.valor)} />
        ))}
      </Linha>

      <View ref={cartao} collapsable={false} style={estilos.moldura} testID="cartao-chuva">
        <LinearGradient colors={['#1B4F9C', '#2B78DE', '#17663A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.cartao}>
        <View style={estilos.topo}>
          <T variante="forte" cor="#D8F0DD" style={estilos.marca}>
            Grão Raiz · pluviômetro
          </T>
          <IconeTempo nome="raindrop-measure" tamanho={64} />
        </View>
        {/* Tamanho fixo: com fonte grande do sistema o número estouraria o cartão quadrado. */}
        <T style={estilos.mm} cor="#ffffff" maxFontSizeMultiplier={1} adjustsFontSizeToFit numberOfLines={1}>
          {formatarMm(mm)}
        </T>
        <T variante="subtitulo" cor="#ffffff">
          {frase}
        </T>
        <T cor="#D8F0DD">{talhao?.nome}</T>
        <View style={estilos.rodape}>
          <T variante="pequeno" cor="#D8F0DD">
            Anote sua chuva também: {site}/baixar
          </T>
        </View>
        </LinearGradient>
      </View>

      <T variante="pequeno">Inclui seus registros e, nos dias sem anotação, a estimativa automática.</T>
      <Botao titulo="Compartilhar no WhatsApp" icone="whatsapp" aoTocar={compartilhar} carregando={compartilhando} testID="compartilhar-cartao" />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  moldura: { borderRadius: 24, overflow: 'hidden', aspectRatio: 1 },
  cartao: { flex: 1, padding: 24, gap: 6, justifyContent: 'center' },
  topo: { flexDirection: 'row', alignItems: 'center' },
  marca: { flex: 1 },
  mm: { fontSize: 72, lineHeight: 80, fontFamily: Fontes.extra, letterSpacing: -2 },
  rodape: { marginTop: 'auto' },
});
