import { CATEGORIAS_MAQUINA, type CategoriaMaquina, MAX_FOTOS_ANUNCIO, UFS_BRASIL } from '@graoraiz/clima';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icone } from '@/components/icone';
import { Aviso, Botao, Campo, Cartao, Carregando, Chip, Interruptor, Linha, T, Tela } from '@/components/ui';
import { Raio, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SITE_URL } from '@/lib/config';
import { chamarServidor, ErroConta, sair, useConta } from '@/lib/conta';
import { informar } from '@/lib/dialogo';
import { talhaoAtual, useEstado } from '@/lib/estado';
import { enviarFoto, escolherFotos, salvarAnuncio, urlFoto, useMeusAnuncios, whatsappSalvo } from '@/lib/maquinas';
import { useMunicipio } from '@/lib/municipio';
import { lerValorDigitado } from '@/lib/precos';

interface Foto {
  chave: string;
  /** Endereço para mostrar: local enquanto envia, do servidor depois. */
  uri: string;
  id: string | null;
  erro: boolean;
}

function numero(texto: string): number | null {
  const n = Number(texto.replace(/\D/g, ''));
  return texto.trim() && Number.isFinite(n) ? n : null;
}

/** Anunciar (ou editar, com ?id=) uma máquina ou implemento usado. */
export default function AnunciarScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const tema = useTheme();
  const conta = useConta();
  const estado = useEstado();
  const talhao = talhaoAtual(estado);
  const municipioTalhao = useMunicipio(talhao?.lat, talhao?.lon);
  const meus = useMeusAnuncios();
  const editando = id ? (meus.anuncios?.find((a) => a.id === id) ?? null) : null;

  const [categoria, setCategoria] = useState<CategoriaMaquina | null>(null);
  const [titulo, setTitulo] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [horas, setHoras] = useState('');
  const [preco, setPreco] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [uf, setUf] = useState('');
  const [descricao, setDescricao] = useState('');
  const [whatsapp, setWhatsapp] = useState(() => whatsappSalvo());
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [aceite, setAceite] = useState(false);
  const [comissao, setComissao] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [preenchido, setPreenchido] = useState(false);

  // Edição: preenche com o anúncio quando ele chegar.
  if (editando && !preenchido) {
    setPreenchido(true);
    setCategoria(editando.categoria);
    setTitulo(editando.titulo);
    setMarca(editando.marca ?? '');
    setModelo(editando.modelo ?? '');
    setAno(editando.ano ? String(editando.ano) : '');
    setHoras(editando.horas !== null ? String(editando.horas) : '');
    setPreco(editando.preco.toLocaleString('pt-BR'));
    setMunicipio(editando.municipio);
    setUf(editando.uf);
    setDescricao(editando.descricao ?? '');
    setWhatsapp(editando.whatsapp);
    setFotos(editando.fotos.map((f) => ({ chave: f, uri: urlFoto(f), id: f, erro: false })));
    setComissao(editando.comissaoPercentual);
  }
  // Anúncio novo: a cidade do talhão já vem marcada.
  if (!id && municipioTalhao && !municipio && !preenchido) {
    setPreenchido(true);
    setMunicipio(municipioTalhao.nome);
    setUf(municipioTalhao.uf);
  }

  useEffect(() => {
    if (id) return;
    let ativo = true;
    chamarServidor<{ comissaoPercentual: number }>('/api/anuncios?pagina=0')
      .then((r) => ativo && setComissao(r.comissaoPercentual))
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, [id]);

  if (!conta || conta.demo) {
    return (
      <Tela comAbas={false} cabecalhoNativo>
        <Cartao tom="destaque">
          <T variante="subtitulo">Crie sua conta para anunciar</T>
          <T variante="pequeno">Na demonstração dá para ver os anúncios. Para anunciar, entre com a sua conta: o anúncio fica guardado nela.</T>
          <Botao
            titulo="Sair da demonstração e criar conta"
            icone="usuario"
            aoTocar={async () => {
              await sair();
              router.replace('/entrar');
            }}
          />
        </Cartao>
      </Tela>
    );
  }
  if (id && !editando) {
    return (
      <Tela comAbas={false} cabecalhoNativo>
        {meus.erro ? <Aviso tipo="atencao">{meus.erro}</Aviso> : <Carregando texto="Abrindo o anúncio…" />}
      </Tela>
    );
  }

  const adicionarFotos = async (origem: 'galeria' | 'camera') => {
    const vagas = MAX_FOTOS_ANUNCIO - fotos.length;
    if (vagas <= 0) return informar('Fotos', `No máximo ${MAX_FOTOS_ANUNCIO} fotos por anúncio.`);
    try {
      const escolhidas = await escolherFotos(origem, vagas);
      for (const f of escolhidas) {
        const chave = `${Date.now()}-${Math.random()}`;
        setFotos((atuais) => [...atuais, { chave, uri: f.uri, id: null, erro: false }]);
        enviarFoto(f)
          .then((idFoto) => setFotos((atuais) => atuais.map((x) => (x.chave === chave ? { ...x, id: idFoto } : x))))
          .catch(() => setFotos((atuais) => atuais.map((x) => (x.chave === chave ? { ...x, erro: true } : x))));
      }
    } catch (e) {
      informar('Fotos', e instanceof Error ? e.message : 'Não deu para abrir as fotos.');
    }
  };

  const publicar = async () => {
    const valor = lerValorDigitado(preco);
    const anoN = numero(ano);
    const horasN = numero(horas);
    const ufN = uf.trim().toUpperCase();
    const prontas = fotos.filter((f) => f.id).map((f) => f.id as string);
    const problema = !categoria
      ? 'Escolha a categoria.'
      : titulo.trim().length < 5
        ? 'Escreva um título, ex.: Trator John Deere 6110J.'
        : !valor
          ? 'Informe o preço, ex.: 285.000.'
          : municipio.trim().length < 2
            ? 'Informe a cidade.'
            : !UFS_BRASIL.includes(ufN as (typeof UFS_BRASIL)[number])
              ? 'Informe o estado (UF), ex.: RS.'
              : !/^\d{10,13}$/.test(whatsapp.replace(/\D/g, ''))
                ? 'Informe o WhatsApp com DDD, ex.: (54) 99999-0000.'
                : fotos.some((f) => !f.id && !f.erro)
                  ? 'Espere as fotos terminarem de enviar.'
                  : prontas.length === 0
                    ? 'Coloque pelo menos uma foto.'
                    : !id && !aceite
                      ? 'Para anunciar, aceite a comissão e os termos de uso.'
                      : null;
    if (problema || !categoria || !valor) return setErro(problema);
    setErro(null);
    setSalvando(true);
    try {
      const novoId = await salvarAnuncio(
        { categoria, titulo: titulo.trim(), marca, modelo, ano: anoN, horas: horasN, preco: valor, municipio: municipio.trim(), uf: ufN, descricao, whatsapp, fotos: prontas },
        id,
      );
      router.replace({ pathname: '/maquina/[id]', params: { id: novoId } });
    } catch (e) {
      setErro(e instanceof ErroConta ? e.message : 'Não deu para publicar agora. Tente de novo.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Tela comAbas={false} cabecalhoNativo>
      <T variante="pequeno">
        Anunciar é grátis. {comissao !== null ? `Se vender pelo Grão Raiz, a comissão é de ${comissao.toLocaleString('pt-BR')}% do valor da venda.` : 'Comissão só quando vender.'}
      </T>

      <T variante="rotulo">Categoria</T>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.chips}>
        {CATEGORIAS_MAQUINA.map((c) => (
          <Chip key={c.valor} rotulo={c.rotulo} ativo={categoria === c.valor} aoTocar={() => setCategoria(c.valor)} testID={`anuncio-categoria-${c.valor}`} />
        ))}
      </ScrollView>

      <Campo rotulo="Título" value={titulo} onChangeText={setTitulo} maxLength={80} placeholder="Ex.: Trator John Deere 6110J" testID="anuncio-titulo" />
      <Linha style={estilos.dupla}>
        <View style={estilos.flex}>
          <Campo rotulo="Marca" value={marca} onChangeText={setMarca} maxLength={40} placeholder="Ex.: John Deere" />
        </View>
        <View style={estilos.flex}>
          <Campo rotulo="Modelo" value={modelo} onChangeText={setModelo} maxLength={60} placeholder="Ex.: 6110J" />
        </View>
      </Linha>
      <Linha style={estilos.dupla}>
        <View style={estilos.flex}>
          <Campo rotulo="Ano" value={ano} onChangeText={setAno} keyboardType="number-pad" maxLength={4} placeholder="Ex.: 2018" testID="anuncio-ano" />
        </View>
        <View style={estilos.flex}>
          <Campo rotulo="Horas de uso" value={horas} onChangeText={setHoras} keyboardType="number-pad" maxLength={7} placeholder="Ex.: 4200" />
        </View>
      </Linha>
      <Campo rotulo="Preço (R$)" value={preco} onChangeText={setPreco} keyboardType="decimal-pad" maxLength={16} placeholder="Ex.: 285.000" testID="anuncio-preco" />
      <Linha style={estilos.dupla}>
        <View style={estilos.cidade}>
          <Campo rotulo="Cidade" value={municipio} onChangeText={setMunicipio} maxLength={80} placeholder="Ex.: Passo Fundo" testID="anuncio-cidade" />
        </View>
        <View style={estilos.uf}>
          <Campo rotulo="UF" value={uf} onChangeText={(t) => setUf(t.toUpperCase())} maxLength={2} autoCapitalize="characters" placeholder="RS" testID="anuncio-uf" />
        </View>
      </Linha>
      <Campo
        rotulo="WhatsApp para os interessados"
        value={whatsapp}
        onChangeText={setWhatsapp}
        keyboardType="phone-pad"
        maxLength={20}
        placeholder="(54) 99999-0000"
        dica="Aparece só para quem tem conta e pedir o contato."
        testID="anuncio-whatsapp"
      />
      <Campo
        rotulo="Descrição"
        value={descricao}
        onChangeText={setDescricao}
        maxLength={3000}
        multiline
        numberOfLines={5}
        placeholder="Estado de conservação, revisões, pneus, o que acompanha, se aceita troca…"
        style={estilos.descricao}
      />

      <T variante="rotulo">Fotos ({fotos.length} de {MAX_FOTOS_ANUNCIO})</T>
      <View style={estilos.fotos}>
        {fotos.map((f, i) => (
          <View key={f.chave} style={[estilos.foto, { backgroundColor: tema.backgroundSelected }]}>
            <Image source={{ uri: f.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            {!f.id ? (
              <View style={[estilos.sobreFoto, { backgroundColor: f.erro ? 'rgba(198,40,40,0.7)' : 'rgba(0,0,0,0.35)' }]}>
                <T variante="pequeno" cor="#ffffff">
                  {f.erro ? 'Falhou' : 'Enviando…'}
                </T>
              </View>
            ) : null}
            {i === 0 ? (
              <View style={[estilos.capa, { backgroundColor: tema.marca }]}>
                <T variante="pequeno" cor="#ffffff" style={estilos.capaTexto}>
                  Capa
                </T>
              </View>
            ) : null}
            <Pressable
              onPress={() => setFotos((atuais) => atuais.filter((x) => x.chave !== f.chave))}
              accessibilityRole="button"
              accessibilityLabel={`Tirar a foto ${i + 1}`}
              hitSlop={8}
              style={estilos.tirar}>
              <Icone nome="fechar" tamanho={16} cor="#ffffff" />
            </Pressable>
          </View>
        ))}
      </View>
      <Linha>
        <View style={estilos.flex}>
          <Botao titulo="Escolher fotos" tipo="secundario" icone="camera" aoTocar={() => void adicionarFotos('galeria')} testID="anuncio-fotos" />
        </View>
        {Platform.OS !== 'web' ? (
          <View style={estilos.flex}>
            <Botao titulo="Tirar foto" tipo="secundario" icone="camera" aoTocar={() => void adicionarFotos('camera')} />
          </View>
        ) : null}
      </Linha>

      {!id ? (
        <Cartao>
          <Interruptor
            rotulo={`Aceito a comissão de ${comissao !== null ? comissao.toLocaleString('pt-BR') : '…'}% sobre a venda`}
            descricao="Devida se a venda sair de um contato feito pelo Grão Raiz. Ao marcar o anúncio como vendido, combinamos o pagamento por PIX."
            valor={aceite}
            aoMudar={setAceite}
            testID="anuncio-aceite"
          />
          <Botao titulo="Ler os termos de uso" tipo="texto" aoTocar={() => WebBrowser.openBrowserAsync(`${SITE_URL}/termos#classificados`)} />
        </Cartao>
      ) : null}

      {erro ? <Aviso tipo="ruim">{erro}</Aviso> : null}
      <Botao titulo={id ? 'Salvar alterações' : 'Publicar anúncio'} icone="check" carregando={salvando} desabilitado={salvando} aoTocar={publicar} testID="publicar-anuncio" />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  chips: { gap: Spacing.two, paddingRight: Spacing.three },
  dupla: { flexWrap: 'nowrap', alignItems: 'flex-start' },
  flex: { flex: 1, minWidth: 0 },
  cidade: { flex: 3, minWidth: 0 },
  uf: { flex: 1, minWidth: 70 },
  descricao: { minHeight: 110, textAlignVertical: 'top', paddingTop: 12 },
  fotos: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  foto: { width: 104, height: 78, borderRadius: Raio.pequeno, overflow: 'hidden' },
  sobreFoto: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  capa: { position: 'absolute', left: 4, bottom: 4, borderRadius: Raio.total, paddingHorizontal: 6 },
  capaTexto: { fontSize: 11, lineHeight: 16 },
  tirar: { position: 'absolute', right: 4, top: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
});
