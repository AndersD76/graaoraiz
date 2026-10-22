import { acumulado, dataDe, formatarMm, isoLocal, montarRelatorioHtml, safraDe, somarDias } from '@graoraiz/clima';
import { Redirect } from 'expo-router';
import { useState } from 'react';

import { Aviso, Botao, Cartao, T, Tela } from '@/components/ui';
import { useChuvaSafra } from '@/hooks/use-chuva-safra';
import { informar } from '@/lib/dialogo';
import { CULTURAS, talhaoAtual, useEstado, usePro } from '@/lib/estado';
import { compartilharPdf } from '@/lib/exportar';

export default function RelatorioScreen() {
  const estado = useEstado();
  const pro = usePro();
  const talhao = talhaoAtual(estado);
  const { registros, normal, carregando, semEstimativa } = useChuvaSafra(talhao);
  const [gerando, setGerando] = useState(false);

  if (!pro) return <Redirect href="/assinatura" />;
  if (!talhao) return null;

  const agora = isoLocal(new Date());
  const hoje = dataDe(agora);
  const safra = safraDe(hoje);
  const ate = somarDias(hoje, -1);
  const eventos = estado.eventos.filter((e) => e.talhaoId === talhao.id && e.data >= safra.inicio);
  const total = acumulado(registros, safra.inicio, ate);

  const gerar = async () => {
    setGerando(true);
    try {
      const html = montarRelatorioHtml({
        talhao: {
          nome: talhao.nome,
          lat: talhao.lat,
          lon: talhao.lon,
          cultura: CULTURAS.find((c) => c.valor === talhao.cultura)?.rotulo,
          dataPlantio: talhao.dataPlantio ?? undefined,
        },
        safra,
        ate,
        geradoEm: agora,
        chuva: registros,
        normal,
        eventos: eventos.map(({ data, tipo, nota }) => ({ data, tipo, nota })),
      });
      await compartilharPdf(html, `Relatório da safra ${safra.rotulo}`);
    } catch (e) {
      informar('Relatório', e instanceof Error ? e.message : 'Não foi possível gerar o PDF.');
    } finally {
      setGerando(false);
    }
  };

  return (
    <Tela comAbas={false}>
      <Cartao>
        <T variante="subtitulo">
          {talhao.nome} · safra {safra.rotulo}
        </T>
        <T>Chuva acumulada até ontem: {formatarMm(total)}</T>
        {normal !== null ? <T>Média histórica no período: {formatarMm(normal)}</T> : null}
        <T>Ocorrências registradas: {eventos.length}</T>
      </Cartao>
      {semEstimativa ? <Aviso tipo="atencao">Sem internet: o relatório usará só a estimativa já salva e suas anotações.</Aviso> : null}
      <Aviso>
        O PDF traz o resumo, a chuva por mês e por dia (anotada ou estimada) e as ocorrências. É documento de apoio: não substitui laudo de profissional habilitado.
      </Aviso>
      <Botao titulo="Gerar e compartilhar PDF" aoTocar={gerar} carregando={gerando || carregando} testID="gerar-pdf" />
    </Tela>
  );
}
