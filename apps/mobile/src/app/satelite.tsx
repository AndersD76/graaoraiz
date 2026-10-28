import { CULTURAS, dataDe, diasEntre, formatarData, formatarNumero, isoLocal, quadradoEmVolta } from '@graoraiz/clima';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { GraficoVigor } from '@/components/graficos';
import { Icone } from '@/components/icone';
import { type ControleMapa, MapaBase } from '@/components/mapa-base';
import { Aviso, Botao, Cartao, Carregando, Chip, Linha, Secao, T, Tela } from '@/components/ui';
import { MaxContentWidth, Raio, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useVigor } from '@/hooks/use-vigor';
import { type Talhao, talhaoAtual, useEstado, usePro } from '@/lib/estado';
import { ATRIBUICAO_SATELITE, type Cena, cenasRecentes, type ModoSatelite, urlBlocos } from '@/lib/satelite';

/** "foto": imagem de alta resolução (Esri, sem data); "real" e "vigor": a passagem escolhida do Sentinel-2 (10 m). */
type ModoTela = 'foto' | ModoSatelite;

/** Fase da lavoura pela data de plantio e o ciclo da cultura: explica quedas e altas normais do vigor. */
function faseDaLavoura(t: Talhao): { dias: number; texto: string } | null {
  if (!t.cultura || !t.dataPlantio) return null;
  const ciclo = CULTURAS[t.cultura].cicloDias;
  const dias = diasEntre(t.dataPlantio, dataDe(isoLocal(new Date())));
  const nome = CULTURAS[t.cultura].rotulo.toLowerCase();
  if (dias < 0) return null;
  if (dias < 25) return { dias, texto: `A ${nome} tem ${dias} dias: o satélite ainda vê mais solo do que planta, e o vigor é baixo mesmo em lavoura boa.` };
  if (ciclo && dias >= ciclo * 0.8) return { dias, texto: `A ${nome} tem ${dias} dias, fim do ciclo: o vigor cai porque a lavoura está secando para a colheita. Queda agora é esperada; preocupa se vier em mancha.` };
  if (ciclo && dias < ciclo * 0.45) return { dias, texto: `A ${nome} tem ${dias} dias, em crescimento: o normal é o vigor subir a cada passagem. Queda nessa fase pede uma ida ao campo.` };
  return { dias, texto: `A ${nome} tem ${dias} dias, perto do auge: o vigor deve ficar alto e estável. Queda forte agora pede uma ida ao campo.` };
}

export default function SateliteScreen() {
  const router = useRouter();
  const tema = useTheme();
  const estado = useEstado();
  const pro = usePro();
  const talhao = talhaoAtual(estado);
  const { width } = useWindowDimensions();
  const mapa = useRef<ControleMapa>(null);
  const [cenas, setCenas] = useState<{ talhaoId: string; lista: Cena[] } | { talhaoId: string; erro: string } | null>(null);
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const [modo, setModo] = useState<ModoTela>('foto');
  const { serie, carregando: carregandoVigor, erro: erroVigor } = useVigor(pro ? talhao : null, 10);

  useEffect(() => {
    if (!talhao) return;
    let ativo = true;
    cenasRecentes(talhao).then(
      (lista) => ativo && setCenas({ talhaoId: talhao.id, lista }),
      (e) => ativo && setCenas({ talhaoId: talhao.id, erro: e instanceof Error ? e.message : 'Sem imagens agora.' }),
    );
    return () => {
      ativo = false;
    };
  }, [talhao]);

  const atuais = cenas && talhao && cenas.talhaoId === talhao.id ? cenas : null;
  const lista = atuais && 'lista' in atuais ? atuais.lista : [];
  // Passagens limpas: as que o vigor confirmou sem nuvem no talhão; senão, as de pouca nuvem na cena.
  const limpasVigor = new Set((serie ?? []).map((v) => v.cenaId));
  const limpas = lista.filter((c) => limpasVigor.has(c.id) || c.nuvensCena < 25).slice(0, 12);
  const cena = limpas.find((c) => c.id === escolhida) ?? limpas[0] ?? null;
  const modoEfetivo: ModoTela = pro || modo !== 'vigor' ? modo : 'foto';
  const cenaId = cena?.id ?? null;

  // Troca só a camada de imagem; o mapa e o contorno continuam onde estão. Na foto, só a base de alta resolução.
  const camada = cenaId && modoEfetivo !== 'foto' ? urlBlocos(cenaId, modoEfetivo) : null;
  useEffect(() => {
    mapa.current?.enviar({ camada });
  }, [camada]);

  if (!talhao) return null;
  const contorno = talhao.contorno ?? quadradoEmVolta(talhao.lat, talhao.lon, talhao.areaHa ?? 16);
  const ultimo = serie?.at(-1);
  const anterior = serie && serie.length > 1 ? serie[serie.length - 2] : undefined;
  const larguraGrafico = Math.min(width, MaxContentWidth) - Spacing.three * 4;
  const fase = faseDaLavoura(talhao);

  return (
    <Tela comAbas={false} cabecalhoNativo>
      <View style={estilos.cabecalho}>
        <T variante="titulo">{talhao.nome}</T>
        <T variante="pequeno">
          {modoEfetivo === 'foto'
            ? 'Foto de satélite em alta resolução (a data da foto varia por região)'
            : cena
              ? `Passagem do Sentinel-2 de ${formatarData(cena.data)}/${cena.data.slice(0, 4)}`
              : 'Imagens do satélite Sentinel-2'}
        </T>
      </View>

      <View>
        <MapaBase
          controle={mapa}
          inicial={{ lat: talhao.lat, lon: talhao.lon }}
          opcoes={{ modo: 'ver', contorno, camada }}
          altura={360}
          aoMensagem={() => undefined}
          rotulo="Imagem de satélite do talhão"
          creditoExtra={modoEfetivo === 'foto' ? null : 'Copernicus Sentinel-2'}
        />
        {modoEfetivo === 'vigor' ? (
          <View style={[estilos.legenda, { backgroundColor: tema.backgroundElement }]}>
            <T variante="pequeno" style={estilos.textoLegenda}>
              Baixo
            </T>
            <LinearGradient colors={['#d7191c', '#fdae61', '#ffffbf', '#a6d96a', '#1a9641']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={estilos.escala} />
            <T variante="pequeno" style={estilos.textoLegenda}>
              Alto
            </T>
          </View>
        ) : null}
      </View>

      <Linha>
        <Chip rotulo="Foto em alta" icone="olho" ativo={modoEfetivo === 'foto'} aoTocar={() => setModo('foto')} testID="modo-foto" />
        <Chip rotulo="Última passagem" icone="calendario" ativo={modoEfetivo === 'real'} aoTocar={() => setModo('real')} testID="modo-real" />
        <Chip rotulo={pro ? 'Vigor da lavoura' : 'Vigor · Pro'} icone={pro ? 'folha' : 'cadeado'} ativo={modoEfetivo === 'vigor'} aoTocar={() => (pro ? setModo('vigor') : router.push('/assinatura'))} testID="modo-vigor" />
      </Linha>

      {!atuais ? <Carregando texto="Procurando as passagens do satélite…" /> : null}
      {atuais && 'erro' in atuais ? <Aviso tipo="atencao" titulo="Sem imagens agora">{atuais.erro}</Aviso> : null}
      {atuais && 'lista' in atuais && limpas.length === 0 ? (
        <Aviso tipo="atencao" titulo="Só imagens com nuvem">Nos últimos meses as passagens sobre o talhão vieram encobertas. O satélite volta a cada 5 dias.</Aviso>
      ) : null}

      {limpas.length > 0 && modoEfetivo !== 'foto' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.datas}>
          {limpas.map((c) => (
            <Chip key={c.id} rotulo={formatarData(c.data)} ativo={c.id === cena?.id} aoTocar={() => setEscolhida(c.id)} testID={`cena-${c.data}`} />
          ))}
        </ScrollView>
      ) : null}

      <Secao titulo="Vigor do talhão" />
      {pro ? (
        <Cartao>
          {carregandoVigor ? <Carregando texto="Medindo o vigor em cada passagem…" /> : null}
          {erroVigor ? <T variante="pequeno">{erroVigor}</T> : null}
          {ultimo ? (
            <>
              <Linha style={estilos.resumo}>
                <View style={estilos.flex}>
                  <T variante="rotulo">Vigor médio</T>
                  <T variante="numero" cor={tema.bom} testID="vigor-medio">
                    {formatarNumero(ultimo.media, 2)}
                  </T>
                </View>
                {anterior ? (
                  <View style={estilos.variacao}>
                    <Icone nome={ultimo.media >= anterior.media ? 'tendencia' : 'tendenciaBaixa'} tamanho={22} cor={ultimo.media >= anterior.media ? tema.bom : tema.ruim} />
                    <T variante="forte" cor={ultimo.media >= anterior.media ? tema.bom : tema.ruim}>
                      {ultimo.media >= anterior.media ? '+' : ''}
                      {formatarNumero(ultimo.media - anterior.media, 2)}
                    </T>
                    <T variante="pequeno">desde {formatarData(anterior.data)}</T>
                  </View>
                ) : null}
              </Linha>
              <GraficoVigor pontos={(serie ?? []).map((v) => ({ data: v.data, valor: v.media }))} largura={larguraGrafico} />
              {fase ? (
                <Aviso tipo="info" titulo="Fase da lavoura" icone="calendario">
                  {fase.texto}
                </Aviso>
              ) : null}
              {ultimo.baixo >= 0.05 ? (
                <Aviso tipo="atencao" titulo={`${Math.round(ultimo.baixo * 100)}% do talhão com vigor abaixo do resto`}>
                  {`${talhao.areaHa ? `Cerca de ${formatarNumero(talhao.areaHa * ultimo.baixo, 1)} ha. ` : ''}Veja as manchas vermelhas no mapa de vigor e confira no campo: falha de plantio, praga, doença, encharcamento ou compactação.`}
                </Aviso>
              ) : (
                <Aviso tipo="bom" titulo="Lavoura uniforme">Nenhuma mancha relevante de vigor baixo na última imagem limpa.</Aviso>
              )}
            </>
          ) : !carregandoVigor && !erroVigor ? (
            <T variante="pequeno">Ainda sem passagem limpa para medir o vigor.</T>
          ) : null}
        </Cartao>
      ) : (
        <Cartao tom="destaque">
          <T variante="forte">Veja onde a lavoura está fraca antes de rodar a área toda</T>
          <T variante="pequeno">Com o Pro: mapa de vigor de cada passagem, a curva do talhão ao longo da safra e o tamanho das manchas de vigor baixo.</T>
          <Botao titulo="Conhecer o Pro" icone="coroa" aoTocar={() => router.push('/assinatura')} testID="satelite-pro" />
        </Cartao>
      )}

      <Cartao>
        <T variante="forte">Como ler</T>
        <T variante="pequeno">
          O vigor (NDVI) mede o verde ativo das plantas: solo exposto fica perto de 0,1; lavoura fechada e sadia passa de 0,7. Queda de uma passagem para outra, ou manchas, pedem uma ida ao campo.
        </T>
        <T variante="pequeno" cor={tema.textSecondary}>
          {ATRIBUICAO_SATELITE}. Resolução de 10 m; nuvens escondem a lavoura.
        </T>
      </Cartao>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { gap: 2 },
  legenda: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Raio.medio,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textoLegenda: { fontSize: 12 },
  escala: { flex: 1, height: 8, borderRadius: 4 },
  datas: { gap: Spacing.two },
  resumo: { alignItems: 'flex-end' },
  flex: { flex: 1 },
  variacao: { alignItems: 'flex-end', gap: 2 },
});
