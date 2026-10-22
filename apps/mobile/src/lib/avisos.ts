import { dataDe, dateLocal, diasSemChuva, isoLocal, mesclarChuva, planejarAvisos, somarDias } from '@graoraiz/clima';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { buscarChuvaEstimada, buscarPrevisao, type Previsao, previsaoEmCache, type Resultado } from '@/lib/dados-clima';
import { atualizar, type Estado, obterEstado, talhoesLiberados, temPro } from '@/lib/estado';

const CANAL = 'avisos';
/** Folga mínima para agendar: data no passado faz o iOS rejeitar e o Android descartar o aviso. */
const FOLGA_MS = 5_000;

/** Chamar uma vez, no início do app (fora de componentes). */
export function configurarNotificacoes(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Ao tocar num aviso — com o app aberto, em segundo plano ou fechado — chama `aoAbrir`
 * com o talhão do aviso. Devolve a função que para de ouvir.
 */
export function ouvirToqueNosAvisos(aoAbrir: (talhaoId: string) => void): () => void {
  const tratar = (resposta: Notifications.NotificationResponse | null) => {
    const talhaoId = resposta?.notification.request.content.data?.talhaoId;
    if (typeof talhaoId === 'string') aoAbrir(talhaoId);
  };
  // App aberto a frio pelo toque: a resposta já chegou antes deste código rodar.
  tratar(Notifications.getLastNotificationResponse());
  Notifications.clearLastNotificationResponse();
  const assinatura = Notifications.addNotificationResponseReceivedListener(tratar);
  return () => assinatura.remove();
}

async function garantirCanal(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL, {
    name: 'Avisos do tempo',
    // O plugin de imports não enxerga este enum reexportado; o TypeScript confirma que existe.
    // eslint-disable-next-line import/namespace
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export interface PermissaoAvisos {
  estado: 'concedida' | 'negada' | 'pendente';
  /** false depois que o sistema não deixa mais perguntar: só pelas configurações do celular. */
  podePedir: boolean;
}

export async function permissaoAvisos(): Promise<PermissaoAvisos> {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return { estado: 'concedida', podePedir: true };
  return { estado: status === 'denied' ? 'negada' : 'pendente', podePedir: canAskAgain };
}

export async function permissaoNotificacoes(): Promise<'concedida' | 'negada' | 'pendente'> {
  return (await permissaoAvisos()).estado;
}

export async function pedirPermissaoNotificacoes(): Promise<boolean> {
  await garantirCanal(); // no Android o pedido só aparece depois de existir um canal
  const atual = await Notifications.getPermissionsAsync();
  if (atual.status === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** O plano grátis recebe geada e temporal; os avisos de decisão são do Pro. */
function preferenciasEfetivas(e: Estado) {
  if (temPro(e)) return e.preferencias;
  return { ...e.preferencias, pulverizacao: false, janelaSeca: false, veranico: false };
}

let emAndamento: Promise<number> | null = null;

/**
 * Recalcula e reagenda todos os avisos a partir das previsões em cache (ou da rede, se `buscar`).
 * Idempotente e sem execuções simultâneas: abrir o app, voltar a ele e a tarefa em segundo plano
 * podem pedir ao mesmo tempo; quem chega depois aguarda a rodada em curso.
 */
export function reagendarAvisos(opcoes: { buscar?: boolean } = {}): Promise<number> {
  if (emAndamento) return emAndamento;
  emAndamento = executar(opcoes).finally(() => {
    emAndamento = null;
  });
  return emAndamento;
}

async function executar(opcoes: { buscar?: boolean }): Promise<number> {
  if ((await permissaoNotificacoes()) !== 'concedida') {
    // Sem permissão nada aparece; limpa o que tiver ficado agendado (ex.: depois de apagar os dados).
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
    return 0;
  }
  await garantirCanal();

  const e = obterEstado();
  const preferencias = preferenciasEfetivas(e);
  const talhoes = talhoesLiberados(e);

  // 1) Baixa tudo primeiro (pode demorar com sinal fraco)…
  const dados: { talhaoId: string; previsao: Resultado<Previsao>; semChuva: number | null }[] = [];
  for (const talhao of talhoes) {
    // A busca respeita o cache de 1 h, então abrir o app várias vezes não repete o download.
    const previsao = opcoes.buscar ? await buscarPrevisao(talhao).catch(() => previsaoEmCache(talhao)) : previsaoEmCache(talhao);
    if (!previsao) continue;
    let semChuva: number | null = null;
    if (preferencias.veranico && talhao.dataPlantio) {
      const ontem = somarDias(dataDe(isoLocal(new Date())), -1);
      const estimada = await buscarChuvaEstimada(talhao, somarDias(ontem, -40)).catch(() => null);
      const anotadas = e.chuvas.filter((c) => c.talhaoId === talhao.id);
      if (estimada) semChuva = diasSemChuva(mesclarChuva(anotadas, estimada.dados), ontem);
    }
    dados.push({ talhaoId: talhao.id, previsao, semChuva });
  }

  // 2) …e só então lê o relógio: os horários calculados não ficam no passado.
  const agora = isoLocal(new Date());
  const hoje = dataDe(agora);
  const entregues = new Set(e.avisosEntregues);
  for (const a of obterEstado().avisosAgendados) if (a.quando <= agora) entregues.add(a.id);

  const planejados = dados.flatMap(({ talhaoId, previsao, semChuva }) => {
    const talhao = talhoes.find((t) => t.id === talhaoId);
    if (!talhao) return [];
    return planejarAvisos({
      talhao,
      horas: previsao.dados.horas,
      dias: previsao.dados.dias,
      agora,
      preferencias,
      limiares: e.limiares,
      diasSemChuva: semChuva,
      plantado: Boolean(talhao.dataPlantio && talhao.dataPlantio <= hoje),
    });
  });
  const novos = planejados.filter((a) => !entregues.has(a.id) && a.quando > agora);

  await Notifications.cancelAllScheduledNotificationsAsync();
  const agendados: { id: string; quando: string }[] = [];
  for (const aviso of novos) {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: aviso.id,
        content: { title: aviso.titulo, body: aviso.corpo, data: { talhaoId: aviso.talhaoId, tipo: aviso.tipo } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(Math.max(dateLocal(aviso.quando).getTime(), Date.now() + FOLGA_MS)),
          channelId: CANAL,
        },
      });
      agendados.push({ id: aviso.id, quando: aviso.quando });
    } catch {
      // Um aviso com problema não derruba os outros; ele volta a ser tentado na próxima rodada.
    }
  }

  atualizar((s) => ({ ...s, avisosAgendados: agendados, avisosEntregues: [...entregues].slice(-300) }));
  return agendados.length;
}
