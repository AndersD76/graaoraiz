import { dataDe, formatarData } from '@graoraiz/clima';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SeletorTalhao } from '@/components/clima';
import { Icone } from '@/components/icone';
import { SeletorData } from '@/components/seletor-data';
import { Aviso, Botao, Campo, Cartao, Chip, Interruptor, Linha, T, Tela } from '@/components/ui';
import { Raio, Spacing } from '@/constants/theme';
import { useAgora } from '@/hooks/use-agora';
import { useTheme } from '@/hooks/use-theme';
import { informar } from '@/lib/dialogo';
import { registrarEvento, talhaoAtual, TIPOS_OCORRENCIA, type TipoOcorrencia, useEstado } from '@/lib/estado';
import { apagarFoto, tirarFoto } from '@/lib/fotos';
import { localizacaoAtual } from '@/lib/localizacao';

const MAX_FOTOS = 6;

/** Registro de ocorrência com fotos, data e local: a prova que o banco e a seguradora pedem. */
export default function OcorrenciaScreen() {
  const router = useRouter();
  const tema = useTheme();
  const estado = useEstado();
  const agora = useAgora();
  const hoje = dataDe(agora);
  const talhao = talhaoAtual(estado);
  const [tipo, setTipo] = useState<TipoOcorrencia | null>(null);
  const [data, setData] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [comLocal, setComLocal] = useState(true);
  const [comunicado, setComunicado] = useState(false);
  const [salvando, setSalvando] = useState(false);

  if (!talhao) return null;
  const dia = data ?? hoje;

  const adicionarFoto = async (origem: 'camera' | 'galeria') => {
    try {
      const uri = await tirarFoto(origem);
      if (uri) setFotos((f) => [...f, uri].slice(0, MAX_FOTOS));
    } catch (e) {
      informar('Foto', e instanceof Error ? e.message : 'Não foi possível adicionar a foto.');
    }
  };

  const remover = (uri: string) => {
    setFotos((f) => f.filter((x) => x !== uri));
    void apagarFoto(uri);
  };

  const salvar = async () => {
    if (!tipo) return;
    setSalvando(true);
    const local = comLocal ? await localizacaoAtual().catch(() => null) : null;
    registrarEvento({
      talhaoId: talhao.id,
      data: dia,
      tipo,
      nota: nota.trim() || undefined,
      fotos,
      local: local ?? undefined,
      registradaEm: agora,
      comunicadoEm: comunicado ? hoje : undefined,
    });
    setSalvando(false);
    router.back();
  };

  return (
    <Tela comAbas={false} cabecalhoNativo>
      <SeletorTalhao selecionado={talhao} />
      <Aviso icone="escudo" titulo="Prova que vale no seguro">
        Fotos com data e local, no dia do evento. Entram no dossiê do talhão para o banco, a seguradora e o perito.
      </Aviso>

      <Cartao>
        <T variante="subtitulo">O que aconteceu</T>
        <Linha>
          {TIPOS_OCORRENCIA.map((t) => (
            <Chip key={t.valor} rotulo={t.rotulo} ativo={tipo === t.valor} aoTocar={() => setTipo(t.valor)} testID={`ocorrencia-${t.valor}`} />
          ))}
        </Linha>
        <T variante="rotulo">Dia</T>
        <Linha>
          <Chip rotulo="Hoje" ativo={dia === hoje} aoTocar={() => setData(null)} />
          <Chip rotulo="Outro dia" ativo={dia !== hoje} aoTocar={() => setData(dia === hoje ? hoje : dia)} />
        </Linha>
        {data !== null ? <SeletorData valor={dia} maximo={hoje} aoMudar={setData} /> : null}
        <Campo rotulo="O que você viu (opcional)" value={nota} onChangeText={setNota} placeholder="Ex.: granizo por 10 minutos, folhas rasgadas na baixada" multiline maxLength={400} style={estilos.nota} testID="campo-nota" />
      </Cartao>

      <Cartao>
        <T variante="subtitulo">Fotos</T>
        <View style={estilos.fotos}>
          {fotos.map((uri) => (
            <View key={uri} style={estilos.foto}>
              <Image source={{ uri }} style={estilos.imagem} contentFit="cover" accessibilityLabel="Foto da ocorrência" />
              <Pressable onPress={() => remover(uri)} style={estilos.removerFoto} accessibilityRole="button" accessibilityLabel="Remover foto" hitSlop={8}>
                <Icone nome="fechar" tamanho={14} cor="#ffffff" />
              </Pressable>
            </View>
          ))}
          {fotos.length < MAX_FOTOS ? (
            <Pressable onPress={() => adicionarFoto('camera')} style={[estilos.foto, estilos.adicionar, { borderColor: tema.borda, backgroundColor: tema.backgroundSelected }]} accessibilityRole="button" accessibilityLabel="Tirar foto" testID="tirar-foto">
              <Icone nome="camera" tamanho={28} cor={tema.marca} />
              <T variante="pequeno" cor={tema.marca}>
                Tirar
              </T>
            </Pressable>
          ) : null}
          {fotos.length < MAX_FOTOS ? (
            <Pressable onPress={() => adicionarFoto('galeria')} style={[estilos.foto, estilos.adicionar, { borderColor: tema.borda, backgroundColor: tema.backgroundSelected }]} accessibilityRole="button" accessibilityLabel="Escolher da galeria">
              <Icone nome="download" tamanho={28} cor={tema.marca} />
              <T variante="pequeno" cor={tema.marca}>
                Galeria
              </T>
            </Pressable>
          ) : null}
        </View>
        <Interruptor rotulo="Gravar onde estou" descricao="A coordenada do celular entra no registro, junto com data e hora." valor={comLocal} aoMudar={setComLocal} icone="mira" />
        <Interruptor
          rotulo="Já comuniquei o banco ou a seguradora"
          descricao={`Marca a comunicação em ${formatarData(hoje)}. Atraso pode tirar o direito à cobertura.`}
          valor={comunicado}
          aoMudar={setComunicado}
          icone="chat"
        />
      </Cartao>

      <Botao titulo="Registrar ocorrência" icone="check" aoTocar={salvar} carregando={salvando} desabilitado={!tipo} testID="salvar-ocorrencia" />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  nota: { minHeight: 90, paddingTop: 12, textAlignVertical: 'top' },
  fotos: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  foto: { width: 96, height: 96, borderRadius: Raio.medio, overflow: 'hidden' },
  imagem: { width: '100%', height: '100%' },
  removerFoto: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  adicionar: { borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 2 },
});
