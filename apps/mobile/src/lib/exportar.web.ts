import type { RefObject } from 'react';
import type { HostInstance } from 'react-native';

/** Na web abre o relatório numa nova aba com o diálogo de impressão (salvar como PDF). */
export async function compartilharPdf(html: string): Promise<void> {
  const janela = window.open('', '_blank');
  if (!janela) throw new Error('Permita pop-ups para gerar o relatório.');
  janela.document.write(html);
  janela.document.close();
  janela.focus();
  janela.print();
}

export async function compartilharImagem(_alvo: RefObject<HostInstance | null>, _titulo: string): Promise<void> {
  throw new Error('O compartilhamento do cartão funciona no app do celular.');
}
