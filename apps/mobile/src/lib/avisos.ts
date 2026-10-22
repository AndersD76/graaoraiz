import { dataDe, dateLocal, diasSemChuva, isoLocal, mesclarChuva, planejarAvisos, somarDias } from '@graoraiz/clima';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { buscarChuvaEstimada, buscarPrevisao, previsaoEmCache } from '@/lib/dados-clima';
import { atualizar, type Estado, obterEstado, temPro } from '@/lib/estado';

const CANAL = 'avisos';

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

async function garantirCanal(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL, {
    name: 'Avisos do tempo',
    // O plugin de imports não enxerga este enum reexportado; o TypeScript confirma que existe.
    // eslint-disable-next-line import/namespace
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export async function permissaoNotificacoes(): Promise<'concedida' | 'negada' | 'pendente'> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'concedida';
  return status === 'denied' ? 'negada' : 'pendente';
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

/**
 * Recalcula e reagenda todos os avisos a partir das previsões em cache (ou da rede, se `buscar`).
 * Idempotente: pode rodar a cada abertura do app e na tarefa em segundo plano.
 */
export async function reagendarAvisos(opcoes: { buscar?: boolean } = {}): Promise<number> {
  if ((await permissaoNotificacoes()) !== 'concedida') return 0;
  await garantirCanal();

  const agora = isoLocal(new Date());
  const hoje = dataDe(agora);
  const e = obterEstado();
  const preferencias = preferenciasEfetivas(e);

  // O que já passou do horário conta como entregue e nunca volta.
  const entregues = new Set(e.avisosEntregues);
  for (const a of e.avisosAgendados) if (a.quando <= agora) entregues.add(a.id);

  const planejados = [];
  for (const talhao of e.talhoes) {
    // A busca respeita o cache de 1 h, então abrir o app várias vezes não repete o download.
    const previsao = opcoes.buscar
      ? await buscarPrevisao(talhao).catch(() => previsaoEmCache(talhao))
      : previsaoEmCache(talhao);
    if (!previsao) continue;

    let semChuva: number | null = null;
    if (preferencias.veranico && talhao.dataPlantio) {
      const estimada = await buscarChuvaEstimada(talhao, somarDias(hoje, -40)).catch(() => null);
      const anotadas = e.chuvas.filter((c) => c.talhaoId === talhao.id);
      if (estimada) semChuva = diasSemChuva(mesclarChuva(anotadas, estimada.dados), somarDias(hoje, -1));
    }

    planejados.push(
      ...planejarAvisos({
        talhao,
        horas: previsao.dados.horas,
        dias: previsao.dados.dias,
        agora,
        preferencias,
        limiares: e.limiares,
        diasSemChuva: semChuva,
        plantado: Boolean(talhao.dataPlantio && talhao.dataPlantio <= hoje),
      }),
    );
  }

  const novos = planejados.filter((a) => !entregues.has(a.id) && a.quando > agora);

  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const aviso of novos) {
    await Notifications.scheduleNotificationAsync({
      identifier: aviso.id,
      content: { title: aviso.titulo, body: aviso.corpo, data: { talhaoId: aviso.talhaoId, tipo: aviso.tipo } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dateLocal(aviso.quando), channelId: CANAL },
    });
  }

  atualizar((s) => ({
    ...s,
    avisosAgendados: novos.map((a) => ({ id: a.id, quando: a.quando })),
    avisosEntregues: [...entregues].slice(-300),
  }));
  return novos.length;
}
