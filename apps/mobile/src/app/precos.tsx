import { CULTURAS, type Cultura } from '@graoraiz/clima';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Icone } from '@/components/icone';
import { Aviso, Botao, Campo, Cartao, Carregando, Divisor, Linha, Secao, T, Tela } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { pedirPermissaoNotificacoes, reagendarAvisos } from '@/lib/avisos';
import { informar } from '@/lib/dialogo';
import { salvarAlertaPreco, useEstado } from '@/lib/estado';
import { formatarDataPreco, formatarPreco, type Indicador, lerValorDigitado, usePrecos } from '@/lib/precos';

function paraCampo(n: number | null | undefined): string {
  return n ? n.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : '';
}

/** Resumo do aviso de preço do indicador ("Aviso acima de R$ 160,00 (avisado)"). */
function ResumoAlerta({ i }: { i: Indicador }) {
  const tema = useTheme();
  const { alertasPreco, avisosEntregues } = useEstado();
  const a = alertasPreco.find((x) => x.indicador === i.id);
  if (!a) return null;
  const parte = (direcao: 'acima' | 'abaixo', valor: number | null) =>
    valor === null
      ? null
      : `${direcao} de ${formatarPreco({ valor, unidade: i.unidade })}${avisosEntregues.includes(`preco:${i.id}:${direcao}:${valor}`) ? ' (avisado)' : ''}`;
  const partes = [parte('acima', a.acima), parte('abaixo', a.abaixo)].filter(Boolean);
  return (
    <Linha style={estilos.alerta} testID={`resumo-alerta-${i.id}`}>
      <Icone nome="sino" tamanho={16} cor={tema.destaque} />
      <T variante="pequeno" cor={tema.destaque} style={estilos.flex}>
        Aviso {partes.join(' · ')}
      </T>
    </Linha>
  );
}

/** Preço-alvo: avisa no celular (uma vez) quando o indicador passar de um valor ou cair abaixo de outro. */
function EditorAlerta({ i, aoFechar }: { i: Indicador; aoFechar: () => void }) {
  const { alertasPreco } = useEstado();
  const atual = alertasPreco.find((a) => a.indicador === i.id);
  const [acima, setAcima] = useState(paraCampo(atual?.acima));
  const [abaixo, setAbaixo] = useState(paraCampo(atual?.abaixo));
  const unidade = i.unidade.replace('centavos de R$/', '¢/').replace('R$/', '');

  const salvar = async () => {
    const a = lerValorDigitado(acima);
    const b = lerValorDigitado(abaixo);
    if ((acima.trim() && a === null) || (abaixo.trim() && b === null)) {
      informar('Preço-alvo', 'Digite só o valor, por exemplo 160 ou 160,50.');
      return;
    }
    salvarAlertaPreco({ indicador: i.id, acima: a, abaixo: b });
    aoFechar();
    if (a === null && b === null) return;
    if (Platform.OS === 'web') {
      informar('Aviso salvo', 'No app do celular você recebe a notificação quando o preço chegar.');
      return;
    }
    if (!(await pedirPermissaoNotificacoes())) {
      informar('Notificações desligadas', 'Permita as notificações do Grão Raiz nas configurações do celular para receber o aviso de preço.');
      return;
    }
    void reagendarAvisos();
  };

  return (
    <View style={estilos.editor}>
      <Campo
        rotulo={`Avisar quando passar de (${unidade})`}
        value={acima}
        onChangeText={setAcima}
        keyboardType="decimal-pad"
        placeholder={paraCampo(Math.ceil(i.valor * 1.05))}
        testID={`alvo-acima-${i.id}`}
      />
      <Campo
        rotulo={`Avisar quando cair abaixo de (${unidade})`}
        value={abaixo}
        onChangeText={setAbaixo}
        keyboardType="decimal-pad"
        placeholder={paraCampo(Math.floor(i.valor * 0.95))}
        testID={`alvo-abaixo-${i.id}`}
      />
      <Botao titulo="Salvar aviso" icone="sino" aoTocar={salvar} testID={`salvar-alvo-${i.id}`} />
      {atual ? (
        <Botao
          titulo="Tirar o aviso"
          tipo="texto"
          aoTocar={() => {
            salvarAlertaPreco({ indicador: i.id, acima: null, abaixo: null });
            aoFechar();
          }}
        />
      ) : null}
      <T variante="pequeno">
        O app confere o Cepea quando você abre e a cada poucas horas, e avisa uma vez quando o preço chegar. Para outro aviso, marque um novo valor.
      </T>
    </View>
  );
}

function LinhaPreco({ i, aoTocar }: { i: Indicador; aoTocar: () => void }) {
  return (
    <Pressable onPress={aoTocar} accessibilityRole="button" accessibilityLabel={`${i.produto}: marcar aviso de preço`}>
      <Linha style={estilos.linha} testID={`preco-${i.id}`}>
      <View style={estilos.flex}>
        <T variante="forte">{i.produto}</T>
        <T variante="pequeno">
          {i.praca} · {i.unidade}
        </T>
      </View>
      <View style={estilos.direita}>
        <T variante="forte">{formatarPreco(i)}</T>
        <T variante="pequeno">{formatarDataPreco(i.data)}</T>
      </View>
    </Linha>
    </Pressable>
  );
}

/** Preços de referência do dia (Cepea/Esalq-USP) e dólar PTAX, com as culturas do produtor primeiro. */
export default function PrecosScreen() {
  const tema = useTheme();
  const { talhoes, alertasPreco } = useEstado();
  const { precos, carregando, erro, desatualizado, atualizar } = usePrecos();
  const [editando, setEditando] = useState<number | null>(null);
  const alternar = (id: number) => setEditando((atual) => (atual === id ? null : id));

  const minhas = new Set(talhoes.map((t) => t.cultura).filter((c): c is Cultura => c !== null));
  const daLavoura = precos?.indicadores.filter((i) => i.culturas.some((c) => minhas.has(c as Cultura))) ?? [];
  const outros = precos?.indicadores.filter((i) => !daLavoura.includes(i)) ?? [];
  const semPreco = [...minhas].filter((c) => !precos?.indicadores.some((i) => i.culturas.includes(c)));

  return (
    <Tela comAbas={false} cabecalhoNativo aoAtualizar={atualizar} atualizando={carregando && precos !== null}>
      {!precos && carregando ? <Carregando texto="Buscando os preços do dia…" /> : null}
      {erro && !precos ? <Aviso tipo="atencao" titulo="Sem preços agora">{erro}</Aviso> : null}
      {erro && precos && desatualizado ? (
        <Aviso tipo="atencao">Sem conexão: mostrando a última consulta. Puxe para baixo para tentar de novo.</Aviso>
      ) : null}

      {daLavoura.length > 0 ? (
        <>
          <Secao titulo="Da sua lavoura" />
          {daLavoura.map((i) => (
            <Cartao key={i.id} tom="marca" testID={`destaque-${i.id}`}>
              <T variante="rotulo">
                {i.produto} · {i.praca}
              </T>
              <T variante="numero" cor={tema.marca}>
                {formatarPreco(i)}
              </T>
              <T variante="pequeno">
                {i.unidade} · indicador de {formatarDataPreco(i.data)}
              </T>
              <ResumoAlerta i={i} />
              {editando === i.id ? (
                <EditorAlerta i={i} aoFechar={() => setEditando(null)} />
              ) : (
                <Botao
                  titulo={alertasPreco.some((a) => a.indicador === i.id) ? 'Mudar aviso de preço' : 'Avisar preço-alvo'}
                  tipo="texto"
                  icone="sino"
                  aoTocar={() => alternar(i.id)}
                  testID={`alvo-${i.id}`}
                />
              )}
            </Cartao>
          ))}
        </>
      ) : null}
      {semPreco.length > 0 && precos ? (
        <T variante="pequeno">
          Sem indicador diário do Cepea para {semPreco.map((c) => CULTURAS[c].rotulo.toLowerCase()).join(', ')}.
        </T>
      ) : null}

      {precos?.dolar ? (
        <Cartao testID="dolar">
          <Linha style={estilos.linha}>
            <View style={estilos.flex}>
              <T variante="forte">Dólar</T>
              <T variante="pequeno">PTAX venda · Banco Central</T>
            </View>
            <View style={estilos.direita}>
              <T variante="forte">R$ {precos.dolar.valor.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</T>
              <T variante="pequeno">{formatarDataPreco(precos.dolar.data)}</T>
            </View>
          </Linha>
        </Cartao>
      ) : null}

      {outros.length > 0 ? (
        <>
          <Secao titulo="Outros produtos" />
          <T variante="pequeno">Toque num produto para marcar um aviso de preço.</T>
          <Cartao>
            {outros.map((i, n) => (
              <View key={i.id}>
                {n > 0 ? <Divisor /> : null}
                <LinhaPreco i={i} aoTocar={() => alternar(i.id)} />
                <ResumoAlerta i={i} />
                {editando === i.id ? <EditorAlerta i={i} aoFechar={() => setEditando(null)} /> : null}
              </View>
            ))}
          </Cartao>
        </>
      ) : null}

      {precos ? (
        <T variante="pequeno" cor={tema.textSecondary}>
          {precos.fontes} Preço de referência do mercado físico: o valor na sua cooperativa ou cerealista pode ser diferente.
        </T>
      ) : null}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  linha: { alignItems: 'center', flexWrap: 'nowrap' },
  flex: { flex: 1 },
  direita: { alignItems: 'flex-end' },
  alerta: { alignItems: 'center', gap: 6, flexWrap: 'nowrap' },
  editor: { gap: 10, paddingTop: 6 },
});
