import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { Aviso, Botao, Cartao, T, Tela } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { assinaturaDisponivel, carregarPlanos, comprar, type PlanoAssinatura, restaurarCompras } from '@/lib/assinatura';
import { PERMITE_SIMULAR_PRO, PRECOS_REFERENCIA, SITE_URL } from '@/lib/config';
import { informar } from '@/lib/dialogo';
import { definirProSimulado, usePro } from '@/lib/estado';

const BENEFICIOS = [
  'Talhões ilimitados',
  'Pulverização hora a hora para as próximas 48 horas',
  'Aviso na véspera quando houver janela de pulverização',
  'Aviso de tempo firme para colheita e de veranico',
  'Limites de vento, ΔT e umidade ajustáveis',
  'Relatório da safra em PDF para Proagro, seguro e banco',
];

const LOJA = Platform.OS === 'ios' ? 'App Store' : 'Google Play';

export default function AssinaturaScreen() {
  const router = useRouter();
  const tema = useTheme();
  const pro = usePro();
  const disponivel = assinaturaDisponivel();
  const [planos, setPlanos] = useState<PlanoAssinatura[] | null>(disponivel ? null : []);
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [tentativa, setTentativa] = useState(0);

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

  return (
    <Tela comAbas={false} cabecalhoNativo>
      <T variante="titulo" cor={tema.marca}>
        Grão Raiz Pro
      </T>
      <Cartao>
        {BENEFICIOS.map((b) => (
          <T key={b}>✓ {b}</T>
        ))}
      </Cartao>

      {pro ? <Aviso tipo="bom" titulo="Pro ativo">Obrigado por assinar!</Aviso> : null}

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
                style={{ borderWidth: 2, borderColor: ativo ? tema.marca : tema.backgroundSelected, borderRadius: 16, padding: 16, gap: 2 }}>
                <T variante="forte">{plano.titulo}</T>
                <T variante="subtitulo">{plano.preco}</T>
                <T variante="pequeno">{plano.descricao}</T>
              </Pressable>
            );
          })}
          <Botao titulo="Assinar" aoTocar={assinar} carregando={ocupado} desabilitado={!escolhido} testID="assinar" />
        </>
      ) : null}

      {!pro && disponivel && planos && planos.length === 0 ? (
        <Cartao>
          <T>Não foi possível carregar os planos da loja agora. Verifique a internet e tente de novo.</T>
          <Botao titulo="Tentar de novo" tipo="secundario" aoTocar={() => setTentativa((n) => n + 1)} />
        </Cartao>
      ) : null}

      {!pro && !disponivel ? (
        <Cartao>
          <T variante="forte">Preço de lançamento</T>
          <T>
            {PRECOS_REFERENCIA.mensal} por mês ou {PRECOS_REFERENCIA.anual} por ano, com 14 dias grátis.
          </T>
          <T variante="pequeno">A assinatura será liberada quando o app estiver publicado na loja.</T>
          {PERMITE_SIMULAR_PRO ? (
            <Botao titulo="Simular Pro (desenvolvimento)" tipo="secundario" aoTocar={() => definirProSimulado(true)} testID="simular-pro-paywall" />
          ) : null}
        </Cartao>
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

      <View style={{ gap: 4 }}>
        <T variante="pequeno">
          A assinatura renova automaticamente pela {LOJA} até ser cancelada. Cancele quando quiser nas assinaturas da sua conta da loja; o período grátis, quando oferecido, vale só na primeira assinatura.
        </T>
        <Botao titulo="Termos de uso" tipo="texto" aoTocar={() => WebBrowser.openBrowserAsync(`${SITE_URL}/termos`)} />
        <Botao titulo="Política de privacidade" tipo="texto" aoTocar={() => WebBrowser.openBrowserAsync(`${SITE_URL}/privacidade`)} />
      </View>
    </Tela>
  );
}
