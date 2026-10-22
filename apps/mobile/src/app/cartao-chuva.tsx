import { acumulado, dataDe, formatarData, formatarMm, isoLocal, safraDe, somarDias } from '@graoraiz/clima';
import { useRef, useState } from 'react';
import { type HostInstance, StyleSheet, View } from 'react-native';

import { Botao, Chip, Linha, T, Tela } from '@/components/ui';
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
  const { registros } = useChuvaSafra(talhao);
  const [periodo, setPeriodo] = useState<Periodo>('hoje');
  const [compartilhando, setCompartilhando] = useState(false);
  const cartao = useRef<HostInstance>(null);

  const hoje = dataDe(isoLocal(new Date()));
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
    <Tela comAbas={false}>
      <Linha>
        {PERIODOS.map((p) => (
          <Chip key={p.valor} rotulo={p.rotulo} ativo={periodo === p.valor} aoTocar={() => setPeriodo(p.valor)} />
        ))}
      </Linha>

      <View ref={cartao} collapsable={false} style={estilos.cartao} testID="cartao-chuva">
        <T variante="forte" cor="#D8F0DD">
          Grão Raiz · pluviômetro
        </T>
        <T style={estilos.mm} cor="#ffffff">
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
      </View>

      <T variante="pequeno">Inclui seus registros e, nos dias sem anotação, a estimativa automática.</T>
      <Botao titulo="Compartilhar" aoTocar={compartilhar} carregando={compartilhando} testID="compartilhar-cartao" />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  cartao: { backgroundColor: '#1F6B2E', borderRadius: 20, padding: 24, gap: 6, aspectRatio: 1, justifyContent: 'center' },
  mm: { fontSize: 72, lineHeight: 80, fontWeight: '800' },
  rodape: { marginTop: 'auto' },
});
