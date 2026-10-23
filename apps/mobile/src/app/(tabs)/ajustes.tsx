import { LIMIARES_PULVERIZACAO_PADRAO, type LimiaresPulverizacao, type PreferenciasAvisos } from '@graoraiz/clima';
import Constants from 'expo-constants';
import { useFocusEffect, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { Aviso, Botao, Campo, Cartao, Chip, Divisor, Interruptor, Linha, T, Tela } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { assinaturaDisponivel, atualizarStatusAssinatura, restaurarCompras } from '@/lib/assinatura';
import { pedirPermissaoNotificacoes, type PermissaoAvisos, permissaoAvisos, reagendarAvisos } from '@/lib/avisos';
import { PERMITE_SIMULAR_PRO, SITE_URL } from '@/lib/config';
import { confirmar, informar } from '@/lib/dialogo';
import {
  apagarTudo,
  definirProSimulado,
  definirTema,
  salvarLimiares,
  salvarPreferencias,
  salvarProdutor,
  salvarSeguro,
  TIPOS_SEGURO,
  useEstado,
  usePro,
} from '@/lib/estado';

const HORAS_PULVERIZACAO = [17, 18, 19, 20];
const HORAS_BOLETIM = [5, 6, 7, 8];
const PRAZOS = [null, 3, 5, 7, 10, 15] as const;

function Ajuste({ rotulo, valor, unidade, passo, min, max, aoMudar, bloqueado }: {
  rotulo: string; valor: number; unidade: string; passo: number; min: number; max: number; aoMudar: (v: number) => void; bloqueado: boolean;
}) {
  return (
    <Linha style={estilos.ajuste}>
      <T style={estilos.flex}>{rotulo}</T>
      <Botao titulo="−" tipo="secundario" compacto desabilitado={bloqueado || valor - passo < min} aoTocar={() => aoMudar(Math.round((valor - passo) * 10) / 10)} />
      <T variante="forte" style={estilos.valorAjuste}>
        {valor} {unidade}
      </T>
      <Botao titulo="+" tipo="secundario" compacto desabilitado={bloqueado || valor + passo > max} aoTocar={() => aoMudar(Math.round((valor + passo) * 10) / 10)} />
    </Linha>
  );
}

export default function AjustesScreen() {
  const router = useRouter();
  const tema = useTheme();
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
        <T variante="subtitulo">Aparência</T>
        <Linha>
          <Chip rotulo="Automático" icone="nuvemSol" ativo={estado.tema === 'auto'} aoTocar={() => definirTema('auto')} testID="tema-auto" />
          <Chip rotulo="Claro" icone="sol" ativo={estado.tema === 'claro'} aoTocar={() => definirTema('claro')} testID="tema-claro" />
          <Chip rotulo="Escuro" icone="lua" ativo={estado.tema === 'escuro'} aoTocar={() => definirTema('escuro')} testID="tema-escuro" />
        </Linha>
        <T variante="pequeno">No automático, segue o tema do celular. O claro lê melhor sob sol forte.</T>
      </Cartao>

      <Cartao>
        <T variante="subtitulo">Você</T>
        <Campo rotulo="Seu nome (boletim e dossiê)" value={estado.produtor} onChangeText={salvarProdutor} placeholder="Ex.: Daniel" maxLength={40} testID="campo-produtor" />
      </Cartao>

      <Cartao>
        <T variante="subtitulo">Proagro e seguro</T>
        <T variante="pequeno">Com isso o caderno e o dossiê mostram até quando comunicar cada evento do clima.</T>
        <Linha>
          {TIPOS_SEGURO.map((s) => (
            <Chip key={s.valor} rotulo={s.rotulo} ativo={estado.seguro.tipo === s.valor} aoTocar={() => salvarSeguro({ ...estado.seguro, tipo: s.valor })} testID={`seguro-${s.valor}`} />
          ))}
        </Linha>
        {estado.seguro.tipo !== 'nenhum' ? (
          <>
            <Campo
              rotulo="Banco, cooperativa ou seguradora"
              value={estado.seguro.agente}
              onChangeText={(agente) => salvarSeguro({ ...estado.seguro, agente })}
              placeholder="Ex.: Sicredi"
              maxLength={60}
            />
            <T variante="rotulo">Prazo do contrato para comunicar perda</T>
            <Linha>
              {PRAZOS.map((d) => (
                <Chip key={String(d)} rotulo={d === null ? 'Não sei' : `${d} dias`} ativo={estado.seguro.prazoDias === d} aoTocar={() => salvarSeguro({ ...estado.seguro, prazoDias: d })} testID={`prazo-${d ?? 'nao-sei'}`} />
              ))}
            </Linha>
            <T variante="pequeno">Confira no contrato ou com o gerente. Na dúvida, comunique a perda assim que perceber.</T>
          </>
        ) : null}
      </Cartao>

      <Cartao>
        <T variante="subtitulo">Avisos no celular</T>
        {permissao.estado !== 'concedida' ? (
          <>
            <Aviso tipo="atencao">
              {permissao.podePedir
                ? 'Os avisos estão desligados no celular. Sem eles o vigia não consegue chamar você.'
                : 'Os avisos foram bloqueados no celular. Ligue em Configurações → Notificações → Grão Raiz.'}
            </Aviso>
            <Botao titulo={permissao.podePedir ? 'Permitir avisos' : 'Abrir configurações do celular'} icone="sino" aoTocar={permitirAvisos} />
          </>
        ) : null}
        <Interruptor icone="chuva" rotulo="Chuva chegando" descricao="Umas 2 h antes: cobrir o café, recolher a máquina." valor={p.chuva} aoMudar={(chuva) => mudarPreferencias({ chuva })} />
        <Interruptor icone="raio" rotulo="Temporal" descricao="Trovoada, granizo ou ventania, algumas horas antes." valor={p.temporal} aoMudar={(temporal) => mudarPreferencias({ temporal })} />
        <Interruptor icone="geada" rotulo="Geada" descricao="Na tarde anterior à madrugada fria." valor={p.geada} aoMudar={(geada) => mudarPreferencias({ geada })} />
        <Divisor />
        <Interruptor icone="microfone" rotulo="Boletim da manhã" descricao="O resumo do vigia todo dia, no horário escolhido." valor={p.boletim} aoMudar={(boletim) => mudarPreferencias({ boletim })} bloqueado={!pro} />
        {pro && p.boletim ? (
          <Linha>
            {HORAS_BOLETIM.map((h) => (
              <Chip key={h} rotulo={`${h}h`} ativo={p.horaBoletim === h} aoTocar={() => mudarPreferencias({ horaBoletim: h })} />
            ))}
          </Linha>
        ) : null}
        <Interruptor icone="pulverizador" rotulo="Janela de pulverização" descricao="Na véspera, quando o dia seguinte tiver horário bom." valor={p.pulverizacao} aoMudar={(pulverizacao) => mudarPreferencias({ pulverizacao })} bloqueado={!pro} />
        {pro && p.pulverizacao ? (
          <Linha>
            {HORAS_PULVERIZACAO.map((h) => (
              <Chip key={h} rotulo={`${h}h`} ativo={p.horaPulverizacao === h} aoTocar={() => mudarPreferencias({ horaPulverizacao: h })} />
            ))}
          </Linha>
        ) : null}
        <Interruptor icone="gota" rotulo="Chuva sobre a aplicação" descricao="Quando chover no prazo do produto que você aplicou." valor={p.lavagem} aoMudar={(lavagem) => mudarPreferencias({ lavagem })} bloqueado={!pro} />
        <Interruptor icone="praga" rotulo="Doença pelo clima" descricao="Risco alto de ferrugem, míldio, requeima e outras da sua cultura." valor={p.doenca} aoMudar={(doenca) => mudarPreferencias({ doenca })} bloqueado={!pro} />
        <Interruptor icone="sol" rotulo="Tempo firme" descricao="Quando vierem 3 dias ou mais sem chuva." valor={p.janelaSeca} aoMudar={(janelaSeca) => mudarPreferencias({ janelaSeca })} bloqueado={!pro} />
        <Interruptor icone="semChuva" rotulo="Veranico" descricao="10 dias sem chuva com lavoura plantada." valor={p.veranico} aoMudar={(veranico) => mudarPreferencias({ veranico })} bloqueado={!pro} />
        <T variante="pequeno">
          Avisos não urgentes não tocam entre {p.silencioInicio}h e {p.silencioFim}h. Temporal, chuva chegando e geada forte avisam a qualquer hora.
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

      <Cartao tom={pro ? 'marca' : 'destaque'}>
        <T variante="subtitulo">Assinatura</T>
        <T cor={tema.text}>{pro ? 'Você tem o Grão Raiz Pro. Obrigado!' : 'Plano grátis: 1 talhão, previsão de 7 dias e avisos de chuva, temporal e geada.'}</T>
        {!pro ? <Botao titulo="Conhecer o Pro" icone="coroa" aoTocar={() => router.push('/assinatura')} testID="ajustes-pro" /> : null}
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
        <T variante="pequeno">
          Talhões, caderno, fotos e ajustes ficam só neste celular. Para buscar a previsão, o app envia a localização do talhão arredondada (cerca de 1 km), sem identificar você. As imagens de satélite usam o contorno do talhão.
        </T>
        <Botao
          titulo="Apagar todos os meus dados"
          tipo="perigo"
          icone="lixeira"
          testID="apagar-dados"
          aoTocar={async () => {
            const ok = await confirmar('Apagar tudo', 'Isso apaga talhões, caderno, fotos, anotações de chuva e ajustes deste celular. Não dá para desfazer.', 'Apagar');
            if (!ok) return;
            apagarTudo();
            void reagendarAvisos(); // sem talhões: cancela os avisos agendados
            void atualizarStatusAssinatura(); // a assinatura é da conta da loja, não do aparelho
            router.replace('/onboarding');
          }}
        />
      </Cartao>

      <View style={estilos.links}>
        <Botao titulo="Política de privacidade" tipo="texto" aoTocar={() => WebBrowser.openBrowserAsync(`${SITE_URL}/privacidade`)} />
        <Botao titulo="Termos de uso" tipo="texto" aoTocar={() => WebBrowser.openBrowserAsync(`${SITE_URL}/termos`)} />
        <T variante="pequeno" style={estilos.centro}>
          Grão Raiz {Constants.expoConfig?.version ?? ''} · Dados meteorológicos: Open-Meteo.com (CC BY 4.0) · Imagens: Copernicus Sentinel-2
        </T>
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  ajuste: { justifyContent: 'space-between', flexWrap: 'nowrap' },
  flex: { flex: 1 },
  valorAjuste: { minWidth: 72, textAlign: 'center' },
  links: { gap: 4 },
  centro: { textAlign: 'center' },
});
