import { avaliarSerie, dataDe, diaDaSemana, formatarData, isoLocal, somarDias } from '@graoraiz/clima';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { AlertasTempo, CartaoPulverizacao, CartaoTempoFirme, PrevisaoSemana, RodapeFonte, SeletorTalhao } from '@/components/clima';
import { Aviso, Botao, Carregando, Tela } from '@/components/ui';
import { usePrevisao } from '@/hooks/use-previsao';
import { reagendarAvisos } from '@/lib/avisos';
import { talhaoAtual, useEstado } from '@/lib/estado';

export default function HojeScreen() {
  const router = useRouter();
  const estado = useEstado();
  const talhao = talhaoAtual(estado);
  const { resultado, carregando, erro, atualizar } = usePrevisao(talhao?.lat, talhao?.lon);

  const agora = isoLocal(new Date());
  const hoje = dataDe(agora);
  const amanha = somarDias(hoje, 1);
  const horaAtual = `${agora.slice(0, 13)}:00`;

  const avaliacoes = useMemo(
    () => (resultado ? avaliarSerie(resultado.dados.horas, estado.limiares).filter((a) => a.hora >= horaAtual) : []),
    [resultado, estado.limiares, horaAtual],
  );

  const recarregar = async () => {
    await atualizar();
    await reagendarAvisos();
  };

  return (
    <Tela
      titulo="Hoje"
      subtitulo={`${diaDaSemana(hoje, true)}, ${formatarData(hoje)}${talhao ? ` · ${talhao.nome}` : ''}`}
      aoAtualizar={recarregar}
      atualizando={carregando && resultado !== null}>
      <SeletorTalhao talhoes={estado.talhoes} selecionado={talhao} />

      {!resultado && carregando ? <Carregando texto="Buscando a previsão do seu talhão…" /> : null}

      {!resultado && !carregando && erro ? (
        <Aviso tipo="atencao" titulo="Não deu para buscar a previsão">
          Verifique a internet e tente de novo. Quando houver sinal, a última previsão fica salva para usar sem internet.
        </Aviso>
      ) : null}
      {!resultado && !carregando && erro ? <Botao titulo="Tentar de novo" aoTocar={recarregar} /> : null}

      {resultado ? (
        <>
          <AlertasTempo dias={resultado.dados.dias} horas={resultado.dados.horas} hoje={hoje} agora={agora} />
          <CartaoPulverizacao avaliacoes={avaliacoes} hoje={hoje} amanha={amanha} aoVerDetalhes={() => router.push('/pulverizacao')} />
          <CartaoTempoFirme dias={resultado.dados.dias} hoje={hoje} />
          <PrevisaoSemana dias={resultado.dados.dias} hoje={hoje} />
          <RodapeFonte em={resultado.em} desatualizado={resultado.desatualizado} />
        </>
      ) : null}
    </Tela>
  );
}
