import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { reagendarAvisos } from '@/lib/avisos';

const TAREFA = 'graoraiz-atualizar-avisos';

// Precisa estar no escopo do módulo: o sistema acorda o app só com este código.
TaskManager.defineTask(TAREFA, async () => {
  try {
    await reagendarAvisos({ buscar: true });
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/** Atualiza previsão e avisos a cada ~3 h (o sistema decide o momento exato). */
export async function registrarTarefaFundo(): Promise<void> {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status !== BackgroundTask.BackgroundTaskStatus.Available) return;
    if (!(await TaskManager.isTaskRegisteredAsync(TAREFA))) {
      await BackgroundTask.registerTaskAsync(TAREFA, { minimumInterval: 180 });
    }
  } catch {
    // Sem tarefa em segundo plano o app continua reagendando os avisos a cada abertura.
  }
}
