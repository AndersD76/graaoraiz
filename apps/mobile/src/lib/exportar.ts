import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import type { HostInstance } from 'react-native';
import { captureRef } from 'react-native-view-shot';

async function compartilhar(uri: string, mimeType: string, UTI: string, titulo: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Este celular não permite compartilhar arquivos por aqui.');
  }
  await Sharing.shareAsync(uri, { mimeType, UTI, dialogTitle: titulo });
}

/** Gera o PDF do relatório no aparelho e abre o compartilhamento (WhatsApp, e-mail, Drive…). */
export async function compartilharPdf(html: string, titulo: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  await compartilhar(uri, 'application/pdf', '.pdf', titulo);
}

/** Tira uma "foto" do cartão de chuva e abre o compartilhamento. */
export async function compartilharImagem(alvo: RefObject<HostInstance | null>, titulo: string): Promise<void> {
  const uri = await captureRef(alvo, { format: 'png', quality: 1 });
  await compartilhar(uri, 'image/png', 'public.png', titulo);
}
