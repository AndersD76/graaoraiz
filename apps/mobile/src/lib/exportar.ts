import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import type { HostInstance } from 'react-native';
import { captureRef } from 'react-native-view-shot';

/** Gera o PDF do relatório no aparelho e abre o compartilhamento (WhatsApp, e-mail, Drive…). */
export async function compartilharPdf(html: string, titulo: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: '.pdf', dialogTitle: titulo });
  }
}

/** Tira uma "foto" do cartão de chuva e abre o compartilhamento. */
export async function compartilharImagem(alvo: RefObject<HostInstance | null>, titulo: string): Promise<void> {
  const uri = await captureRef(alvo, { format: 'png', quality: 1 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: titulo });
  }
}
