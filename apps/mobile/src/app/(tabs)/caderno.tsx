import {
  type Aplicacao,
  dataDe,
  formatarData,
  formatarMm,
  formatarNumero,
  nomeEvento,
  PRODUTOS,
  prazoComunicacao,
  protecaoAtual,
  safraDe,
  verificarLavagem,
} from '@graoraiz/clima';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { SeletorTalhao } from '@/components/clima';
import { Icone, Ilustracao, type NomeIcone } from '@/components/icone';
import { Botao, Cartao, Medalha, Secao, Selo, T, Tela } from '@/components/ui';
import { Raio, Spacing } from '@/constants/theme';
import { useAgora } from '@/hooks/use-agora';
import { useChuvaSafra } from '@/hooks/use-chuva-safra';
import { usePrevisao } from '@/hooks/use-previsao';
import { useTheme } from '@/hooks/use-theme';
import { confirmar } from '@/lib/dialogo';
import { type EventoRegistrado, removerAplicacao, removerEvento, talhaoAtual, TIPOS_OCORRENCIA, useEstado, usePro } from '@/lib/estado';
import { eventosDoTalhao } from '@/lib/eventos-talhao';
import { apagarFoto } from '@/lib/fotos';

const ICONE_PRODUTO: Record<Aplicacao['tipo'], NomeIcone> = { fungicida: 'escudo', inseticida: 'praga', herbicida: 'folha', foliar: 'gota', outro: 'pulverizador' };
const TEXTO_LAVAGEM = { aguardando: 'Aguardando o prazo sem chuva', segura: 'Sem chuva no prazo', risco: 'Risco de chuva no prazo', lavou: 'Chuva no prazo: pode ter lavado', semDados: '' } as const;

type Item = { tipo: 'aplicacao'; quando: string; a: Aplicacao } | { tipo: 'ocorrencia'; quando: string; o: EventoRegistrado };

export default function CadernoScreen() {
  const router = useRouter();
  const tema = useTheme();
  const estado = useEstado();
  const pro = usePro();
  const agora = useAgora();
  const hoje = dataDe(agora);
  const talhao = talhaoAtual(estado);
  const { resultado } = usePrevisao(talhao?.lat, talhao?.lon);
  const { diario, carregando } = useChuvaSafra(talhao, hoje);

  if (!talhao) return null;
  const safra = safraDe(hoje);
  const aplicacoes = estado.aplicacoes.filter((a) => a.talhaoId === talhao.id);
  const ocorrencias = estado.eventos.filter((e) => e.talhaoId === talhao.id);
  const itens: Item[] = [
    ...aplicacoes.map((a): Item => ({ tipo: 'aplicacao', quando: a.quando, a })),
    ...ocorrencias.map((o): Item => ({ tipo: 'ocorrencia', quando: o.registradaEm ?? `${o.data}T12:00`, o })),
  ].sort((x, y) => y.quando.localeCompare(x.quando));
  const eventos = eventosDoTalhao(diario, talhao).reverse();
  const protecao = protecaoAtual(aplicacoes, hoje);

  const excluirAplicacao = async (a: Aplicacao) => {
    if (await confirmar('Apagar aplicação', `Tirar "${a.produto}" de ${formatarData(dataDe(a.quando))} do caderno?`, 'Apagar')) removerAplicacao(a.id);
  };
  const excluirOcorrencia = async (o: EventoRegistrado) => {
    if (!(await confirmar('Apagar ocorrência', 'Apagar o registro e as fotos dele?', 'Apagar'))) return;
    o.fotos.forEach((f) => void apagarFoto(f));
    removerEvento(o.id);
  };

  return (
    <Tela titulo="Caderno" subtitulo={`Safra ${safra.rotulo} · ${talhao.nome}`}>
      <SeletorTalhao selecionado={talhao} />

      <Botao titulo="Apliquei agora" icone="pulverizador" aoTocar={() => router.push('/aplicacao')} testID="caderno-aplicacao" />
      <Botao titulo="Registrar ocorrência com foto" tipo="secundario" icone="camera" aoTocar={() => router.push('/ocorrencia')} testID="caderno-ocorrencia" />

      <Pressable onPress={() => router.push(pro ? '/dossie' : '/assinatura')} accessibilityRole="button" testID="abrir-dossie">
        <Cartao tom="marca" style={estilos.dossie}>
          <Ilustracao nome="page_facing_up" tamanho={52} />
          <View style={estilos.flex}>
            <T variante="forte">Dossiê do talhão{pro ? '' : ' · Pro'}</T>
            <T variante="pequeno" cor={tema.text}>
              Clima da safra, eventos, fotos e aplicações num PDF para o banco, a seguradora ou o agrônomo.
            </T>
          </View>
          <Icone nome="direita" tamanho={20} cor={tema.marca} />
        </Cartao>
      </Pressable>

      <Secao titulo="Eventos do clima" />
      {carregando ? <T variante="pequeno">Lendo o diário do clima da safra…</T> : null}
      {!carregando && eventos.length === 0 ? (
        <Cartao>
          <T variante="pequeno">Nenhum veranico, geada, excesso de chuva ou vendaval {talhao.dataPlantio ? 'desde o plantio' : 'na safra'}. O vigia confere todo dia.</T>
        </Cartao>
      ) : null}
      {eventos.map((e) => {
        const prazo = prazoComunicacao(e, estado.seguro.prazoDias, hoje);
        return (
          <Cartao key={e.id} tom={e.gravidade === 'severo' ? 'ruim' : 'atencao'} testID={`evento-${e.tipo}`}>
            <View style={estilos.linhaTopo}>
              <T variante="forte" style={estilos.flex}>
                {e.titulo}
              </T>
              <Selo status={e.gravidade === 'severo' ? 'ruim' : 'atencao'} texto={nomeEvento(e.tipo)} />
            </View>
            <T variante="pequeno" cor={tema.text}>
              {e.detalhe}
            </T>
            <T variante="pequeno" cor={tema.text}>
              {prazo
                ? prazo.diasRestantes >= 0
                  ? `Se houve perda, comunique até ${formatarData(prazo.ate)} (${prazo.diasRestantes} ${prazo.diasRestantes === 1 ? 'dia' : 'dias'}).`
                  : `O prazo do contrato para comunicar terminou em ${formatarData(prazo.ate)}.`
                : 'Se houve perda, comunique o banco ou a seguradora o quanto antes (informe o prazo do contrato em Ajustes).'}
            </T>
          </Cartao>
        );
      })}

      {protecao ? (
        <Cartao>
          <View style={estilos.linhaTopo}>
            <Medalha icone="escudo" cor={protecao.diasRestantes > 2 ? tema.bom : tema.atencao} fundo={protecao.diasRestantes > 2 ? tema.bomSuave : tema.atencaoSuave} />
            <View style={estilos.flex}>
              <T variante="forte">{protecao.diasRestantes >= 0 ? `Proteção do fungicida: ${protecao.diasRestantes} ${protecao.diasRestantes === 1 ? 'dia' : 'dias'}` : 'Proteção do fungicida vencida'}</T>
              <T variante="pequeno">
                {protecao.produto} · vence em {formatarData(protecao.vence)}
              </T>
            </View>
          </View>
        </Cartao>
      ) : null}

      <Secao titulo="Registros" />
      {itens.length === 0 ? (
        <Cartao style={estilos.vazio}>
          <Ilustracao nome="open_book" tamanho={80} />
          <T variante="forte">Caderno em branco</T>
          <T variante="pequeno" style={estilos.centro}>
            Toque em “Apliquei agora” ao terminar uma aplicação: o app guarda o produto e o tempo daquela hora. Ocorrências com foto viram prova.
          </T>
        </Cartao>
      ) : null}
      {itens.map((item) => {
        if (item.tipo === 'aplicacao') {
          const a = item.a;
          const lavagem = resultado ? verificarLavagem(a, resultado.dados.horas, agora) : null;
          return (
            <Cartao key={`a-${a.id}`} testID="registro-aplicacao">
              <View style={estilos.linhaTopo}>
                <Medalha icone={ICONE_PRODUTO[a.tipo]} cor={tema.marca} fundo={tema.marcaSuave} />
                <View style={estilos.flex}>
                  <T variante="forte">{a.produto}</T>
                  <T variante="pequeno">
                    {PRODUTOS[a.tipo].rotulo} · {formatarData(dataDe(a.quando))} às {a.quando.slice(11, 16)}
                    {a.dose ? ` · ${a.dose}` : ''}
                    {a.areaHa ? ` · ${formatarNumero(a.areaHa, 1)} ha` : ''}
                  </T>
                </View>
                {a.condicoes ? <Selo status={a.condicoes.status} texto={a.condicoes.status === 'bom' ? 'No limite' : a.condicoes.status === 'atencao' ? 'Com cuidado' : 'Fora'} /> : null}
              </View>
              {a.condicoes ? (
                <T variante="pequeno">
                  {formatarNumero(a.condicoes.temperatura, 0)} °C · UR {formatarNumero(a.condicoes.umidade, 0)}% · vento {formatarNumero(a.condicoes.vento2m, 0)} km/h · ΔT{' '}
                  {formatarNumero(a.condicoes.deltaT, 1)}
                </T>
              ) : null}
              {lavagem && lavagem.situacao !== 'semDados' && pro ? (
                <View style={estilos.lavagem}>
                  <Icone
                    nome={lavagem.situacao === 'lavou' ? 'alertaCirculo' : lavagem.situacao === 'risco' ? 'alerta' : 'ok'}
                    tamanho={16}
                    cor={lavagem.situacao === 'lavou' ? tema.ruim : lavagem.situacao === 'risco' ? tema.atencao : tema.bom}
                  />
                  <T variante="pequeno">
                    {TEXTO_LAVAGEM[lavagem.situacao]}
                    {lavagem.mm >= 0.1 ? ` (${formatarMm(lavagem.mm)})` : ''}
                  </T>
                </View>
              ) : null}
              <View style={estilos.apagar}>
                <Botao titulo="Apagar" tipo="texto" compacto icone="lixeira" aoTocar={() => excluirAplicacao(a)} />
              </View>
            </Cartao>
          );
        }
        const o = item.o;
        return (
          <Cartao key={`o-${o.id}`} testID="registro-ocorrencia">
            <View style={estilos.linhaTopo}>
              <Medalha icone="camera" cor={tema.atencao} fundo={tema.atencaoSuave} />
              <View style={estilos.flex}>
                <T variante="forte">{TIPOS_OCORRENCIA.find((t) => t.valor === o.tipo)?.rotulo}</T>
                <T variante="pequeno">
                  {formatarData(o.data)}
                  {o.local ? ' · com local' : ''}
                  {o.fotos.length ? ` · ${o.fotos.length} ${o.fotos.length === 1 ? 'foto' : 'fotos'}` : ''}
                </T>
              </View>
              {o.comunicadoEm ? <Selo status="bom" texto="Comunicado" /> : null}
            </View>
            {o.nota ? <T variante="pequeno">{o.nota}</T> : null}
            {o.fotos.length ? (
              <View style={estilos.fotos}>
                {o.fotos.slice(0, 4).map((f) => (
                  <Image key={f} source={{ uri: f }} style={estilos.foto} contentFit="cover" />
                ))}
              </View>
            ) : null}
            <View style={estilos.apagar}>
              <Botao titulo="Apagar" tipo="texto" compacto icone="lixeira" aoTocar={() => excluirOcorrencia(o)} />
            </View>
          </Cartao>
        );
      })}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  dossie: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  linhaTopo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  vazio: { alignItems: 'center', paddingVertical: Spacing.four },
  centro: { textAlign: 'center' },
  lavagem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fotos: { flexDirection: 'row', gap: 6 },
  foto: { width: 64, height: 64, borderRadius: Raio.pequeno },
  apagar: { alignItems: 'flex-end', marginBottom: -8 },
});
