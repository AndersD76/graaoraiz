import { CATEGORIAS_MAQUINA, ORDENS_ANUNCIO, UFS_BRASIL } from '@graoraiz/clima';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CartaoAnuncio } from '@/components/cartao-anuncio';
import { Ilustracao } from '@/components/icone';
import { Aviso, Botao, Campo, Cartao, Carregando, Chip, FaixaChips, Grade, Linha, T, Tela } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { useConta } from '@/lib/conta';
import { FILTROS_INICIAIS, type Filtros, useAnuncios } from '@/lib/maquinas';

/** Vitrine de máquinas e implementos usados, de produtor para produtor. */
export default function MaquinasScreen() {
  const router = useRouter();
  const tema = useTheme();
  const conta = useConta();
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIAIS);
  const [texto, setTexto] = useState('');
  const { anuncios, temMais, comissao, carregando, erro, carregarMais, atualizar } = useAnuncios(filtros);

  // Busca depois que a pessoa para de digitar.
  useEffect(() => {
    const t = setTimeout(() => setFiltros((f) => (f.busca === texto ? f : { ...f, busca: texto })), 450);
    return () => clearTimeout(t);
  }, [texto]);

  const mudar = (parcial: Partial<Filtros>) => setFiltros((f) => ({ ...f, ...parcial }));
  const filtrando = filtros.categoria !== null || filtros.uf !== null || filtros.busca.trim() !== '';

  return (
    <Tela titulo="Máquinas" subtitulo="Usados de produtor para produtor" aoAtualizar={atualizar} atualizando={carregando && anuncios.length > 0}>
      <Cartao tom="marca">
        <Linha style={estilos.chamada}>
          <Ilustracao nome="tractor" tamanho={56} />
          <View style={estilos.flex}>
            <T variante="subtitulo">Vende uma máquina parada?</T>
            <T variante="pequeno">
              Anunciar é grátis. {comissao !== null ? `Comissão de ${comissao.toLocaleString('pt-BR')}% só quando vender.` : 'Comissão só quando vender.'}
            </T>
          </View>
        </Linha>
        <Linha>
          <View style={estilos.flex}>
            <Botao titulo="Anunciar máquina" icone="mais" aoTocar={() => router.push('/anunciar')} testID="anunciar" />
          </View>
          {conta && !conta.demo ? (
            <View style={estilos.flex}>
              <Botao titulo="Meus anúncios" tipo="secundario" icone="lista" aoTocar={() => router.push('/meus-anuncios')} testID="meus-anuncios" />
            </View>
          ) : null}
        </Linha>
      </Cartao>

      <Campo
        rotulo="Buscar"
        value={texto}
        onChangeText={setTexto}
        placeholder="Trator, plantadeira, marca, cidade…"
        returnKeyType="search"
        autoCorrect={false}
        testID="busca-maquinas"
      />

      <FaixaChips accessibilityLabel="Categoria">
        <Chip rotulo="Todas" ativo={filtros.categoria === null} aoTocar={() => mudar({ categoria: null })} testID="categoria-todas" />
        {CATEGORIAS_MAQUINA.map((c) => (
          <Chip key={c.valor} rotulo={c.rotulo} ativo={filtros.categoria === c.valor} aoTocar={() => mudar({ categoria: c.valor })} testID={`categoria-${c.valor}`} />
        ))}
      </FaixaChips>
      <FaixaChips accessibilityLabel="Estado">
        <Chip rotulo="Todo o Brasil" ativo={filtros.uf === null} aoTocar={() => mudar({ uf: null })} testID="uf-todas" />
        {UFS_BRASIL.map((uf) => (
          <Chip key={uf} rotulo={uf} ativo={filtros.uf === uf} aoTocar={() => mudar({ uf })} testID={`uf-${uf}`} />
        ))}
      </FaixaChips>
      <FaixaChips accessibilityLabel="Ordem">
        {ORDENS_ANUNCIO.map((o) => (
          <Chip key={o.valor} rotulo={o.rotulo} ativo={filtros.ordem === o.valor} aoTocar={() => mudar({ ordem: o.valor })} />
        ))}
      </FaixaChips>

      {erro ? (
        <Aviso tipo="atencao" titulo="Sem anúncios agora">
          {erro}
        </Aviso>
      ) : null}
      {carregando && anuncios.length === 0 ? <Carregando texto="Buscando máquinas…" /> : null}

      {!carregando && !erro && anuncios.length === 0 ? (
        <Cartao>
          <T variante="subtitulo">{filtrando ? 'Nada com esse filtro' : 'Seja o primeiro a anunciar'}</T>
          <T variante="pequeno" cor={tema.textSecondary}>
            {filtrando ? 'Tente outra categoria, outro estado ou outra palavra.' : 'Ainda não há máquinas anunciadas. Anuncie a sua e mande o link para os vizinhos.'}
          </T>
          {filtrando ? (
            <Botao
              titulo="Limpar filtros"
              tipo="texto"
              aoTocar={() => {
                setTexto('');
                setFiltros(FILTROS_INICIAIS);
              }}
            />
          ) : null}
        </Cartao>
      ) : null}

      {anuncios.length > 0 ? (
        <Grade larguraMinima={170} maxColunas={4}>
          {anuncios.map((a) => (
            <CartaoAnuncio key={a.id} anuncio={a} aoTocar={() => router.push({ pathname: '/maquina/[id]', params: { id: a.id } })} />
          ))}
        </Grade>
      ) : null}
      {temMais ? <Botao titulo="Ver mais máquinas" tipo="secundario" carregando={carregando} aoTocar={carregarMais} testID="ver-mais-maquinas" /> : null}

      <T variante="pequeno" cor={tema.textSecondary} style={estilos.centro}>
        O Grão Raiz aproxima comprador e vendedor; a negociação é entre vocês. Veja a máquina funcionando antes de pagar.
      </T>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  chamada: { alignItems: 'center', flexWrap: 'nowrap' },
  flex: { flex: 1, minWidth: 150 },
  centro: { textAlign: 'center' },
});
