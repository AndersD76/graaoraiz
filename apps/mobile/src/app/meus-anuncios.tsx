import { formatarReais, type MeuAnuncio } from '@graoraiz/clima';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Aviso, Botao, Campo, Cartao, Carregando, Grade, Linha, Selo, T, Tela } from '@/components/ui';
import { Raio, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ErroConta } from '@/lib/conta';
import { confirmar, informar } from '@/lib/dialogo';
import { marcarVendido, mudarSituacao, tirarDoAr, urlFoto, useMeusAnuncios } from '@/lib/maquinas';
import { lerValorDigitado } from '@/lib/precos';

const SITUACAO: Record<MeuAnuncio['situacao'], { status: 'bom' | 'atencao' | 'ruim'; texto: string }> = {
  ativo: { status: 'bom', texto: 'No ar' },
  pausado: { status: 'atencao', texto: 'Pausado' },
  vendido: { status: 'bom', texto: 'Vendido' },
  removido: { status: 'ruim', texto: 'Fora do ar' },
};

function ItemMeuAnuncio({ anuncio, aoMudar }: { anuncio: MeuAnuncio; aoMudar: () => void }) {
  const router = useRouter();
  const tema = useTheme();
  const [vendendo, setVendendo] = useState(false);
  const [valor, setValor] = useState(anuncio.preco.toLocaleString('pt-BR'));
  const [ocupado, setOcupado] = useState(false);
  const s = SITUACAO[anuncio.situacao];

  const executar = async (acao: () => Promise<unknown>) => {
    setOcupado(true);
    try {
      await acao();
      aoMudar();
    } catch (e) {
      informar('Meus anúncios', e instanceof ErroConta ? e.message : 'Não deu para salvar agora. Tente de novo.');
    } finally {
      setOcupado(false);
    }
  };

  const confirmarVenda = () => {
    const v = lerValorDigitado(valor);
    if (!v) return informar('Vendi', 'Informe o valor da venda, ex.: 280.000.');
    void executar(async () => {
      const r = await marcarVendido(anuncio.id, v);
      informar(
        'Parabéns pela venda!',
        `A comissão de ${r.comissaoPercentual.toLocaleString('pt-BR')}% ficou em ${formatarReais(r.comissaoValor)}. Vamos te chamar no WhatsApp ${anuncio.whatsapp} para combinar o PIX.`,
      );
    });
  };

  return (
    <Cartao testID={`meu-anuncio-${anuncio.id}`}>
      <Linha style={estilos.topo}>
        <View style={[estilos.foto, { backgroundColor: tema.backgroundSelected }]}>
          {anuncio.foto ? <Image source={{ uri: urlFoto(anuncio.foto) }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
        </View>
        <View style={estilos.flex}>
          <T variante="forte" numberOfLines={2}>
            {anuncio.titulo}
          </T>
          <T variante="subtitulo" cor={tema.marca}>
            {formatarReais(anuncio.preco)}
          </T>
          <Selo status={s.status} texto={s.texto} />
        </View>
      </Linha>
      <T variante="pequeno">
        {anuncio.contatos === 0 ? 'Ninguém pediu o contato ainda.' : `${anuncio.contatos} ${anuncio.contatos === 1 ? 'pessoa pediu' : 'pessoas pediram'} o seu WhatsApp.`}
      </T>

      {anuncio.situacao === 'vendido' ? (
        <Aviso tipo={anuncio.comissaoPaga ? 'bom' : 'info'}>
          {`Vendido por ${formatarReais(anuncio.valorVenda ?? 0)}. Comissão de ${anuncio.comissaoPercentual.toLocaleString('pt-BR')}%: ${formatarReais(anuncio.comissaoValor ?? 0)}${anuncio.comissaoPaga ? ', paga. Obrigado!' : '. Vamos te chamar no WhatsApp para combinar o PIX.'}`}
        </Aviso>
      ) : vendendo ? (
        <>
          <Campo rotulo="Valor da venda (R$)" value={valor} onChangeText={setValor} keyboardType="decimal-pad" maxLength={16} testID={`valor-venda-${anuncio.id}`} />
          <T variante="pequeno">
            A comissão é de {anuncio.comissaoPercentual.toLocaleString('pt-BR')}% sobre esse valor
            {lerValorDigitado(valor) ? `: ${formatarReais(Math.round(((lerValorDigitado(valor) ?? 0) * anuncio.comissaoPercentual) / 100))}` : ''}.
          </T>
          <Linha>
            <View style={estilos.flex}>
              <Botao titulo="Confirmar venda" icone="check" carregando={ocupado} aoTocar={confirmarVenda} testID={`confirmar-venda-${anuncio.id}`} />
            </View>
            <View style={estilos.flex}>
              <Botao titulo="Cancelar" tipo="texto" aoTocar={() => setVendendo(false)} />
            </View>
          </Linha>
        </>
      ) : (
        <Linha>
          <Botao titulo="Ver" tipo="secundario" compacto aoTocar={() => router.push({ pathname: '/maquina/[id]', params: { id: anuncio.id } })} />
          <Botao titulo="Editar" tipo="secundario" compacto icone="editar" aoTocar={() => router.push({ pathname: '/anunciar', params: { id: anuncio.id } })} />
          <Botao
            titulo={anuncio.situacao === 'pausado' ? 'Voltar ao ar' : 'Pausar'}
            tipo="secundario"
            compacto
            desabilitado={ocupado}
            aoTocar={() => void executar(() => mudarSituacao(anuncio.id, anuncio.situacao === 'pausado' ? 'ativo' : 'pausado'))}
          />
          <Botao titulo="Vendi" compacto icone="dinheiro" aoTocar={() => setVendendo(true)} testID={`vendi-${anuncio.id}`} />
          <Botao
            titulo="Tirar do ar"
            tipo="perigo"
            compacto
            desabilitado={ocupado}
            aoTocar={async () => {
              if (await confirmar('Tirar do ar', 'O anúncio sai do Grão Raiz de vez. Se só quer dar um tempo, use "Pausar".', 'Tirar do ar')) {
                void executar(() => tirarDoAr(anuncio.id));
              }
            }}
          />
        </Linha>
      )}
    </Cartao>
  );
}

/** Anúncios da conta: situação, interessados, vendas e comissão. */
export default function MeusAnunciosScreen() {
  const router = useRouter();
  const { anuncios, erro, atualizar } = useMeusAnuncios();
  // Ao voltar da edição, busca de novo.
  useFocusEffect(useCallback(() => atualizar(), [atualizar]));

  return (
    <Tela comAbas={false} cabecalhoNativo aoAtualizar={atualizar}>
      <Botao titulo="Anunciar outra máquina" icone="mais" aoTocar={() => router.push('/anunciar')} />
      {erro ? <Aviso tipo="atencao">{erro}</Aviso> : null}
      {!anuncios && !erro ? <Carregando texto="Buscando seus anúncios…" /> : null}
      {anuncios && anuncios.length === 0 ? (
        <Cartao>
          <T variante="subtitulo">Nenhum anúncio ainda</T>
          <T variante="pequeno">Anuncie a máquina ou o implemento que está parado no galpão. É grátis.</T>
        </Cartao>
      ) : null}
      {anuncios && anuncios.length > 0 ? (
        <Grade larguraMinima={340} maxColunas={2}>
          {anuncios.map((a) => (
            <ItemMeuAnuncio key={a.id} anuncio={a} aoMudar={atualizar} />
          ))}
        </Grade>
      ) : null}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: { flexWrap: 'nowrap', alignItems: 'flex-start' },
  foto: { width: 96, height: 72, borderRadius: Raio.pequeno, overflow: 'hidden' },
  flex: { flex: 1, minWidth: 0, gap: 4 },
  gap: { gap: Spacing.two },
});
