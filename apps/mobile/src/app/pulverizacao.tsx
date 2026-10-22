import { avaliarSerie, dataDe, formatarNumero, rotuloDia, somarHoras } from '@graoraiz/clima';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { FaixaHora, RodapeFonte } from '@/components/clima';
import { Aviso, Botao, Carregando, Cartao, T, Tela } from '@/components/ui';
import { useAgora } from '@/hooks/use-agora';
import { usePrevisao } from '@/hooks/use-previsao';
import { talhaoAtual, useEstado, usePro } from '@/lib/estado';

export default function PulverizacaoScreen() {
  const router = useRouter();
  const estado = useEstado();
  const pro = usePro();
  const talhao = talhaoAtual(estado);
  const { resultado, carregando } = usePrevisao(talhao?.lat, talhao?.lon);
  const agora = useAgora();
  const hoje = dataDe(agora);
  const L = estado.limiares;

  const inicio = `${agora.slice(0, 13)}:00`;
  const avaliacoes = useMemo(() => {
    if (!resultado) return [];
    const fim = somarHoras(inicio, 48);
    return avaliarSerie(resultado.dados.horas, L).filter((a) => a.hora >= inicio && a.hora < fim);
  }, [resultado, L, inicio]);

  // Grátis: hora a hora só de hoje. Pro: 48 horas.
  const liberadas = pro ? avaliacoes : avaliacoes.filter((a) => dataDe(a.hora) === hoje);
  const bloqueadas = pro ? [] : avaliacoes.filter((a) => dataDe(a.hora) !== hoje).slice(0, 4);
  const dias = [...new Set(liberadas.map((a) => dataDe(a.hora)))];

  return (
    <Tela comAbas={false} cabecalhoNativo>
      <Cartao>
        <T variante="forte">{talhao?.nome}</T>
        <T variante="pequeno">
          Critérios: vento na barra {L.vento2m.minimo}–{L.vento2m.idealMaximo} km/h, rajada abaixo de {L.rajada2m.atencao} km/h, ΔT {L.deltaT.idealMinimo}–
          {L.deltaT.idealMaximo} °C, umidade a partir de {L.umidade.idealMinima}%, temperatura até {L.temperatura.idealMaxima} °C e sem chuva nas{' '}
          {formatarNumero(L.chuva.horasSemChuvaApos)} horas seguintes.
        </T>
      </Cartao>

      {!resultado && carregando ? <Carregando texto="Buscando a previsão…" /> : null}

      {dias.map((dia) => (
        <View key={dia} style={{ gap: 8 }}>
          <T variante="subtitulo" style={{ textTransform: 'capitalize' }}>
            {rotuloDia(dia, hoje)}
          </T>
          {liberadas
            .filter((a) => dataDe(a.hora) === dia)
            .map((a) => (
              <FaixaHora key={a.hora} avaliacao={a} />
            ))}
        </View>
      ))}

      {bloqueadas.length > 0 ? (
        <>
          {bloqueadas.map((a) => (
            <FaixaHora key={a.hora} avaliacao={a} bloqueada />
          ))}
          <Aviso titulo="Veja amanhã hora a hora">Com o Pro você vê as próximas 48 horas e recebe aviso na véspera quando houver janela.</Aviso>
          <Botao titulo="Conhecer o Pro" aoTocar={() => router.push('/assinatura')} testID="abrir-pro" />
        </>
      ) : null}

      {resultado ? <RodapeFonte em={resultado.em} desatualizado={resultado.desatualizado} /> : null}
    </Tela>
  );
}
