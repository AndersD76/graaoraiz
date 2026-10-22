import { formatarData } from '@graoraiz/clima';
import { useRouter } from 'expo-router';

import { Botao, Cartao, Linha, Selo, T, Tela } from '@/components/ui';
import { CULTURAS, LIMITE_TALHOES_GRATIS, selecionarTalhao, talhaoAtual, talhoesLiberados, useEstado, usePro } from '@/lib/estado';

export default function TalhoesScreen() {
  const router = useRouter();
  const estado = useEstado();
  const pro = usePro();
  const atual = talhaoAtual(estado);
  const liberados = talhoesLiberados(estado);
  const podeAdicionar = pro || estado.talhoes.length < LIMITE_TALHOES_GRATIS;

  return (
    <Tela titulo="Talhões" subtitulo="A previsão é feita para o ponto marcado de cada talhão.">
      {estado.talhoes.map((t) => {
        const cultura = CULTURAS.find((c) => c.valor === t.cultura)?.rotulo;
        const bloqueado = !liberados.includes(t);
        return (
          <Cartao key={t.id} testID={`talhao-${t.nome}`}>
            <Linha style={{ justifyContent: 'space-between' }}>
              <T variante="subtitulo">{t.nome}</T>
              {t.id === atual?.id ? <Selo status="bom" texto="Selecionado" /> : null}
              {bloqueado ? <Selo status="atencao" texto="Bloqueado" /> : null}
            </Linha>
            <T>
              {cultura ?? 'Cultura não informada'}
              {t.dataPlantio ? ` · plantio em ${formatarData(t.dataPlantio)}` : ''}
            </T>
            <T variante="pequeno">
              {t.lat.toFixed(4)}, {t.lon.toFixed(4)}
            </T>
            {bloqueado ? <T variante="pequeno">No plano grátis só o primeiro talhão fica ativo. Assine o Pro para voltar a usar este.</T> : null}
            <Linha>
              {bloqueado ? <Botao titulo="Conhecer o Pro" tipo="secundario" aoTocar={() => router.push('/assinatura')} /> : null}
              {!bloqueado && t.id !== atual?.id ? <Botao titulo="Selecionar" tipo="secundario" aoTocar={() => selecionarTalhao(t.id)} /> : null}
              <Botao titulo="Editar" tipo="secundario" aoTocar={() => router.push({ pathname: '/talhao', params: { id: t.id } })} testID={`editar-${t.nome}`} />
            </Linha>
          </Cartao>
        );
      })}

      <Botao
        titulo={podeAdicionar ? 'Adicionar talhão' : 'Adicionar talhão · Pro'}
        aoTocar={() => router.push(podeAdicionar ? '/talhao' : '/assinatura')}
        testID="adicionar-talhao"
      />
      {!pro ? <T variante="pequeno">No plano grátis você acompanha {LIMITE_TALHOES_GRATIS} talhão. No Pro, quantos quiser.</T> : null}
    </Tela>
  );
}
