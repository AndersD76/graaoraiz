import { acumulado, dataDe, formatarMm, montarDossieHtml, safraDe, somarDias, verificarLavagem } from '@graoraiz/clima';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Ilustracao } from '@/components/icone';
import { Aviso, Botao, Cartao, LinhaInfo, T, Tela } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAgora } from '@/hooks/use-agora';
import { useChuvaSafra } from '@/hooks/use-chuva-safra';
import { usePrevisao } from '@/hooks/use-previsao';
import { informar } from '@/lib/dialogo';
import { talhaoAtual, TIPOS_OCORRENCIA, TIPOS_SEGURO, useEstado, usePro } from '@/lib/estado';
import { eventosDoTalhao } from '@/lib/eventos-talhao';
import { compartilharPdf } from '@/lib/exportar';
import { fotoParaHtml } from '@/lib/fotos';

const TEXTO_LAVAGEM = { aguardando: 'Aguardando', segura: 'Sem chuva no prazo', risco: 'Pouca chuva no prazo', lavou: 'Choveu no prazo', semDados: '—' } as const;

/** Dossiê do talhão: o PDF para comunicar perda e para o caderno de campo. */
export default function DossieScreen() {
  const router = useRouter();
  const estado = useEstado();
  const pro = usePro();
  const talhao = talhaoAtual(estado);
  const agora = useAgora();
  const hoje = dataDe(agora);
  const { registros, diario, normal, carregando, semEstimativa } = useChuvaSafra(talhao, hoje);
  const { resultado } = usePrevisao(talhao?.lat, talhao?.lon);
  const [gerando, setGerando] = useState(false);

  if (!pro) return <Redirect href="/assinatura" />;
  if (!talhao) return null;

  const safra = safraDe(hoje);
  const ate = somarDias(hoje, -1);
  const ocorrencias = estado.eventos.filter((e) => e.talhaoId === talhao.id && e.data >= safra.inicio);
  const aplicacoes = estado.aplicacoes.filter((a) => a.talhaoId === talhao.id && a.quando >= safra.inicio);
  const eventos = eventosDoTalhao(diario, talhao);
  const total = acumulado(registros, safra.inicio, ate);
  const seguro = estado.seguro.tipo === 'nenhum' ? null : estado.seguro;

  const gerar = async () => {
    setGerando(true);
    try {
      const comFotos = await Promise.all(
        ocorrencias.map(async (o) => ({
          data: o.data,
          tipo: TIPOS_OCORRENCIA.find((t) => t.valor === o.tipo)?.rotulo ?? o.tipo,
          nota: [o.nota, o.local ? `Local: ${o.local.lat.toFixed(5)}, ${o.local.lon.toFixed(5)}` : null, o.registradaEm ? `Registrado em ${o.registradaEm.replace('T', ' às ')}` : null]
            .filter(Boolean)
            .join(' · '),
          fotos: (await Promise.all(o.fotos.map(fotoParaHtml))).filter((f): f is string => f !== null),
          comunicadoEm: o.comunicadoEm,
        })),
      );
      const html = montarDossieHtml({
        talhao: {
          nome: talhao.nome,
          lat: talhao.lat,
          lon: talhao.lon,
          cultura: talhao.cultura,
          dataPlantio: talhao.dataPlantio,
          areaHa: talhao.areaHa,
          solo: talhao.solo,
          zarc: talhao.zarc,
        },
        seguro: seguro ? { tipo: TIPOS_SEGURO.find((s) => s.valor === seguro.tipo)?.rotulo ?? '', agente: seguro.agente || undefined, prazoDias: seguro.prazoDias } : null,
        produtor: estado.produtor || undefined,
        safra,
        ate,
        geradoEm: agora,
        chuva: registros,
        temperaturas: diario.map(({ data, tMin, tMax, rajada }) => ({ data, tMin, tMax, rajada })),
        normal,
        eventos,
        ocorrencias: comFotos,
        aplicacoes: aplicacoes.map((a) => ({ ...a, lavagem: resultado ? TEXTO_LAVAGEM[verificarLavagem(a, resultado.dados.horas, agora).situacao] : undefined })),
      });
      await compartilharPdf(html, `Dossiê ${talhao.nome} — safra ${safra.rotulo}`);
    } catch (e) {
      informar('Dossiê', e instanceof Error ? e.message : 'Não foi possível gerar o PDF.');
    } finally {
      setGerando(false);
    }
  };

  return (
    <Tela comAbas={false} cabecalhoNativo>
      <View style={estilos.capa}>
        <Ilustracao nome="page_facing_up" tamanho={96} />
        <T variante="titulo" style={estilos.centro}>
          {talhao.nome}
        </T>
        <T variante="pequeno" style={estilos.centro}>
          Safra {safra.rotulo} · até ontem
        </T>
      </View>

      <Cartao testID="resumo-dossie">
        <LinhaInfo icone="gota" rotulo="Chuva acumulada" valor={formatarMm(total)} />
        {normal !== null ? <LinhaInfo icone="grafico" rotulo="Média histórica" valor={formatarMm(normal)} /> : null}
        <LinhaInfo icone="alerta" rotulo="Eventos do clima detectados" valor={String(eventos.length)} />
        <LinhaInfo icone="camera" rotulo="Ocorrências com foto" valor={String(ocorrencias.length)} />
        <LinhaInfo icone="pulverizador" rotulo="Aplicações no caderno" valor={String(aplicacoes.length)} />
      </Cartao>

      {seguro ? (
        <Aviso icone="escudo" titulo={TIPOS_SEGURO.find((s) => s.valor === seguro.tipo)?.rotulo}>
          {`${seguro.agente ? `${seguro.agente}. ` : ''}${seguro.prazoDias ? `Prazo do contrato para comunicar perda: ${seguro.prazoDias} dias.` : 'Informe o prazo do contrato em Ajustes para o dossiê calcular as datas.'}`}
        </Aviso>
      ) : (
        <Aviso tipo="atencao" titulo="Cobertura não informada">
          Diga em Ajustes se o talhão tem Proagro ou seguro: o dossiê mostra o prazo para comunicar cada evento.
        </Aviso>
      )}
      {!seguro || !seguro.prazoDias ? <Botao titulo="Informar seguro e prazo" tipo="secundario" icone="escudo" aoTocar={() => router.push('/ajustes')} /> : null}

      {semEstimativa ? <Aviso tipo="atencao">Sem internet: o dossiê usará só o diário já salvo e suas anotações.</Aviso> : null}
      <Aviso>
        O PDF traz identificação do talhão, janela do ZARC, resumo do clima, eventos com prazo, ocorrências com fotos e local, caderno de aplicações e o diário dia a dia. É documento de apoio: não substitui laudo nem vistoria.
      </Aviso>
      <Botao titulo="Gerar e compartilhar PDF" icone="compartilhar" aoTocar={gerar} carregando={gerando || carregando} testID="gerar-pdf" />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  capa: { alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.two },
  centro: { textAlign: 'center' },
});
