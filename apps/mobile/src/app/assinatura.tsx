import { formatarNumero } from '@graoraiz/clima';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icone, Ilustracao, type NomeIcone } from '@/components/icone';
import { Aviso, Botao, Cartao, Chip, Linha, Medalha, T } from '@/components/ui';
import { MaxContentWidth, Raio, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { assinaturaDisponivel, carregarPlanos, comprar, type PlanoAssinatura, restaurarCompras } from '@/lib/assinatura';
import { PERMITE_SIMULAR_PRO, PRECOS_REFERENCIA, SITE_URL } from '@/lib/config';
import { informar } from '@/lib/dialogo';
import { definirProSimulado, usePro } from '@/lib/estado';

const BENEFICIOS: { icone: NomeIcone; titulo: string; texto: string }[] = [
  { icone: 'escudo', titulo: 'Prazo e prova para o Proagro e o seguro', texto: 'Eventos do clima detectados sozinhos, prazo para comunicar e dossiê em PDF com fotos e caderno.' },
  { icone: 'sino', titulo: 'Vigia completo, com aviso no celular', texto: 'Chuva sobre a aplicação, doença pelo clima, planto ou espero e secagem no terreiro.' },
  { icone: 'satelite', titulo: 'Olho do satélite', texto: 'Mapa de vigor a cada passagem e o tamanho das manchas fracas do talhão.' },
  { icone: 'microfone', titulo: 'Boletim falado toda manhã', texto: 'O resumo do talhão para ouvir no caminho da roça.' },
  { icone: 'calendario', titulo: '16 dias de previsão e 48 h de pulverização', texto: 'Hora a hora, com limites ajustados ao seu agrônomo.' },
  { icone: 'mapa', titulo: 'Talhões sem limite', texto: 'Cada talhão com a sua cultura, o seu solo e o seu ZARC.' },
];

const AREAS = [10, 50, 100, 300];
const CUSTOS = [80, 150, 250, 430];
const LOJA = Platform.OS === 'ios' ? 'App Store' : 'Google Play';

function reais(n: number): string {
  return `R$ ${n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

export default function AssinaturaScreen() {
  const router = useRouter();
  const tema = useTheme();
  const insets = useSafeAreaInsets();
  const pro = usePro();
  const disponivel = assinaturaDisponivel();
  const [planos, setPlanos] = useState<PlanoAssinatura[] | null>(disponivel ? null : []);
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [area, setArea] = useState(50);
  const [custo, setCusto] = useState(150);

  useEffect(() => {
    if (!disponivel) return;
    let ativo = true;
    carregarPlanos()
      .then((lista) => {
        if (!ativo) return;
        setPlanos(lista);
        setEscolhido(lista.find((p) => p.titulo === 'Anual')?.id ?? lista[0]?.id ?? null);
      })
      .catch(() => ativo && setPlanos([]));
    return () => {
      ativo = false;
    };
  }, [disponivel, tentativa]);

  const assinar = async () => {
    if (!escolhido) return;
    setOcupado(true);
    try {
      if (await comprar(escolhido)) router.back();
    } catch (e) {
      informar('Assinatura', e instanceof Error ? e.message : 'Não foi possível concluir a assinatura.');
    } finally {
      setOcupado(false);
    }
  };

  const perda = area * custo;

  return (
    <ScrollView style={{ backgroundColor: tema.background }} contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.five }}>
      <LinearGradient colors={['#0B3D22', '#17663A', '#2E8B57']} style={[estilos.capa, { paddingTop: insets.top + Spacing.three }]}>
        <View style={estilos.conteudo}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Fechar" style={estilos.fechar} hitSlop={10}>
            <Icone nome="fechar" tamanho={20} cor="#ffffff" />
          </Pressable>
          <View style={estilos.cena}>
            <Ilustracao nome="shield" tamanho={70} />
            <Ilustracao nome="man_farmer" tamanho={110} />
            <Ilustracao nome="satellite" tamanho={70} />
          </View>
          <T variante="rotulo" cor="#A8E6BF">
            Grão Raiz Pro
          </T>
          <T variante="titulo" cor="#ffffff" style={estilos.manchete}>
            Quando o tempo virar, o vigia já avisou — e guardou a prova.
          </T>
          <T cor="rgba(255,255,255,0.85)">Para não perder aplicação, safra nem indenização por um detalhe.</T>
        </View>
      </LinearGradient>

      <View style={[estilos.conteudo, estilos.corpo]}>
        {pro ? <Aviso tipo="bom" titulo="Pro ativo">Obrigado por assinar! Tudo liberado.</Aviso> : null}

        <Cartao testID="calculadora">
          <T variante="subtitulo">Quanto custa uma aplicação lavada pela chuva?</T>
          <T variante="rotulo">Área do talhão</T>
          <Linha>
            {AREAS.map((a) => (
              <Chip key={a} rotulo={`${a} ha`} ativo={area === a} aoTocar={() => setArea(a)} />
            ))}
          </Linha>
          <T variante="rotulo">Custo da aplicação (produto + operação)</T>
          <Linha>
            {CUSTOS.map((c) => (
              <Chip key={c} rotulo={`R$ ${c}/ha`} ativo={custo === c} aoTocar={() => setCusto(c)} />
            ))}
          </Linha>
          <View style={[estilos.resultado, { backgroundColor: tema.ruimSuave }]}>
            <T variante="pequeno" cor={tema.text}>
              Uma aplicação perdida
            </T>
            <T variante="numero" cor={tema.ruim}>
              {reais(perda)}
            </T>
          </View>
          <View style={[estilos.resultado, { backgroundColor: tema.bomSuave }]}>
            <T variante="pequeno" cor={tema.text}>
              Grão Raiz Pro no plano anual
            </T>
            <T variante="numero" cor={tema.bom}>
              {PRECOS_REFERENCIA.anualPorMes}
              <T variante="forte" cor={tema.bom}>
                {' '}
                por mês
              </T>
            </T>
            <T variante="pequeno" cor={tema.text}>
              Uma aplicação salva paga {formatarNumero(perda / 249.9, 0)} anos de assinatura.
            </T>
          </View>
        </Cartao>

        {BENEFICIOS.map((b) => (
          <View key={b.titulo} style={estilos.beneficio}>
            <Medalha icone={b.icone} cor={tema.marca} fundo={tema.marcaSuave} />
            <View style={estilos.flex}>
              <T variante="forte">{b.titulo}</T>
              <T variante="pequeno">{b.texto}</T>
            </View>
          </View>
        ))}

        {!pro && disponivel && planos === null ? <T>Carregando planos…</T> : null}

        {!pro && planos && planos.length > 0 ? (
          <>
            {planos.map((plano) => {
              const ativo = plano.id === escolhido;
              return (
                <Pressable
                  key={plano.id}
                  onPress={() => setEscolhido(plano.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: ativo }}
                  style={[estilos.plano, { borderColor: ativo ? tema.marca : tema.borda, backgroundColor: ativo ? tema.marcaSuave : tema.backgroundElement }]}>
                  <View style={estilos.flex}>
                    <T variante="forte">{plano.titulo}</T>
                    <T variante="pequeno">{plano.descricao}</T>
                  </View>
                  <T variante="subtitulo">{plano.preco}</T>
                </Pressable>
              );
            })}
            <Botao titulo="Assinar" icone="coroa" aoTocar={assinar} carregando={ocupado} desabilitado={!escolhido} testID="assinar" />
          </>
        ) : null}

        {!pro && disponivel && planos && planos.length === 0 ? (
          <Cartao>
            <T>Não foi possível carregar os planos da loja agora. Verifique a internet e tente de novo.</T>
            <Botao titulo="Tentar de novo" tipo="secundario" aoTocar={() => setTentativa((n) => n + 1)} />
          </Cartao>
        ) : null}

        {!pro && !disponivel ? (
          <>
            <View style={[estilos.plano, { borderColor: tema.marca, backgroundColor: tema.marcaSuave }]}>
              <View style={estilos.flex}>
                <View style={[estilos.selo, { backgroundColor: tema.marca }]}>
                  <T variante="pequeno" cor="#ffffff" style={estilos.textoSelo}>
                    Mais escolhido · economize 30%
                  </T>
                </View>
                <T variante="forte">Anual</T>
                <T variante="pequeno">14 dias grátis, depois {PRECOS_REFERENCIA.anual} por ano</T>
              </View>
              <T variante="subtitulo">{PRECOS_REFERENCIA.anualPorMes}/mês</T>
            </View>
            <View style={[estilos.plano, { borderColor: tema.borda, backgroundColor: tema.backgroundElement }]}>
              <View style={estilos.flex}>
                <T variante="forte">Mensal</T>
                <T variante="pequeno">Cancele quando quiser</T>
              </View>
              <T variante="subtitulo">{PRECOS_REFERENCIA.mensal}</T>
            </View>
            <T variante="pequeno" style={estilos.centro}>
              A assinatura será liberada quando o app estiver publicado na loja.
            </T>
            {PERMITE_SIMULAR_PRO ? (
              <Botao titulo="Simular Pro (desenvolvimento)" tipo="secundario" aoTocar={() => definirProSimulado(true)} testID="simular-pro-paywall" />
            ) : null}
          </>
        ) : null}

        {/* Restaurar fica sempre à mão (exigência da App Store), mesmo se os planos não carregarem. */}
        {!pro && disponivel ? (
          <Botao
            titulo="Restaurar compras"
            tipo="texto"
            aoTocar={async () => {
              const ok = await restaurarCompras().catch(() => false);
              informar('Restaurar compras', ok ? 'Assinatura Pro restaurada.' : 'Nenhuma assinatura ativa encontrada nesta conta da loja.');
            }}
          />
        ) : null}

        <T variante="pequeno" style={estilos.centro}>
          A assinatura renova automaticamente pela {LOJA} até ser cancelada. Cancele quando quiser nas assinaturas da sua conta da loja; o período grátis vale só na primeira assinatura. Sem anúncios.
        </T>
        <Linha style={estilos.links}>
          <Botao titulo="Termos de uso" tipo="texto" compacto aoTocar={() => WebBrowser.openBrowserAsync(`${SITE_URL}/termos`)} />
          <Botao titulo="Privacidade" tipo="texto" compacto aoTocar={() => WebBrowser.openBrowserAsync(`${SITE_URL}/privacidade`)} />
        </Linha>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  capa: { paddingBottom: Spacing.four, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  conteudo: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: Spacing.three, gap: Spacing.two },
  corpo: { gap: Spacing.three, paddingTop: Spacing.three },
  fechar: { alignSelf: 'flex-end', width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  cena: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: Spacing.two, marginBottom: Spacing.two },
  manchete: { fontSize: 30, lineHeight: 36 },
  resultado: { borderRadius: Raio.medio, padding: 14, gap: 2 },
  beneficio: { flexDirection: 'row', gap: Spacing.three, alignItems: 'center' },
  flex: { flex: 1, gap: 2 },
  plano: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderWidth: 2, borderRadius: Raio.grande - 4, padding: Spacing.three },
  selo: { alignSelf: 'flex-start', borderRadius: Raio.total, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 4 },
  textoSelo: { fontSize: 12, lineHeight: 16 },
  centro: { textAlign: 'center' },
  links: { justifyContent: 'center' },
});
