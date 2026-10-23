/**
 * Na web (teste no navegador) a foto é escolhida num seletor de arquivo e reduzida para caber
 * no armazenamento local: lado maior de 1024 px, JPEG 70%.
 */

function escolherArquivo(): Promise<File | null> {
  return new Promise((resolver) => {
    const entrada = document.createElement('input');
    entrada.type = 'file';
    entrada.accept = 'image/*';
    entrada.onchange = () => resolver(entrada.files?.[0] ?? null);
    entrada.click();
  });
}

function reduzir(arquivo: File): Promise<string> {
  return new Promise((resolver, rejeitar) => {
    const leitor = new FileReader();
    leitor.onerror = () => rejeitar(new Error('Não foi possível ler a foto.'));
    leitor.onload = () => {
      const imagem = new Image();
      imagem.onerror = () => rejeitar(new Error('Arquivo não é uma imagem.'));
      imagem.onload = () => {
        const escala = Math.min(1, 1024 / Math.max(imagem.width, imagem.height));
        const tela = document.createElement('canvas');
        tela.width = Math.round(imagem.width * escala);
        tela.height = Math.round(imagem.height * escala);
        tela.getContext('2d')?.drawImage(imagem, 0, 0, tela.width, tela.height);
        resolver(tela.toDataURL('image/jpeg', 0.7));
      };
      imagem.src = String(leitor.result);
    };
    leitor.readAsDataURL(arquivo);
  });
}

export async function tirarFoto(_origem: 'camera' | 'galeria'): Promise<string | null> {
  const arquivo = await escolherArquivo();
  return arquivo ? reduzir(arquivo) : null;
}

export async function fotoParaHtml(uri: string): Promise<string | null> {
  return uri.startsWith('data:image/') ? uri : null;
}

export async function apagarFoto(_uri: string): Promise<void> {}
