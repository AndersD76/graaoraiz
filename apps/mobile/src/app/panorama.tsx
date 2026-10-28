import { ATRIBUICAO_OPEN_METEO, dataDe, formatarData, formatarMes, formatarMm, formatarNumero, resumirPanorama } from '@graoraiz/clima';
import { useRouter } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { GraficoPanorama } from '@/components/graficos';
import { Icone } from '@/components/icone';
import { Aviso, Botao, Cartao, Carregando, Secao, T, Tela } from '@/components/ui';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAgora } from '@/hooks/use-agora';
import { usePanorama } from '@/hooks/use-panorama';
import { useTheme } from '@/hooks/use-theme';
import { useVigor } from '@/hooks/use-vigor';
import { talhaoAtual, useEstado, usePro } from '@/lib/estado';
import { eventosDoTalhao } from '@/lib/eventos-talhao';
import { ATRIBUICAO_SATELITE } from '@/lib/satelite';

function Numero({ rotulo, valor, detalhe, cor, testID }: { rotulo: string; valor: string; detalhe?: string; cor?: string; testID?: string }) {
  return (
    <Cartao style={estilos.numero} testID={testID}>
      <T variante="rotulo">{rotulo}</T>
      <T variante="subtitulo" cor={cor}>
        {valor}
      </T>
      {detalhe ? <T variante="pequeno">{detalhe}</T> : null}
    </Cartao>
  );
}

function grau(n: number): string {
  return `${formatarNumero(n, 1)} °C`;
}

/** Os últimos 3 meses do talhão numa tela só: chuva, temperatura, vigor e eventos no mesmo eixo de datas. */
export default function PanoramaScreen() {
  const router = useRouter();
  const tema = useTheme();
  const estado = useEstado();
  const pro = usePro();
  const talhao = talhaoAtual(estado);
  const hoje = dataDe(useAgora());
  const { width } = useWindowDimensions();
  const p = usePanorama(talhao, hoje);
  const { serie, carregando: carregandoVigor } = useVigor(pro ? talhao : null, 16);

  if (!talhao) return null;

  const resumo = resumirPanorama(p.diario);
  const eventos = eventosDoTalhao(p.diario, talhao);
  const vigor = (serie ?? []).filter((v) => v.data >= p.inicio).map((v) => ({ data: v.data, valor: v.media }));
  const diferenca = p.normal && p.normal > 0 ? ((resumo.chuvaTotal - p.normal) * 100) / p.normal : null;
  const largura = Math.min(width, MaxContentWidth) - Spacing.three * 4;
  const vigorInicio = vigor[0];
  const vigorFim = vigor.at(-1);

  return (
    <Tela comAbas={false} cabecalhoNativo>
      <View style={estilos.cabecalho}>
        <T variante="titulo">{talhao.nome}</T>
        <T variante="pequeno">
          {formatarData(p.inicio)}/{p.inicio.slice(0, 4)} a {formatarData(p.fim)}/{p.fim.slice(0, 4)} · últimos 90 dias
        </T>
      </View>

      {p.carregando ? <Carregando texto="Juntando os últimos 3 meses do talhão…" /> : null}
      {p.erro ? <Aviso tipo="atencao" titulo="Sem o diário agora">{p.erro}</Aviso> : null}

      {!p.carregando && p.diario.length ? (
        <>
          <View style={estilos.grade}>
            <Numero
              rotulo="Chuva"
              valor={formatarMm(resumo.chuvaTotal)}
              cor={tema.chuva}
              detalhe={p.normal !== null ? `Média de 30 anos: ${formatarMm(p.normal)}${diferenca !== null ? ` (${diferenca >= 0 ? '+' : ''}${formatarNumero(diferenca, 0)}%)` : ''}` : undefined}
              testID="panorama-chuva"
            />
            <Numero
              rotulo="Dias de chuva"
              valor={String(resumo.diasComChuva)}
              detalhe={resumo.maiorSeca ? `Maior seca: ${resumo.maiorSeca.dias} dias (${formatarData(resumo.maiorSeca.inicio)} a ${formatarData(resumo.maiorSeca.fim)})` : undefined}
            />
            {resumo.minima ? (
              <Numero
                rotulo="Mínima"
                valor={grau(resumo.minima.valor)}
                cor={tema.frio}
                detalhe={`Em ${formatarData(resumo.minima.data)} · ${resumo.diasFrios} ${resumo.diasFrios === 1 ? 'madrugada' : 'madrugadas'} até 3 °C`}
              />
            ) : null}
            {resumo.maxima ? (
              <Numero
                rotulo="Máxima"
                valor={grau(resumo.maxima.valor)}
                cor={tema.destaque}
                detalhe={`Em ${formatarData(resumo.maxima.data)}${resumo.rajada ? ` · rajada de ${Math.round(resumo.rajada.valor)} km/h em ${formatarData(resumo.rajada.data)}` : ''}`}
              />
            ) : null}
          </View>

          <Cartao testID="grafico-panorama">
            <GraficoPanorama
              dias={p.diario}
              vigor={vigor}
              eventos={eventos.map((e) => ({ data: e.inicio, severo: e.gravidade === 'severo' }))}
              inicio={p.inicio}
              fim={p.fim}
              largura={largura}
            />
            <View style={estilos.legenda}>
              {[
                { cor: tema.destaque, texto: 'Máxima' },
                { cor: tema.frio, texto: 'Mínima' },
                { cor: tema.chuva, texto: 'Chuva' },
                ...(vigor.length ? [{ cor: tema.bom, texto: 'Vigor' }] : []),
                ...(eventos.length ? [{ cor: tema.ruim, texto: 'Evento do clima' }] : []),
              ].map((l) => (
                <View key={l.texto} style={estilos.itemLegenda}>
                  <View style={[estilos.ponto, { backgroundColor: l.cor }]} />
                  <T variante="pequeno">{l.texto}</T>
                </View>
              ))}
            </View>
            {pro && carregandoVigor ? <T variante="pequeno">Medindo o vigor em cada passagem do satélite…</T> : null}
            {pro && vigorInicio && vigorFim && vigorInicio !== vigorFim ? (
              <T variante="pequeno">
                Vigor de {formatarNumero(vigorInicio.valor, 2)} ({formatarData(vigorInicio.data)}) para {formatarNumero(vigorFim.valor, 2)} ({formatarData(vigorFim.data)}) em {vigor.length} passagens sem nuvem.
              </T>
            ) : null}
            {!pro ? <Botao titulo="Ver o vigor do satélite no gráfico · Pro" tipo="texto" icone="coroa" aoTocar={() => router.push('/assinatura')} /> : null}
          </Cartao>

          <Secao titulo="Eventos do clima" />
          <Cartao testID="panorama-eventos">
            {eventos.length ? (
              eventos.map((e) => (
                <View key={e.id} style={estilos.evento}>
                  <Icone nome="alerta" tamanho={18} cor={e.gravidade === 'severo' ? tema.ruim : tema.atencao} />
                  <View style={estilos.flex}>
                    <T variante="forte">{e.titulo}</T>
                    <T variante="pequeno">
                      {e.inicio === e.fim ? formatarData(e.inicio) : `${formatarData(e.inicio)} a ${formatarData(e.fim)}`} · {e.detalhe}
                    </T>
                  </View>
                </View>
              ))
            ) : (
              <T variante="pequeno">Nenhuma geada, vendaval, excesso de chuva ou calor forte no período{talhao.dataPlantio ? ' desde o plantio' : ''}.</T>
            )}
          </Cartao>

          <Secao titulo="Mês a mês" />
          <Cartao testID="panorama-meses">
            <View style={estilos.linhaTabela}>
              {['Mês', 'Chuva', 'Dias', 'Mín.', 'Máx.'].map((c) => (
                <T key={c} variante="rotulo" style={estilos.celula}>
                  {c}
                </T>
              ))}
            </View>
            {resumo.meses.map((m) => (
              <View key={m.mes} style={estilos.linhaTabela}>
                <T variante="forte" style={estilos.celula}>
                  {formatarMes(m.mes)}
                </T>
                <T style={estilos.celula}>{formatarMm(m.mm)}</T>
                <T style={estilos.celula}>{m.diasComChuva}</T>
                <T style={estilos.celula}>{m.tMin !== null ? `${formatarNumero(m.tMin, 0)}°` : '—'}</T>
                <T style={estilos.celula}>{m.tMax !== null ? `${formatarNumero(m.tMax, 0)}°` : '—'}</T>
              </View>
            ))}
          </Cartao>

          <T variante="pequeno" style={estilos.centro}>
            {`Chuva: ${p.anotados} ${p.anotados === 1 ? 'dia medido' : 'dias medidos'} no seu pluviômetro, o resto estimado. ${ATRIBUICAO_OPEN_METEO}.${vigor.length ? ` ${ATRIBUICAO_SATELITE}.` : ''}`}
            {p.semInternet ? ' Sem internet: mostrando o último diário salvo.' : ''}
          </T>
        </>
      ) : null}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { gap: 2 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  numero: { flexBasis: '47%', flexGrow: 1, gap: 2 },
  legenda: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  itemLegenda: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ponto: { width: 10, height: 10, borderRadius: 5 },
  evento: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  flex: { flex: 1 },
  linhaTabela: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  celula: { flex: 1 },
  centro: { textAlign: 'center' },
});
