import { LIMIARES_PULVERIZACAO_PADRAO, type LimiaresPulverizacao, type PreferenciasAvisos } from '@graoraiz/clima';
import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { Linking, View } from 'react-native';

import { Aviso, Botao, Cartao, Chip, Interruptor, Linha, T, Tela } from '@/components/ui';
import { assinaturaDisponivel, atualizarStatusAssinatura, restaurarCompras } from '@/lib/assinatura';
import { pedirPermissaoNotificacoes, type PermissaoAvisos, permissaoAvisos, reagendarAvisos } from '@/lib/avisos';
import { PERMITE_SIMULAR_PRO, SITE_URL } from '@/lib/config';
import { confirmar, informar } from '@/lib/dialogo';
import { apagarTudo, definirProSimulado, salvarLimiares, salvarPreferencias, useEstado, usePro } from '@/lib/estado';

const HORAS_AVISO = [17, 18, 19, 20];

function Ajuste({ rotulo, valor, unidade, passo, min, max, aoMudar, bloqueado }: {
  rotulo: string; valor: number; unidade: string; passo: number; min: number; max: number; aoMudar: (v: number) => void; bloqueado: boolean;
}) {
  return (
    <Linha style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
      <T style={{ flex: 1 }}>{rotulo}</T>
      <Botao titulo="−" tipo="secundario" desabilitado={bloqueado || valor - passo < min} aoTocar={() => aoMudar(Math.round((valor - passo) * 10) / 10)} />
      <T variante="forte" style={{ minWidth: 72, textAlign: 'center' }}>
        {valor} {unidade}
      </T>
      <Botao titulo="+" tipo="secundario" desabilitado={bloqueado || valor + passo > max} aoTocar={() => aoMudar(Math.round((valor + passo) * 10) / 10)} />
    </Linha>
  );
}

export default function AjustesScreen() {
  const router = useRouter();
  const estado = useEstado();
  const pro = usePro();
  const p = estado.preferencias;
  const L = estado.limiares;
  const [permissao, setPermissao] = useState<PermissaoAvisos>({ estado: 'pendente', podePedir: true });
  const [restaurando, setRestaurando] = useState(false);

  // Relê ao voltar para a tela (o usuário pode ter mudado nas configurações do celular).
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      void permissaoAvisos().then((s) => ativo && setPermissao(s));
      return () => {
        ativo = false;
      };
    }, []),
  );

  const permitirAvisos = async () => {
    // Depois de negado, o sistema não mostra mais o pedido: só nas configurações do celular.
    if (!permissao.podePedir) {
      await Linking.openSettings();
      return;
    }
    const ok = await pedirPermissaoNotificacoes();
    setPermissao(await permissaoAvisos());
    if (ok) void reagendarAvisos({ buscar: true });
  };

  const mudarPreferencias = (novas: Partial<PreferenciasAvisos>) => {
    salvarPreferencias({ ...p, ...novas });
    void reagendarAvisos();
  };
  const mudarLimiares = (novos: LimiaresPulverizacao) => salvarLimiares(novos);

  return (
    <Tela titulo="Ajustes">
      <Cartao>
        <T variante="subtitulo">Avisos no celular</T>
        {permissao.estado !== 'concedida' ? (
          <>
            <Aviso tipo="atencao">
              {permissao.podePedir
                ? 'Os avisos estão desligados no celular.'
                : 'Os avisos foram bloqueados no celular. Ligue em Configurações → Notificações → Grão Raiz.'}
            </Aviso>
            <Botao titulo={permissao.podePedir ? 'Permitir avisos' : 'Abrir configurações do celular'} aoTocar={permitirAvisos} />
          </>
        ) : null}
        <Interruptor rotulo="Geada" descricao="Na tarde anterior à madrugada fria." valor={p.geada} aoMudar={(geada) => mudarPreferencias({ geada })} />
        <Interruptor rotulo="Temporal" descricao="Trovoada, granizo ou ventania, algumas horas antes." valor={p.temporal} aoMudar={(temporal) => mudarPreferencias({ temporal })} />
        <Interruptor
          rotulo="Janela de pulverização"
          descricao="Na véspera, quando o dia seguinte tiver horário bom."
          valor={p.pulverizacao}
          aoMudar={(pulverizacao) => mudarPreferencias({ pulverizacao })}
          bloqueado={!pro}
        />
        <Interruptor rotulo="Tempo firme" descricao="Quando vierem 3 dias ou mais sem chuva." valor={p.janelaSeca} aoMudar={(janelaSeca) => mudarPreferencias({ janelaSeca })} bloqueado={!pro} />
        <Interruptor rotulo="Veranico" descricao="10 dias sem chuva com lavoura plantada." valor={p.veranico} aoMudar={(veranico) => mudarPreferencias({ veranico })} bloqueado={!pro} />
        <T variante="forte">Horário do aviso de pulverização</T>
        <Linha>
          {HORAS_AVISO.map((h) => (
            <Chip key={h} rotulo={`${h}h`} ativo={p.horaPulverizacao === h} aoTocar={() => mudarPreferencias({ horaPulverizacao: h })} />
          ))}
        </Linha>
        <T variante="pequeno">
          Avisos de geada moderada e tempo firme não tocam entre {p.silencioInicio}h e {p.silencioFim}h. Temporal e geada forte avisam a qualquer hora.
        </T>
      </Cartao>

      <Cartao>
        <T variante="subtitulo">Limites de pulverização{pro ? '' : ' · Pro'}</T>
        <T variante="pequeno">Ajuste aos critérios do seu agrônomo ou da bula do produto.</T>
        <Ajuste rotulo="Vento máximo ideal" valor={L.vento2m.idealMaximo} unidade="km/h" passo={1} min={L.vento2m.minimo + 1} max={L.vento2m.maximo} bloqueado={!pro}
          aoMudar={(v) => mudarLimiares({ ...L, vento2m: { ...L.vento2m, idealMaximo: v } })} />
        <Ajuste rotulo="ΔT máximo ideal" valor={L.deltaT.idealMaximo} unidade="°C" passo={0.5} min={L.deltaT.idealMinimo + 1} max={L.deltaT.maximo} bloqueado={!pro}
          aoMudar={(v) => mudarLimiares({ ...L, deltaT: { ...L.deltaT, idealMaximo: v } })} />
        <Ajuste rotulo="Umidade mínima ideal" valor={L.umidade.idealMinima} unidade="%" passo={5} min={L.umidade.minima} max={90} bloqueado={!pro}
          aoMudar={(v) => mudarLimiares({ ...L, umidade: { ...L.umidade, idealMinima: v } })} />
        <Ajuste rotulo="Temperatura máxima ideal" valor={L.temperatura.idealMaxima} unidade="°C" passo={1} min={20} max={L.temperatura.maxima} bloqueado={!pro}
          aoMudar={(v) => mudarLimiares({ ...L, temperatura: { ...L.temperatura, idealMaxima: v } })} />
        <Ajuste rotulo="Horas sem chuva depois" valor={L.chuva.horasSemChuvaApos} unidade="h" passo={1} min={1} max={12} bloqueado={!pro}
          aoMudar={(v) => mudarLimiares({ ...L, chuva: { ...L.chuva, horasSemChuvaApos: v } })} />
        {pro ? <Botao titulo="Voltar aos padrões" tipo="texto" aoTocar={() => mudarLimiares(LIMIARES_PULVERIZACAO_PADRAO)} /> : null}
      </Cartao>

      <Cartao>
        <T variante="subtitulo">Assinatura</T>
        <T>{pro ? 'Você tem o Grão Raiz Pro.' : 'Plano grátis.'}</T>
        {!pro ? <Botao titulo="Conhecer o Pro" aoTocar={() => router.push('/assinatura')} testID="ajustes-pro" /> : null}
        {assinaturaDisponivel() ? (
          <Botao
            titulo="Restaurar compras"
            tipo="secundario"
            carregando={restaurando}
            aoTocar={async () => {
              setRestaurando(true);
              try {
                const ok = await restaurarCompras();
                informar('Restaurar compras', ok ? 'Assinatura Pro restaurada.' : 'Nenhuma assinatura ativa encontrada nesta conta da loja.');
              } catch {
                informar('Restaurar compras', 'Não foi possível falar com a loja agora. Tente de novo mais tarde.');
              } finally {
                setRestaurando(false);
              }
            }}
          />
        ) : null}
        {PERMITE_SIMULAR_PRO ? (
          <Interruptor rotulo="Simular Pro (desenvolvimento)" valor={estado.proSimulado} aoMudar={definirProSimulado} testID="simular-pro" />
        ) : null}
      </Cartao>

      <Cartao>
        <T variante="subtitulo">Seus dados</T>
        <T variante="pequeno">Talhões, anotações e ajustes ficam só neste celular. Para buscar a previsão, o app envia a localização do talhão arredondada (cerca de 1 km), sem identificar você.</T>
        <Botao
          titulo="Apagar todos os meus dados"
          tipo="perigo"
          testID="apagar-dados"
          aoTocar={async () => {
            const ok = await confirmar('Apagar tudo', 'Isso apaga talhões, anotações de chuva, ocorrências e ajustes deste celular. Não dá para desfazer.', 'Apagar');
            if (!ok) return;
            apagarTudo();
            void reagendarAvisos(); // sem talhões: cancela os avisos agendados
            void atualizarStatusAssinatura(); // a assinatura é da conta da loja, não do aparelho
            router.replace('/onboarding');
          }}
        />
      </Cartao>

      <View style={{ gap: 4 }}>
        <Botao titulo="Política de privacidade" tipo="texto" aoTocar={() => WebBrowser.openBrowserAsync(`${SITE_URL}/privacidade`)} />
        <Botao titulo="Termos de uso" tipo="texto" aoTocar={() => WebBrowser.openBrowserAsync(`${SITE_URL}/termos`)} />
        <T variante="pequeno" style={{ textAlign: 'center' }}>
          Grão Raiz {Constants.expoConfig?.version ?? ''} · Dados meteorológicos: Open-Meteo.com (CC BY 4.0)
        </T>
      </View>
    </Tela>
  );
}
