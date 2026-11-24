import { formatarReais, rotuloCategoria } from '@graoraiz/clima';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Aviso, Botao, Cartao, Carregando, Colunas, Divisor, LinhaInfo, T, Tela } from '@/components/ui';
import { Raio, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ErroConta, useConta } from '@/lib/conta';
import { informar } from '@/lib/dialogo';
import { registrar } from '@/lib/eventos';
import { abrirConversaDoAnuncio } from '@/lib/conversas';
import { compartilharAnuncio, urlFoto, useAnuncio } from '@/lib/maquinas';

/** Um anúncio de máquina: fotos, dados e a conversa com o vendedor, pelo app. */
export default function MaquinaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const tema = useTheme();
  const conta = useConta();
  const { anuncio, erro, carregando } = useAnuncio(id);
  const visto = anuncio?.id;
  useEffect(() => {
    if (visto) registrar('listing_viewed', { anuncio: visto });
  }, [visto]);
  const [foto, setFoto] = useState(0);
  const [chamando, setChamando] = useState(false);

  if (carregando && !anuncio) {
    return (
      <Tela comAbas={false} cabecalhoNativo>
        <Carregando texto="Abrindo o anúncio…" />
      </Tela>
    );
  }
  if (!anuncio) {
    return (
      <Tela comAbas={false} cabecalhoNativo>
        <Aviso tipo="atencao" titulo="Anúncio indisponível">
          {erro ?? 'Este anúncio saiu do ar.'}
        </Aviso>
        <Botao titulo="Ver outras máquinas" aoTocar={() => router.replace('/maquinas')} />
      </Tela>
    );
  }

  const preco = formatarReais(anuncio.preco);
  const fotoAtual = anuncio.fotos[Math.min(foto, anuncio.fotos.length - 1)];
  const semConta = !conta || conta.demo;

  const conversar = async () => {
    setChamando(true);
    try {
      const conversa = await abrirConversaDoAnuncio(anuncio.id);
      router.push({ pathname: '/conversa/[id]', params: { id: conversa } });
    } catch (e) {
      informar('Conversar com o vendedor', e instanceof ErroConta ? e.message : 'Não deu para abrir a conversa agora. Tente de novo.');
    } finally {
      setChamando(false);
    }
  };

  const fotos = (
    <View style={estilos.fotos}>
      <View style={[estilos.fotoGrande, { backgroundColor: tema.backgroundSelected }]}>
        {fotoAtual ? <Image source={{ uri: urlFoto(fotoAtual) }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={`Foto ${foto + 1} de ${anuncio.fotos.length}`} /> : null}
      </View>
      {anuncio.fotos.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.miniaturas}>
          {anuncio.fotos.map((f, i) => (
            <Pressable
              key={f}
              onPress={() => setFoto(i)}
              accessibilityRole="button"
              accessibilityLabel={`Ver foto ${i + 1}`}
              style={[estilos.miniatura, { borderColor: i === foto ? tema.marca : 'transparent' }]}>
              <Image source={{ uri: urlFoto(f) }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="" />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  const dados = (
    <>
      <View style={estilos.cabecalho}>
        <T variante="numero" cor={tema.marca} testID="preco-anuncio">
          {preco}
        </T>
        <T variante="titulo">{anuncio.titulo}</T>
        <T variante="pequeno">
          Anunciado por {anuncio.vendedor} em {new Date(anuncio.criadoEm).toLocaleDateString('pt-BR')}
        </T>
      </View>

      {anuncio.meu ? (
        <Cartao tom="marca">
          <T variante="forte">Este anúncio é seu</T>
          <Botao titulo="Editar anúncio" icone="editar" aoTocar={() => router.push({ pathname: '/anunciar', params: { id: anuncio.id } })} />
          <Botao titulo="Conversas" tipo="secundario" icone="chat" aoTocar={() => router.push('/conversas')} />
          <Botao titulo="Meus anúncios" tipo="secundario" icone="lista" aoTocar={() => router.push('/meus-anuncios')} />
        </Cartao>
      ) : semConta ? (
        <Cartao tom="destaque">
          <T variante="forte">Entre para conversar com o vendedor</T>
          <T variante="pequeno">Sem conta dá para ver tudo. Para conversar com o vendedor aqui no app, entre ou crie a conta. É grátis.</T>
          <Botao titulo="Entrar ou criar conta" icone="usuario" aoTocar={() => router.push('/entrar')} testID="entrar-para-chamar" />
        </Cartao>
      ) : (
        <Botao titulo="Conversar com o vendedor" icone="chat" carregando={chamando} aoTocar={() => void conversar()} testID="conversar-vendedor" />
      )}
      <Botao titulo="Mandar para alguém" tipo="secundario" icone="compartilhar" aoTocar={() => void compartilharAnuncio(anuncio, preco)} />

      <Cartao>
        <LinhaInfo icone="trator" rotulo="Categoria" valor={rotuloCategoria(anuncio.categoria)} />
        {anuncio.marca ? <LinhaInfo icone="info" rotulo="Marca" valor={anuncio.marca} /> : null}
        {anuncio.modelo ? <LinhaInfo icone="info" rotulo="Modelo" valor={anuncio.modelo} /> : null}
        {anuncio.ano ? <LinhaInfo icone="calendario" rotulo="Ano" valor={String(anuncio.ano)} /> : null}
        {anuncio.horas !== null ? <LinhaInfo icone="relogio" rotulo="Horas de uso" valor={`${anuncio.horas.toLocaleString('pt-BR')} h`} /> : null}
        <LinhaInfo icone="pino" rotulo="Local" valor={`${anuncio.municipio}/${anuncio.uf}`} />
        {anuncio.descricao ? (
          <>
            <Divisor />
            <T>{anuncio.descricao}</T>
          </>
        ) : null}
      </Cartao>

      <Aviso tipo="atencao" titulo="Compra segura">
        Veja a máquina funcionando antes de pagar, confira a nota e o documento, e desconfie de preço muito abaixo do mercado. Nunca pague sinal para reservar.
      </Aviso>
    </>
  );

  return (
    <Tela comAbas={false} cabecalhoNativo>
      <Stack.Screen options={{ title: rotuloCategoria(anuncio.categoria) }} />
      {anuncio.situacao === 'vendido' ? <Aviso tipo="info">Esta máquina já foi vendida.</Aviso> : null}
      {anuncio.situacao === 'pausado' ? <Aviso tipo="atencao">Anúncio pausado: só você está vendo.</Aviso> : null}
      <Colunas esquerda={fotos} direita={dados} />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  fotos: { gap: Spacing.two },
  fotoGrande: { aspectRatio: 4 / 3, borderRadius: Raio.grande, overflow: 'hidden' },
  miniaturas: { gap: Spacing.two },
  miniatura: { width: 72, height: 54, borderRadius: Raio.pequeno, overflow: 'hidden', borderWidth: 2 },
  cabecalho: { gap: 4 },
});
