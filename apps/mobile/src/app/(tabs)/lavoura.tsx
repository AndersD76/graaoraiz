import { CULTURAS, dataDe, diasEntre, formatarData, formatarNumero, situacaoZarc, somarDias } from '@graoraiz/clima';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icone, Ilustracao, type NomeIcone } from '@/components/icone';
import { Botao, Cartao, Selo, T, Tela } from '@/components/ui';
import { Raio, Spacing } from '@/constants/theme';
import { useAgora } from '@/hooks/use-agora';
import { useTheme } from '@/hooks/use-theme';
import { useVigor } from '@/hooks/use-vigor';
import { ILUSTRACAO_CULTURA } from '@/lib/culturas-visual';
import { LIMITE_TALHOES_GRATIS, selecionarTalhao, type Talhao, talhaoAtual, talhoesLiberados, useEstado, usePro } from '@/lib/estado';

function AcaoTalhao({ icone, rotulo, aoTocar, testID }: { icone: NomeIcone; rotulo: string; aoTocar: () => void; testID?: string }) {
  const tema = useTheme();
  return (
    <Pressable onPress={aoTocar} accessibilityRole="button" accessibilityLabel={rotulo} testID={testID} style={[estilos.acao, { backgroundColor: tema.backgroundSelected }]}>
      <Icone nome={icone} tamanho={18} cor={tema.marca} />
      <T variante="pequeno" cor={tema.text}>
        {rotulo}
      </T>
    </Pressable>
  );
}

function VigorRapido({ talhao }: { talhao: Talhao }) {
  const tema = useTheme();
  const { serie, carregando } = useVigor(talhao, 2);
  const ultimo = serie?.at(-1);
  const anterior = serie && serie.length > 1 ? serie[serie.length - 2] : undefined;
  if (carregando) return <T variante="pequeno">Buscando a última imagem do satélite…</T>;
  if (!ultimo) return null;
  const variacao = anterior ? ultimo.media - anterior.media : null;
  return (
    <View style={estilos.vigor}>
      <Icone nome="satelite" tamanho={16} cor={tema.bom} />
      <T variante="pequeno">
        Vigor {formatarNumero(ultimo.media, 2)} em {formatarData(ultimo.data)}
        {variacao !== null ? ` (${variacao >= 0 ? '+' : ''}${formatarNumero(variacao, 2)})` : ''}
      </T>
    </View>
  );
}

export default function LavouraScreen() {
  const router = useRouter();
  const tema = useTheme();
  const estado = useEstado();
  const pro = usePro();
  const hoje = dataDe(useAgora());
  const atual = talhaoAtual(estado);
  const liberados = talhoesLiberados(estado);
  const podeAdicionar = pro || estado.talhoes.length < LIMITE_TALHOES_GRATIS;
  const area = estado.talhoes.reduce((s, t) => s + (t.areaHa ?? 0), 0);

  const abrir = (t: Talhao, rota: '/satelite' | '/dossie') => {
    selecionarTalhao(t.id);
    router.push(rota);
  };

  return (
    <Tela
      titulo="Lavoura"
      subtitulo={`${estado.talhoes.length} ${estado.talhoes.length === 1 ? 'talhão' : 'talhões'}${area ? ` · ${formatarNumero(area, 1)} ha` : ''}`}>
      {estado.talhoes.map((t) => {
        const bloqueado = !liberados.includes(t);
        const info = t.cultura ? CULTURAS[t.cultura] : null;
        const diasPlantio = t.dataPlantio ? diasEntre(t.dataPlantio, hoje) : null;
        const zarc = t.zarc && !t.dataPlantio ? situacaoZarc(t.zarc, hoje) : null;
        return (
          <Cartao key={t.id} testID={`talhao-${t.nome}`} style={bloqueado ? estilos.bloqueado : undefined}>
            <View style={estilos.topo}>
              <View style={[estilos.ilustracao, { backgroundColor: tema.marcaSuave }]}>
                <Ilustracao nome={t.cultura ? ILUSTRACAO_CULTURA[t.cultura] : 'seedling'} tamanho={44} />
              </View>
              <View style={estilos.flex}>
                <T variante="subtitulo" numberOfLines={1}>
                  {t.nome}
                </T>
                <T variante="pequeno">
                  {info?.rotulo ?? 'Cultura não informada'}
                  {t.areaHa ? ` · ${formatarNumero(t.areaHa, 1)} ha` : ''}
                </T>
              </View>
              {t.id === atual?.id && !bloqueado ? <Selo status="bom" texto="No Hoje" /> : null}
              {bloqueado ? <Selo status="atencao" texto="Pro" /> : null}
            </View>

            <View style={estilos.linhaInfo}>
              <Icone nome="calendario" tamanho={16} cor={tema.textSecondary} />
              <T variante="pequeno">
                {diasPlantio !== null
                  ? `${diasPlantio} dias desde o plantio (${formatarData(t.dataPlantio!)})${info?.cicloDias ? ` · colheita perto de ${formatarData(somarDias(t.dataPlantio!, info.cicloDias))}` : ''}`
                  : zarc
                    ? zarc.situacao === 'aberta'
                      ? `Janela do ZARC aberta: faltam ${zarc.dias} dias`
                      : zarc.situacao === 'antes'
                        ? `Janela do ZARC abre em ${zarc.dias} dias`
                        : 'Janela do ZARC fechada'
                    : 'Ainda não plantado'}
              </T>
            </View>

            {!bloqueado ? <VigorRapido talhao={t} /> : null}

            {bloqueado ? (
              <>
                <T variante="pequeno">No plano grátis só o primeiro talhão fica ativo. Assine o Pro para voltar a usar este.</T>
                <Botao titulo="Conhecer o Pro" tipo="secundario" icone="coroa" aoTocar={() => router.push('/assinatura')} />
              </>
            ) : (
              <View style={estilos.acoes}>
                <AcaoTalhao icone="satelite" rotulo="Satélite" aoTocar={() => abrir(t, '/satelite')} testID={`satelite-${t.nome}`} />
                <AcaoTalhao icone="pdf" rotulo="Dossiê" aoTocar={() => abrir(t, '/dossie')} testID={`dossie-${t.nome}`} />
                <AcaoTalhao icone="editar" rotulo="Editar" aoTocar={() => router.push({ pathname: '/talhao', params: { id: t.id } })} testID={`editar-${t.nome}`} />
                {t.id !== atual?.id ? <AcaoTalhao icone="casa" rotulo="Ver no Hoje" aoTocar={() => selecionarTalhao(t.id)} /> : null}
              </View>
            )}
          </Cartao>
        );
      })}

      <Botao
        titulo={podeAdicionar ? 'Adicionar talhão' : 'Adicionar talhão · Pro'}
        icone="mais"
        aoTocar={() => router.push(podeAdicionar ? '/talhao' : '/assinatura')}
        testID="adicionar-talhao"
      />
      {!pro ? <T variante="pequeno" style={estilos.centro}>No plano grátis você acompanha {LIMITE_TALHOES_GRATIS} talhão. No Pro, quantos quiser.</T> : null}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  ilustracao: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 2 },
  linhaInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vigor: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: 4 },
  acao: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: Raio.total },
  bloqueado: { opacity: 0.85 },
  centro: { textAlign: 'center' },
});
