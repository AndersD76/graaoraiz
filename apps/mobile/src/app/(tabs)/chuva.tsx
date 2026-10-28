import { acumulado, dataDe, diasSemChuva, formatarData, formatarMm, formatarNumero, maiorSequenciaSeca, rotuloDia, safraDe, somarDias } from '@graoraiz/clima';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CalendarioChuva } from '@/components/calendario-chuva';
import { SeletorTalhao } from '@/components/clima';
import { Icone, IconeTempo } from '@/components/icone';
import { Aviso, Botao, Campo, Cartao, Chip, Linha, T, Tela } from '@/components/ui';
import { Raio, Spacing } from '@/constants/theme';
import { useAgora } from '@/hooks/use-agora';
import { useChuvaSafra } from '@/hooks/use-chuva-safra';
import { anotarChuva, talhaoAtual, useEstado, usePro } from '@/lib/estado';

const RAPIDOS = [0, 5, 10, 20, 50];

function lerMm(texto: string): number | null {
  const n = Number(texto.replace(',', '.'));
  return texto.trim() !== '' && Number.isFinite(n) && n >= 0 && n <= 500 ? n : null;
}

export default function ChuvaScreen() {
  const router = useRouter();
  const estado = useEstado();
  const pro = usePro();
  const talhao = talhaoAtual(estado);
  const agora = useAgora();
  const hoje = dataDe(agora);
  const safra = safraDe(hoje);
  const { registros, normal, carregando, semEstimativa } = useChuvaSafra(talhao, hoje);

  // null = acompanha o dia de hoje (vira sozinho à meia-noite) até o usuário escolher outro.
  const [dataEscolhida, setData] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [mesEscolhido, setMes] = useState<string | null>(null);
  const data = dataEscolhida ?? hoje;
  const mes = mesEscolhido ?? hoje.slice(0, 7);

  if (!talhao) return null;

  const atalhos = [
    { dia: hoje, rotulo: 'Hoje' },
    { dia: somarDias(hoje, -1), rotulo: 'Ontem' },
    { dia: somarDias(hoje, -2), rotulo: formatarData(somarDias(hoje, -2)) },
  ];
  const anotacao = estado.chuvas.find((c) => c.talhaoId === talhao.id && c.data === data);
  const mm = lerMm(texto);
  const total = acumulado(registros, safra.inicio, hoje);
  const diferenca = normal && normal > 0 ? Math.round(((total - normal) * 100) / normal) : null;
  const anotados = registros.filter((r) => r.origem === 'manual').length;
  const seca = maiorSequenciaSeca(registros);
  const semChuva = registros.length ? diasSemChuva(registros, somarDias(hoje, -1)) : null;
  const maximo = Math.max(total, normal ?? 0, 1);

  const escolherDia = (d: string) => {
    setData(d);
    const existente = estado.chuvas.find((c) => c.talhaoId === talhao.id && c.data === d);
    setTexto(existente ? formatarNumero(existente.mm) : '');
  };

  const salvar = () => {
    if (mm === null) return;
    anotarChuva(talhao.id, data, mm);
    setTexto('');
  };

  return (
    <Tela titulo="Chuva" subtitulo={`Safra ${safra.rotulo} · ${talhao.nome}`}>
      <SeletorTalhao selecionado={talhao} />

      <LinearGradient colors={['#1B4F9C', '#2B78DE', '#5AA2FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.capa} testID="resumo-safra">
        <View style={estilos.capaTopo}>
          <View style={estilos.flex}>
            <T variante="rotulo" cor="rgba(255,255,255,0.8)">
              Acumulado da safra
            </T>
            <T variante="display" cor="#ffffff" style={estilos.total}>
              {formatarMm(total)}
            </T>
          </View>
          <IconeTempo nome="raindrop-measure" tamanho={84} />
        </View>
        {normal !== null ? (
          <View style={estilos.barras}>
            <View style={estilos.barraLinha}>
              <T variante="pequeno" cor="#ffffff" style={estilos.rotuloBarra}>
                Esta safra
              </T>
              <View style={estilos.trilha}>
                <View style={[estilos.barra, { width: `${(total / maximo) * 100}%`, backgroundColor: '#ffffff' }]} />
              </View>
            </View>
            <View style={estilos.barraLinha}>
              <T variante="pequeno" cor="rgba(255,255,255,0.8)" style={estilos.rotuloBarra}>
                Média 30 anos
              </T>
              <View style={estilos.trilha}>
                <View style={[estilos.barra, { width: `${(normal / maximo) * 100}%`, backgroundColor: 'rgba(255,255,255,0.5)' }]} />
              </View>
            </View>
            <T variante="forte" cor="#ffffff">
              Média histórica no mesmo período: {formatarMm(normal)}
              {diferenca !== null ? ` (${diferenca >= 0 ? '+' : ''}${diferenca}%)` : ''}
            </T>
          </View>
        ) : null}
        <View style={estilos.chips}>
          {semChuva !== null && semChuva > 0 ? (
            <View style={estilos.chipCapa}>
              <Icone nome="semChuva" tamanho={16} cor="#ffffff" />
              <T variante="pequeno" cor="#ffffff">
                {semChuva} {semChuva === 1 ? 'dia' : 'dias'} sem chuva
              </T>
            </View>
          ) : null}
          {seca && seca.dias >= 5 ? (
            <View style={estilos.chipCapa}>
              <Icone nome="sol" tamanho={16} cor="#ffffff" />
              <T variante="pequeno" cor="#ffffff">
                Maior seca: {seca.dias} dias
              </T>
            </View>
          ) : null}
        </View>
        <T variante="pequeno" cor="rgba(255,255,255,0.85)">
          {anotados} {anotados === 1 ? 'dia anotado por você' : 'dias anotados por você'}; o resto é estimado.
        </T>
        {carregando ? (
          <T variante="pequeno" cor="#ffffff">
            Buscando a estimativa de chuva…
          </T>
        ) : null}
      </LinearGradient>

      {semEstimativa ? <Aviso tipo="atencao">Sem internet: a estimativa automática não foi atualizada. Suas anotações continuam salvas.</Aviso> : null}

      <Cartao>
        <T variante="subtitulo">Quanto choveu no pluviômetro?</T>
        <Linha>
          {atalhos.map(({ dia, rotulo }) => (
            <Chip key={dia} rotulo={rotulo} ativo={data === dia} aoTocar={() => escolherDia(dia)} testID={`dia-${dia}`} />
          ))}
        </Linha>
        {atalhos.every((a) => a.dia !== data) ? <T variante="forte">Dia {formatarData(data)} ({rotuloDia(data, hoje)})</T> : null}
        {anotacao ? <T variante="pequeno">Anotado: {formatarMm(anotacao.mm)}. Digite outro valor para corrigir.</T> : null}
        <Campo rotulo="Milímetros" value={texto} onChangeText={setTexto} keyboardType="decimal-pad" placeholder="Ex.: 12" testID="campo-mm" style={estilos.campoMm} />
        <Linha>
          {RAPIDOS.map((v) => (
            <Chip key={v} rotulo={`${v} mm`} ativo={mm === v} aoTocar={() => setTexto(String(v))} />
          ))}
        </Linha>
        <Botao titulo="Salvar anotação" icone="check" aoTocar={salvar} desabilitado={mm === null} testID="salvar-chuva" />
        {anotacao ? <Botao titulo="Apagar anotação deste dia" tipo="texto" aoTocar={() => anotarChuva(talhao.id, data, null)} /> : null}
      </Cartao>

      <Cartao>
        <CalendarioChuva mes={mes} aoMudarMes={setMes} registros={registros} hoje={hoje} inicioSafra={safra.inicio} selecionado={data} aoSelecionar={escolherDia} />
      </Cartao>

      <Botao titulo="Compartilhar cartão de chuva" icone="whatsapp" aoTocar={() => router.push('/cartao-chuva')} testID="abrir-cartao" />
      <Botao titulo="Ver os últimos 3 meses" tipo="secundario" icone="grafico" aoTocar={() => router.push('/panorama')} testID="chuva-panorama" />
      <Botao titulo={pro ? 'Dossiê do talhão (PDF)' : 'Dossiê do talhão (PDF) · Pro'} tipo="secundario" icone="pdf" aoTocar={() => router.push(pro ? '/dossie' : '/assinatura')} testID="chuva-dossie" />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  capa: { borderRadius: Raio.grande, padding: Spacing.three, gap: Spacing.two },
  capaTopo: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  total: { fontSize: 52, lineHeight: 58 },
  barras: { gap: 6 },
  barraLinha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  rotuloBarra: { width: 104, fontSize: 13 },
  trilha: { flex: 1, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  barra: { height: '100%', borderRadius: 5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chipCapa: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: Raio.total, paddingHorizontal: 10, paddingVertical: 5 },
  campoMm: { fontSize: 28, minHeight: 64 },
});
