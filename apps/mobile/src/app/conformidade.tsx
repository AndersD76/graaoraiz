import {
  arquivoEudr,
  type Avaliacao,
  avaliarCredito,
  avaliarEudr,
  formatarData,
  formatarNumero,
  FONTES_CONFORMIDADE,
  isoLocal,
  MARCO_EUDR,
  montarFichaConformidadeHtml,
  rotuloSituacaoCar,
  type Status,
  type Veredito,
} from '@graoraiz/clima';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icone } from '@/components/icone';
import { type ControleMapa, MapaBase } from '@/components/mapa-base';
import { Aviso, Botao, Campo, Cartao, Carregando, LinhaInfo, Secao, Selo, T, Tela } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { SERVIDOR_URL } from '@/lib/config';
import { useConformidade } from '@/lib/conformidade';
import { informar } from '@/lib/dialogo';
import { salvarDocumentoProdutor, talhaoAtual, talhoesLiberados, useEstado } from '@/lib/estado';
import { compartilharArquivo, compartilharPdf } from '@/lib/exportar';
import type { Realce } from '@/lib/pagina-mapa';

const STATUS: Record<Veredito, Status> = { livre: 'bom', atencao: 'ruim', conferir: 'atencao', inconclusivo: 'atencao' };
const SELO: Record<Veredito, string> = { livre: 'Livre', atencao: 'Atenção', conferir: 'Conferir', inconclusivo: 'Incompleta' };

function nomeDeArquivo(nome: string): string {
  return (
    nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'talhao'
  );
}

function ha(n: number): string {
  return `${formatarNumero(n, n < 10 ? 2 : 1)} ha`;
}

function CartaoVeredito({ rotulo, avaliacao, testID, children }: { rotulo: string; avaliacao: Avaliacao; testID: string; children?: React.ReactNode }) {
  return (
    <Cartao testID={testID}>
      <View style={estilos.topoVeredito}>
        <T variante="rotulo" style={estilos.flex}>
          {rotulo}
        </T>
        <Selo status={STATUS[avaliacao.veredito]} texto={SELO[avaliacao.veredito]} />
      </View>
      <T variante="subtitulo">{avaliacao.titulo}</T>
      <T variante="pequeno">{avaliacao.texto}</T>
      {children}
    </Cartao>
  );
}

/** EUDR e crédito rural: o talhão cruzado com o desmatamento do PRODES (INPE) e o imóvel do CAR. */
export default function ConformidadeScreen() {
  const router = useRouter();
  const tema = useTheme();
  const estado = useEstado();
  const talhao = talhaoAtual(estado);
  const mapa = useRef<ControleMapa>(null);
  const contorno = talhao?.contorno && talhao.contorno.length >= 3 ? talhao.contorno : null;
  const { resultado, carregando, erro, desatualizado, atualizar } = useConformidade(contorno);
  const [documento, setDocumento] = useState(estado.documentoProdutor);
  const [gerando, setGerando] = useState<'pdf' | 'arquivo' | 'todos' | null>(null);

  const eudr = resultado ? avaliarEudr(resultado) : null;
  const credito = resultado ? avaliarCredito(resultado) : null;
  const imovel = credito?.imovel ?? null;

  const realces = useMemo((): Realce[] | null => {
    if (!resultado) return null;
    const principal = [...resultado.imoveis].sort((a, b) => b.sobreposicaoHa - a.sobreposicaoHa)[0];
    return [
      ...(principal ? [{ tipo: 'imovel' as const, anel: principal.contorno }] : []),
      ...(principal?.desmatamento ?? []).flatMap((d) => d.partes.map((anel) => ({ tipo: 'desmatamento' as const, anel }))),
      ...resultado.desmatamentoTalhao.flatMap((d) => d.partes.map((anel) => ({ tipo: 'desmatamento' as const, anel }))),
    ];
  }, [resultado]);

  useEffect(() => {
    if (realces) mapa.current?.enviar({ realces, enquadrar: true });
  }, [realces]);

  if (!talhao) return null;

  // Cada polígono do PRODES uma vez: a área no imóvel (crédito) e a parte dentro do talhão (EUDR).
  const descrever = (i: { ano: number; dataImagem: string | null; bioma: string }) =>
    `PRODES ${i.ano}${i.dataImagem ? ` (imagem de ${formatarData(i.dataImagem)}/${i.dataImagem.slice(0, 4)})` : ''} · ${i.bioma}`;
  const mesmo = (a: { ano: number; dataImagem: string | null; bioma: string }, b: typeof a) => a.ano === b.ano && a.dataImagem === b.dataImagem && a.bioma === b.bioma;
  const linhasDesmatamento =
    eudr && credito
      ? [
          ...credito.itens.map((i) => {
            const noTalhao = eudr.itens.find((e) => mesmo(e, i));
            return { chave: `i-${i.bioma}-${i.ano}-${i.dataImagem}`, grave: i.momento === 'depois' || noTalhao?.momento === 'depois', texto: `${ha(i.areaHa)} no imóvel${noTalhao ? `, ${ha(noTalhao.areaHa)} no talhão` : ''} · ${descrever(i)}` };
          }),
          ...eudr.itens
            .filter((e) => !credito.itens.some((i) => mesmo(e, i)))
            .map((e) => ({ chave: `t-${e.bioma}-${e.ano}-${e.dataImagem}`, grave: e.momento === 'depois', texto: `${ha(e.areaHa)} no talhão · ${descrever(e)}` })),
        ]
      : [];

  const outros = talhoesLiberados(estado).filter((t) => t.contorno && t.contorno.length >= 3);
  const salvarDocumento = () => {
    if (documento.trim() !== estado.documentoProdutor) salvarDocumentoProdutor(documento.trim());
  };

  const exportarArquivo = async (todos: boolean) => {
    salvarDocumento();
    setGerando(todos ? 'todos' : 'arquivo');
    try {
      const lotes = (todos ? outros : [talhao]).map((t) => ({ nome: t.nome, contorno: t.contorno ?? [], areaHa: t.areaHa }));
      const arquivo = arquivoEudr(lotes, estado.produtor);
      if (!arquivo.features.length) throw new Error('Desenhe o contorno do talhão antes de exportar.');
      const nome = todos ? 'eudr-talhoes' : `eudr-${nomeDeArquivo(talhao.nome)}`;
      await compartilharArquivo(JSON.stringify(arquivo), `${nome}.geojson`, 'application/geo+json', 'Arquivo da EUDR');
    } catch (e) {
      informar('Arquivo da EUDR', e instanceof Error ? e.message : 'Não foi possível gerar o arquivo.');
    } finally {
      setGerando(null);
    }
  };

  const gerarFicha = async () => {
    if (!resultado || !contorno) return;
    salvarDocumento();
    setGerando('pdf');
    try {
      const html = montarFichaConformidadeHtml({
        talhao: { nome: talhao.nome, cultura: talhao.cultura, areaHa: talhao.areaHa, contorno },
        produtor: estado.produtor || undefined,
        documento: documento.trim() || undefined,
        resultado,
        geradoEm: isoLocal(new Date()),
      });
      await compartilharPdf(html, `Ficha de conformidade — ${talhao.nome}`);
    } catch (e) {
      informar('Ficha', e instanceof Error ? e.message : 'Não foi possível gerar o PDF.');
    } finally {
      setGerando(null);
    }
  };

  return (
    <Tela comAbas={false} cabecalhoNativo>
      <View style={estilos.cabecalho}>
        <T variante="titulo">{talhao.nome}</T>
        <T variante="pequeno">Desmatamento pelo PRODES (INPE) e imóvel no CAR, com o contorno do talhão.</T>
      </View>

      {!SERVIDOR_URL ? <Aviso tipo="atencao">A checagem precisa do servidor do Grão Raiz, que não está configurado nesta versão.</Aviso> : null}

      {!contorno ? (
        <>
          <Aviso tipo="atencao" titulo="Desenhe o contorno do talhão">
            A EUDR pede o contorno da área de produção (acima de 4 ha), e a checagem do desmatamento usa esse desenho. Toque nos cantos da lavoura no mapa.
          </Aviso>
          <Botao titulo="Desenhar o contorno" icone="mapa" aoTocar={() => router.push({ pathname: '/talhao', params: { id: talhao.id } })} testID="desenhar-contorno" />
        </>
      ) : (
        <>
          <MapaBase
            controle={mapa}
            inicial={{ lat: talhao.lat, lon: talhao.lon }}
            opcoes={{ modo: 'ver', contorno, realces }}
            altura={300}
            aoMensagem={() => undefined}
            rotulo="Mapa do talhão com o imóvel do CAR e o desmatamento mapeado"
            creditoExtra="PRODES/INPE · CAR/SFB"
          />
          <View style={estilos.legenda}>
            {[
              { texto: 'Talhão', estilo: { borderColor: '#FFFFFF', backgroundColor: '#17663A' } },
              { texto: 'Imóvel no CAR', estilo: [estilos.tracejado, { borderColor: '#C99A2E' }] },
              { texto: 'Desmatamento desde 2019', estilo: { borderColor: '#E5372B', backgroundColor: '#E5372B' } },
            ].map((l) => (
              <View key={l.texto} style={estilos.itemLegenda}>
                <View style={[estilos.marca, l.estilo]} />
                <T variante="pequeno">{l.texto}</T>
              </View>
            ))}
          </View>
        </>
      )}

      {contorno && carregando && !resultado ? <Carregando texto="Consultando o PRODES (INPE) e o CAR… pode levar meio minuto." /> : null}
      {erro ? (
        <Aviso tipo="atencao" titulo={desatualizado ? 'Mostrando a última checagem' : 'Checagem não feita'}>
          {erro}
        </Aviso>
      ) : null}
      {erro && !carregando ? <Botao titulo="Tentar de novo" tipo="secundario" icone="atualizar" aoTocar={atualizar} /> : null}

      {resultado && eudr && credito ? (
        <>
          <CartaoVeredito rotulo="Exportação para a Europa (EUDR)" avaliacao={eudr} testID="veredito-eudr">
            <T variante="pequeno" cor={tema.textSecondary}>
              Marco: {formatarData(MARCO_EUDR)}/2020, no talhão. Vale para soja, café e carne vendidos a quem exporta para a UE a partir de 30/12/2026.
            </T>
          </CartaoVeredito>

          <CartaoVeredito rotulo="Crédito rural (Res. CMN 5.268/2025)" avaliacao={credito} testID="veredito-credito">
            <T variante="pequeno" cor={tema.textSecondary}>
              Marco: 31/07/2019, no imóvel inteiro do CAR.{credito.inicio ? ` O banco passa a checar ${credito.inicio.texto}.` : ''}
            </T>
          </CartaoVeredito>

          {imovel ? (
            <>
              <Secao titulo="Imóvel no CAR" />
              <Cartao testID="cartao-car">
                <T variante="forte" selectable>
                  {imovel.codigo}
                </T>
                <LinhaInfo icone="ok" rotulo="Situação" valor={rotuloSituacaoCar(imovel.situacao)} cor={imovel.situacao === 'AT' ? tema.bom : tema.atencao} />
                {imovel.condicao ? <LinhaInfo icone="relogio" rotulo="Análise" valor={imovel.condicao} /> : null}
                <LinhaInfo icone="mapa" rotulo="Município" valor={`${imovel.municipio}/${imovel.uf}`} />
                <LinhaInfo icone="regua" rotulo="Área do imóvel" valor={ha(imovel.areaHa)} />
                {imovel.modulosFiscais !== null ? <LinhaInfo icone="fazenda" rotulo="Módulos fiscais" valor={formatarNumero(imovel.modulosFiscais, 1)} /> : null}
                <LinhaInfo icone="pino" rotulo="Talhão dentro do imóvel" valor={ha(imovel.sobreposicaoHa)} />
                {resultado.imoveis.length > 1 ? (
                  <T variante="pequeno">
                    Outros {resultado.imoveis.length - 1} cadastros do CAR encostam no talhão (divisa ou sobreposição de cadastro). A checagem do crédito usa o imóvel que contém a maior parte dele.
                  </T>
                ) : null}
              </Cartao>
            </>
          ) : null}

          {linhasDesmatamento.length ? (
            <>
              <Secao titulo="Desmatamento mapeado pelo PRODES" />
              <Cartao testID="lista-desmatamento">
                {linhasDesmatamento.map((l) => (
                  <View key={l.chave} style={estilos.item}>
                    <Icone nome="alerta" tamanho={18} cor={l.grave ? tema.ruim : tema.atencao} />
                    <T variante="pequeno" style={estilos.flex}>
                      {l.texto}
                    </T>
                  </View>
                ))}
              </Cartao>
            </>
          ) : null}

          {resultado.falhas.length ? <Aviso tipo="atencao">{`Não responderam agora: ${resultado.falhas.join(', ')}. Consulte de novo mais tarde.`}</Aviso> : null}
          <T variante="pequeno" style={estilos.centro}>
            Consulta de {formatarData(resultado.consultadoEm.slice(0, 10))} às {resultado.consultadoEm.slice(11, 16)}
            {desatualizado ? ' (sem conexão agora)' : ''}
          </T>
          {!carregando ? <Botao titulo="Consultar de novo" tipo="texto" icone="atualizar" aoTocar={atualizar} testID="consultar-de-novo" /> : null}
        </>
      ) : null}

      {contorno ? (
        <>
          <Secao titulo="Para enviar a quem compra" />
          <Cartao>
            <Campo
              rotulo="CPF ou CNPJ do produtor"
              dica="Vai na ficha em PDF. O arquivo da UE leva o nome do produtor (Ajustes) e o país."
              value={documento}
              onChangeText={setDocumento}
              onEndEditing={salvarDocumento}
              keyboardType="numbers-and-punctuation"
              testID="campo-documento"
            />
            <Botao titulo="Exportar arquivo da EUDR" icone="download" aoTocar={() => exportarArquivo(false)} carregando={gerando === 'arquivo'} testID="exportar-eudr" />
            {outros.length > 1 ? (
              <Botao titulo={`Exportar todos os talhões (${outros.length})`} tipo="secundario" icone="download" aoTocar={() => exportarArquivo(true)} carregando={gerando === 'todos'} testID="exportar-eudr-todos" />
            ) : null}
            <Botao titulo="Ficha em PDF" tipo="secundario" icone="pdf" aoTocar={gerarFicha} carregando={gerando === 'pdf'} desabilitado={!resultado} testID="ficha-conformidade" />
            <T variante="pequeno">
              O arquivo (GeoJSON) segue o formato do sistema da EUDR: contorno com 6 casas decimais e país BR. A cooperativa ou a trading anexa na declaração de diligência. A ficha resume a checagem para o banco e para quem compra.
            </T>
          </Cartao>
        </>
      ) : null}

      <Aviso>{`Checagem prévia com dados públicos oficiais, não é certificado nem laudo. O PRODES é anual e não mapeia supressões muito pequenas. ${FONTES_CONFORMIDADE}`}</Aviso>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  cabecalho: { gap: 2 },
  flex: { flex: 1 },
  centro: { textAlign: 'center' },
  topoVeredito: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legenda: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 14, rowGap: 6 },
  itemLegenda: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  marca: { width: 14, height: 14, borderRadius: 3, borderWidth: 2 },
  tracejado: { borderStyle: 'dashed' },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
});
