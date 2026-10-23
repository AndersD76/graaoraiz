import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

/**
 * Fotos de prova (ocorrências): copiadas para a pasta do app, para não sumirem se o usuário
 * apagar da galeria. No dossiê viram data URI (o PDF precisa da imagem embutida).
 */

const PASTA = `${FileSystem.documentDirectory ?? ''}fotos/`;

export async function tirarFoto(origem: 'camera' | 'galeria'): Promise<string | null> {
  const permissao = origem === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissao.granted) throw new Error(origem === 'camera' ? 'Permita o uso da câmera nas configurações do celular.' : 'Permita o acesso às fotos nas configurações do celular.');
  const resultado =
    origem === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.6, exif: false })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
  const foto = resultado.canceled ? null : resultado.assets[0];
  if (!foto) return null;
  await FileSystem.makeDirectoryAsync(PASTA, { intermediates: true }).catch(() => undefined);
  const destino = `${PASTA}${Date.now().toString(36)}.jpg`;
  await FileSystem.copyAsync({ from: foto.uri, to: destino });
  return destino;
}

export async function fotoParaHtml(uri: string): Promise<string | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    return `data:image/jpeg;base64,${base64}`;
  } catch {
    return null;
  }
}

export async function apagarFoto(uri: string): Promise<void> {
  if (uri.startsWith(PASTA)) await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
}
