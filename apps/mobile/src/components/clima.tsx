import {
  ATRIBUICAO_OPEN_METEO,
  type AvaliacaoHora,
  type Dia,
  descreverTempo,
  formatarHora,
  formatarJanela,
  formatarMm,
  formatarNumero,
  type Hora,
  janelasSecas,
  diaDaSemana,
  resumoPulverizacaoDia,
  riscoGeada,
  riscoTemporal,
  rotuloDia,
  somarHoras,
} from '@graoraiz/clima';
import { StyleSheet, View } from 'react-native';

import { Aviso, Botao, Cartao, Chip, Linha, Selo, T, useCorStatus } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { selecionarTalhao, type Talhao } from '@/lib/estado';

export function SeletorTalhao({ talhoes, selecionado }: { talhoes: Talhao[]; selecionado: Talhao | null }) {
  if (talhoes.length <= 1) return null;
  return (
    <Linha accessibilityLabel="Escolher talhão">
      {talhoes.map((t) => (
        <Chip key={t.id} rotulo={t.nome} ativo={t.id === selecionado?.id} aoTocar={() => selecionarTalhao(t.id)} />
      ))}
    </Linha>
  );
}

const TITULO_PULVERIZACAO = { bom: 'Dá para pulverizar', atencao: 'Pulverizar com cuidado', ruim: 'Não pulverizar' } as const;

function LinhaDia({ rotulo, avaliacoes, data }: { rotulo: string; avaliacoes: AvaliacaoHora[]; data: string }) {
  const resumo = resumoPulverizacaoDia(avaliacoes, data);
  const cor = useCorStatus(resumo.status);
  const janela = resumo.melhorJanela ?? resumo.janelas[0] ?? null;
  const temHoras = avaliacoes.some((a) => a.hora.startsWith(data));
  return (
    <View style={[estilos.linhaDia, { borderLeftColor: cor }]} testID={`pulverizacao-${rotulo}`}>
      <T variante="pequeno">{rotulo}</T>
      {temHoras ? (
        <>
          <T variante="subtitulo" cor={cor}>
            {TITULO_PULVERIZACAO[resumo.status]}
          </T>
          {janela ? <T variante="forte">Melhor horário: {formatarJanela(janela)}</T> : null}
          {resumo.motivoPrincipal ? <T>Motivo: {resumo.motivoPrincipal}.</T> : null}
        </>
      ) : (
        <T>Sem mais horas para avaliar hoje.</T>
      )}
    </View>
  );
}

export function CartaoPulverizacao({
  avaliacoes,
  hoje,
  amanha,
  aoVerDetalhes,
}: {
  avaliacoes: AvaliacaoHora[];
  hoje: string;
  amanha: string;
  aoVerDetalhes: () => void;
}) {
  return (
    <Cartao>
      <T variante="subtitulo">Pulverização</T>
      <LinhaDia rotulo="Hoje (a partir de agora)" avaliacoes={avaliacoes} data={hoje} />
      <LinhaDia rotulo="Amanhã" avaliacoes={avaliacoes} data={amanha} />
      <Botao titulo="Ver hora a hora" tipo="secundario" aoTocar={aoVerDetalhes} testID="ver-hora-a-hora" />
    </Cartao>
  );
}

export function CartaoTempoFirme({ dias, hoje }: { dias: Dia[]; hoje: string }) {
  const tema = useTheme();
  const janela = janelasSecas(dias.filter((d) => d.data >= hoje))[0];
  return (
    <Cartao>
      <T variante="subtitulo">Colheita e máquinas</T>
      {janela ? (
        <>
          <T variante="forte" cor={tema.bom}>
            Tempo firme de {rotuloDia(janela.inicio, hoje)} a {rotuloDia(janela.fim, hoje)} ({janela.dias} dias)
          </T>
          <T>Boa janela para colher ou entrar com máquina.</T>
        </>
      ) : (
        <T>Sem janela de tempo firme (2 dias seguidos sem chuva) nos próximos 7 dias.</T>
      )}
    </Cartao>
  );
}

export function AlertasTempo({ dias, horas, hoje, agora }: { dias: Dia[]; horas: Hora[]; hoje: string; agora: string }) {
  const geadas = dias.filter((d) => d.data >= hoje).slice(0, 3).map((d) => ({ dia: d, risco: riscoGeada(d) })).filter((g) => g.risco);
  const proximas = horas.filter((h) => h.hora >= agora.slice(0, 13) + ':00' && h.hora <= somarHoras(agora, 48));
  const temporal = riscoTemporal(proximas)[0];
  if (geadas.length === 0 && !temporal) return null;
  return (
    <View style={estilos.alertas}>
      {temporal ? (
        <Aviso tipo="ruim" titulo="Risco de temporal">
          {`${temporal.motivos.join(', ')} por volta das ${formatarHora(temporal.hora)} de ${rotuloDia(temporal.hora.slice(0, 10), hoje)}.`}
        </Aviso>
      ) : null}
      {geadas.map(({ dia, risco }) => (
        <Aviso key={dia.data} tipo={risco === 'alto' ? 'ruim' : 'atencao'} titulo={risco === 'alto' ? 'Risco alto de geada' : 'Risco de geada'}>
          {`Mínima de ${Math.round(dia.tMin)} °C na madrugada de ${rotuloDia(dia.data, hoje)}.`}
        </Aviso>
      ))}
    </View>
  );
}

export function PrevisaoSemana({ dias, hoje }: { dias: Dia[]; hoje: string }) {
  const tema = useTheme();
  const futuros = dias.filter((d) => d.data >= hoje).slice(0, 7);
  return (
    <Cartao>
      <T variante="subtitulo">Próximos 7 dias</T>
      {futuros.map((d) => (
        <View key={d.data} style={estilos.dia} accessible accessibilityLabel={`${rotuloDia(d.data, hoje)}: ${descreverTempo(d.codigoTempo)}, chuva ${formatarMm(d.chuva)}, máxima ${Math.round(d.tMax)}, mínima ${Math.round(d.tMin)} graus`}>
          <View style={estilos.diaNome}>
            <T variante="forte">{d.data === hoje ? 'Hoje' : diaDaSemana(d.data, true)}</T>
            <T variante="pequeno">{descreverTempo(d.codigoTempo)}</T>
          </View>
          <View style={estilos.diaChuva}>
            <T variante="forte" cor={d.chuva >= 1 ? tema.marca : tema.textSecondary}>
              {formatarMm(d.chuva)}
            </T>
            {d.probChuva !== null ? <T variante="pequeno">{d.probChuva}%</T> : null}
          </View>
          <T variante="forte" style={estilos.diaTemp}>
            {Math.round(d.tMax)}° / {Math.round(d.tMin)}°
          </T>
        </View>
      ))}
    </Cartao>
  );
}

export function FaixaHora({ avaliacao, bloqueada = false }: { avaliacao: AvaliacaoHora; bloqueada?: boolean }) {
  const cor = useCorStatus(avaliacao.status);
  return (
    <View style={[estilos.hora, { borderLeftColor: cor, opacity: bloqueada ? 0.35 : 1 }]} testID={`hora-${avaliacao.hora}`}>
      <Linha style={estilos.horaTopo}>
        <T variante="forte">{formatarHora(avaliacao.hora)}</T>
        <Selo status={avaliacao.status} />
      </Linha>
      {bloqueada ? null : (
        <>
          <T variante="pequeno">
            Vento na barra {Math.round(avaliacao.vento2m)} km/h · rajada {Math.round(avaliacao.rajada2m)} km/h · ΔT {formatarNumero(avaliacao.deltaT, 1)} °C
          </T>
          {avaliacao.motivos.length > 0 ? <T>{avaliacao.motivos.map((m) => m.texto).join('; ')}</T> : null}
        </>
      )}
    </View>
  );
}

export function RodapeFonte({ em, desatualizado }: { em?: number; desatualizado?: boolean }) {
  const tema = useTheme();
  const quando = em ? new Date(em) : null;
  return (
    <View style={estilos.rodape}>
      {quando ? (
        <T variante="pequeno" cor={desatualizado ? tema.atencao : tema.textSecondary}>
          {desatualizado ? 'Sem internet — mostrando a previsão de ' : 'Atualizado às '}
          {`${String(quando.getHours()).padStart(2, '0')}:${String(quando.getMinutes()).padStart(2, '0')}`}
          {desatualizado ? ` de ${String(quando.getDate()).padStart(2, '0')}/${String(quando.getMonth() + 1).padStart(2, '0')}` : ''}.
        </T>
      ) : null}
      <T variante="pequeno">Estimativa a partir de modelos meteorológicos. Confira as condições no local.</T>
      <T variante="pequeno">{ATRIBUICAO_OPEN_METEO}</T>
    </View>
  );
}

const estilos = StyleSheet.create({
  linhaDia: { borderLeftWidth: 6, borderRadius: 4, paddingLeft: Spacing.three, paddingVertical: Spacing.one, gap: 2 },
  alertas: { gap: Spacing.two },
  dia: { flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: Spacing.two },
  diaNome: { flex: 1 },
  diaChuva: { width: 76, alignItems: 'flex-end' },
  diaTemp: { width: 84, textAlign: 'right' },
  hora: { borderLeftWidth: 6, borderRadius: 4, paddingLeft: Spacing.three, paddingVertical: Spacing.two, gap: 2 },
  horaTopo: { justifyContent: 'space-between' },
  rodape: { gap: Spacing.one, paddingTop: Spacing.two },
});
