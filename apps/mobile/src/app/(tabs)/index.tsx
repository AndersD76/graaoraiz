import { avaliarSerie, dataDe, diaDaSemana, formatarData } from '@graoraiz/clima';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CapaTempo } from '@/components/capa-tempo';
import { CartaoMercado } from '@/components/cartao-mercado';
import { RodapeFonte, SeletorTalhao } from '@/components/clima';
import { FaixaHoras, ListaDias } from '@/components/graficos';
import { Icone, Ilustracao, type NomeIcone } from '@/components/icone';
import { Aviso, Botao, Cartao, Carregando, Secao, T, Tela } from '@/components/ui';
import { CartaoVigia } from '@/components/vigia';
import { Raio, Spacing } from '@/constants/theme';
import { useAgora } from '@/hooks/use-agora';
import { usePrevisao } from '@/hooks/use-previsao';
import { useTheme } from '@/hooks/use-theme';
import { useVigia } from '@/hooks/use-vigia';
import { reagendarAvisos } from '@/lib/avisos';
import { talhaoAtual, useEstado, usePro } from '@/lib/estado';
import { useMunicipio } from '@/lib/municipio';

const DIAS_GRATIS = 7;

function AcaoRapida({ icone, rotulo, aoTocar, testID }: { icone: NomeIcone; rotulo: string; aoTocar: () => void; testID?: string }) {
  const tema = useTheme();
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      testID={testID}
      style={({ pressed }) => [estilos.acao, { backgroundColor: tema.backgroundElement, borderColor: tema.borda, opacity: pressed ? 0.85 : 1 }]}>
      <View style={[estilos.iconeAcao, { backgroundColor: tema.marcaSuave }]}>
        <Icone nome={icone} tamanho={24} cor={tema.marca} />
      </View>
      <T variante="pequeno" style={estilos.rotuloAcao} numberOfLines={2}>
        {rotulo}
      </T>
    </Pressable>
  );
}

export default function HojeScreen() {
  const router = useRouter();
  const tema = useTheme();
  const estado = useEstado();
  const pro = usePro();
  const agora = useAgora();
  const talhao = talhaoAtual(estado);
  const { resultado, carregando, erro, atualizar } = usePrevisao(talhao?.lat, talhao?.lon);
  const itens = useVigia(talhao, resultado, agora);
  const municipio = useMunicipio(talhao?.lat, talhao?.lon);

  const hoje = dataDe(agora);
  const horaAtual = `${agora.slice(0, 13)}:00`;
  const horas = useMemo(() => resultado?.dados.horas ?? [], [resultado]);
  const dias = useMemo(() => resultado?.dados.dias ?? [], [resultado]);
  const agoraHora = horas.find((h) => h.hora === horaAtual) ?? horas.find((h) => h.hora > horaAtual);
  const diaHoje = dias.find((d) => d.data === hoje);
  const proximas = horas.filter((h) => h.hora >= horaAtual).slice(0, 25);

  const avaliacoes = useMemo(() => avaliarSerie(horas, estado.limiares).filter((a) => a.hora >= horaAtual), [horas, estado.limiares, horaAtual]);
  const futuros = dias.filter((d) => d.data >= hoje);

  const recarregar = async () => {
    await atualizar();
    await reagendarAvisos();
  };

  const topo = (
    <View style={estilos.topo}>
      <Pressable
        onPress={() => router.push('/lavoura')}
        accessibilityRole="button"
        accessibilityLabel={`Talhão ${talhao?.nome ?? ''}${municipio ? `, ${municipio.nome}, ${municipio.uf}` : ''}`}
        style={estilos.talhao}>
        <Icone nome="pino" tamanho={18} cor="#ffffff" />
        <View style={estilos.nomeTalhao}>
          <T variante="forte" cor="#ffffff" numberOfLines={1}>
            {talhao?.nome}
          </T>
          {municipio ? (
            <T variante="pequeno" cor="rgba(255,255,255,0.85)" numberOfLines={1} style={estilos.municipio} testID="municipio-talhao">
              {municipio.nome}, {municipio.uf}
            </T>
          ) : null}
        </View>
        <Icone nome="baixo" tamanho={14} cor="rgba(255,255,255,0.8)" />
      </Pressable>
      <T variante="pequeno" cor="rgba(255,255,255,0.85)" style={estilos.data}>
        {diaDaSemana(hoje, true)}, {formatarData(hoje)}
      </T>
      <Pressable onPress={() => router.push('/boletim')} accessibilityRole="button" accessibilityLabel="Ouvir o boletim" style={estilos.botaoCapa} testID="abrir-boletim">
        <Icone nome="microfone" tamanho={20} cor="#ffffff" />
      </Pressable>
    </View>
  );

  return (
    <Tela semTopo aoAtualizar={recarregar} atualizando={carregando && resultado !== null}>
      {agoraHora ? (
        <CapaTempo hora={agoraHora} dia={diaHoje} topo={topo} />
      ) : (
        <View style={[estilos.capaVazia, { backgroundColor: tema.marca }]}>
          {topo}
          {carregando ? <Carregando texto="Buscando a previsão do seu talhão…" /> : <Ilustracao nome="sun_behind_cloud" tamanho={120} />}
        </View>
      )}

      <SeletorTalhao selecionado={talhao} />

      {!resultado && !carregando && erro ? (
        <>
          <Aviso tipo="atencao" titulo="Não deu para buscar a previsão">
            {`${erro} Quando houver sinal, a última previsão fica salva para usar sem internet.`}
          </Aviso>
          <Botao titulo="Tentar de novo" icone="atualizar" aoTocar={recarregar} />
        </>
      ) : null}

      <View style={estilos.acoes}>
        <AcaoRapida icone="pulverizador" rotulo="Apliquei agora" aoTocar={() => router.push('/aplicacao')} testID="acao-aplicacao" />
        <AcaoRapida icone="gota" rotulo="Choveu" aoTocar={() => router.push('/chuva')} testID="acao-chuva" />
        <AcaoRapida icone="camera" rotulo="Ocorrência" aoTocar={() => router.push('/ocorrencia')} testID="acao-ocorrencia" />
        <AcaoRapida icone="satelite" rotulo="Satélite" aoTocar={() => router.push('/satelite')} testID="acao-satelite" />
      </View>

      {resultado ? (
        <>
          <Secao titulo="O vigia diz" />
          <View style={estilos.lista} testID="vigia">
            {itens.map((item) => (
              <CartaoVigia
                key={item.id}
                item={item}
                bloqueado={item.pro && !pro}
                aoTocar={item.pro && !pro ? () => router.push('/assinatura') : item.categoria === 'pulverizacao' ? () => router.push('/pulverizacao') : undefined}
              />
            ))}
          </View>

          <Botao titulo="Últimos 3 meses: chuva, temperatura e vigor" tipo="secundario" icone="grafico" aoTocar={() => router.push('/panorama')} testID="abrir-panorama" />

          <CartaoMercado cultura={talhao?.cultura ?? null} />

          <Secao titulo="Próximas 24 horas" acao="Pulverização" aoTocarAcao={() => router.push('/pulverizacao')} />
          <Cartao style={estilos.semPadding}>
            <FaixaHoras horas={proximas} avaliacoes={avaliacoes} dias={dias} />
            <View style={estilos.legenda}>
              {(['bom', 'atencao', 'ruim'] as const).map((s) => (
                <View key={s} style={estilos.itemLegenda}>
                  <View style={[estilos.pontoLegenda, { backgroundColor: { bom: tema.bom, atencao: tema.atencao, ruim: tema.ruim }[s] }]} />
                  <T variante="pequeno" style={estilos.textoLegenda}>
                    {{ bom: 'Pode pulverizar', atencao: 'Com cuidado', ruim: 'Não pulverize' }[s]}
                  </T>
                </View>
              ))}
            </View>
          </Cartao>

          <Secao titulo={`Próximos ${pro ? futuros.length : DIAS_GRATIS} dias`} />
          <Cartao>
            <ListaDias dias={pro ? futuros : futuros.slice(0, DIAS_GRATIS)} hoje={hoje} />
            {!pro && futuros.length > DIAS_GRATIS ? (
              <Pressable onPress={() => router.push('/assinatura')} style={[estilos.maisDias, { backgroundColor: tema.destaqueSuave }]} accessibilityRole="button">
                <Icone nome="cadeado" tamanho={18} cor={tema.destaque} />
                <T variante="forte" cor={tema.destaque} style={estilos.flex}>
                  Mais {futuros.length - DIAS_GRATIS} dias de previsão no Pro
                </T>
                <Icone nome="direita" tamanho={16} cor={tema.destaque} />
              </Pressable>
            ) : null}
          </Cartao>
          <RodapeFonte em={resultado.em} desatualizado={resultado.desatualizado} />
        </>
      ) : null}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  talhao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Raio.total,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: '64%',
  },
  nomeTalhao: { flexShrink: 1 },
  municipio: { fontSize: 12, lineHeight: 15 },
  data: { flex: 1, textAlign: 'right' },
  botaoCapa: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  capaVazia: {
    marginHorizontal: -Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
    gap: Spacing.three,
  },
  acoes: { flexDirection: 'row', gap: Spacing.two },
  acao: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 4, borderRadius: Raio.medio + 2, borderWidth: StyleSheet.hairlineWidth },
  iconeAcao: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  rotuloAcao: { fontSize: 12, lineHeight: 15, textAlign: 'center' },
  lista: { gap: Spacing.two },
  semPadding: { paddingHorizontal: 8 },
  legenda: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.three, paddingBottom: 4 },
  itemLegenda: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pontoLegenda: { width: 8, height: 8, borderRadius: 4 },
  textoLegenda: { fontSize: 12 },
  maisDias: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: Raio.medio, marginTop: 4 },
  flex: { flex: 1 },
});
