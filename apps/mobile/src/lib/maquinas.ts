import type { AnuncioDetalhe, AnuncioResumo, CategoriaMaquina, MeuAnuncio, OrdemAnuncio } from '@graoraiz/clima';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';

import { gravar, ler } from '@/lib/armazenamento';
import { SERVIDOR_URL, SITE_URL } from '@/lib/config';
import { chamarServidor, ErroConta } from '@/lib/conta';

/**
 * Classificados de máquinas e implementos usados (apps/web: /api/anuncios). Tudo fica no servidor:
 * o app só lista, mostra, envia fotos e manda o comprador para o WhatsApp do vendedor.
 */

export interface Filtros {
  categoria: CategoriaMaquina | null;
  uf: string | null;
  busca: string;
  ordem: OrdemAnuncio;
}

export const FILTROS_INICIAIS: Filtros = { categoria: null, uf: null, busca: '', ordem: 'recentes' };

export function urlFoto(id: string): string {
  return `${SERVIDOR_URL ?? ''}/api/anuncios/fotos/${id}`;
}

export function linkAnuncio(id: string): string {
  return `${SITE_URL}/maquina/${id}`;
}

function mensagem(e: unknown, padrao: string): string {
  return e instanceof ErroConta ? e.message : padrao;
}

// ---------- lista ----------

interface Vitrine {
  /** Consulta, versão e página da última resposta: "carregando" é ainda não ter a resposta da atual. */
  chave: string;
  /** Consulta e versão: páginas seguintes da mesma base se somam à lista. */
  base: string;
  anuncios: AnuncioResumo[];
  temMais: boolean;
  comissao: number | null;
  erro: string | null;
}

export function useAnuncios(filtros: Filtros) {
  const [versao, setVersao] = useState(0);
  const consulta = new URLSearchParams({
    ...(filtros.categoria ? { categoria: filtros.categoria } : {}),
    ...(filtros.uf ? { uf: filtros.uf } : {}),
    ...(filtros.busca.trim() ? { q: filtros.busca.trim() } : {}),
    ordem: filtros.ordem,
  }).toString();
  // A página vale para a consulta em que foi pedida: filtro novo começa da primeira.
  const [paginaDe, setPaginaDe] = useState({ consulta, n: 0 });
  const pagina = paginaDe.consulta === consulta ? paginaDe.n : 0;
  const base = `${consulta}|${versao}`;
  const chave = `${base}|${pagina}`;
  const [vitrine, setVitrine] = useState<Vitrine>({ chave: '', base: '', anuncios: [], temMais: false, comissao: null, erro: null });

  useEffect(() => {
    let ativo = true;
    chamarServidor<{ anuncios: AnuncioResumo[]; temMais: boolean; comissaoPercentual: number }>(`/api/anuncios?${consulta}&pagina=${pagina}`)
      .then((r) => {
        if (!ativo) return;
        setVitrine((v) => ({
          chave,
          base,
          anuncios: pagina > 0 && v.base === base ? [...v.anuncios, ...r.anuncios] : r.anuncios,
          temMais: r.temMais,
          comissao: r.comissaoPercentual,
          erro: null,
        }));
      })
      .catch((e: unknown) => ativo && setVitrine((v) => ({ ...v, chave, erro: mensagem(e, 'Não deu para buscar os anúncios.') })));
    return () => {
      ativo = false;
    };
  }, [chave, base, consulta, pagina]);

  const atualizar = useCallback(() => {
    setPaginaDe({ consulta, n: 0 });
    setVersao((v) => v + 1);
  }, [consulta]);

  return {
    anuncios: vitrine.anuncios,
    temMais: vitrine.temMais,
    comissao: vitrine.comissao,
    carregando: vitrine.chave !== chave,
    erro: vitrine.erro,
    carregarMais: () => setPaginaDe({ consulta, n: pagina + 1 }),
    atualizar,
  };
}

// ---------- um anúncio ----------

export function useAnuncio(id: string | undefined) {
  const [lido, setLido] = useState<{ id: string; anuncio: AnuncioDetalhe | null; erro: string | null } | null>(null);

  useEffect(() => {
    if (!id) return;
    let ativo = true;
    chamarServidor<AnuncioDetalhe>(`/api/anuncios/${id}`)
      .then((anuncio) => ativo && setLido({ id, anuncio, erro: null }))
      .catch((e: unknown) => ativo && setLido({ id, anuncio: null, erro: mensagem(e, 'Não deu para abrir o anúncio.') }));
    return () => {
      ativo = false;
    };
  }, [id]);

  const atual = lido?.id === id ? lido : null;
  return { anuncio: atual?.anuncio ?? null, erro: atual?.erro ?? null, carregando: atual === null };
}

export function useMeusAnuncios() {
  const [anuncios, setAnuncios] = useState<MeuAnuncio[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;
    chamarServidor<{ anuncios: MeuAnuncio[] }>('/api/anuncios/meus')
      .then((r) => ativo && (setAnuncios(r.anuncios), setErro(null)))
      .catch((e: unknown) => ativo && setErro(mensagem(e, 'Não deu para buscar seus anúncios.')));
    return () => {
      ativo = false;
    };
  }, [versao]);

  return { anuncios, erro, atualizar: () => setVersao((v) => v + 1) };
}

// ---------- anunciar ----------

export interface FormAnuncio {
  categoria: CategoriaMaquina;
  titulo: string;
  marca: string;
  modelo: string;
  ano: number | null;
  horas: number | null;
  preco: number;
  municipio: string;
  uf: string;
  descricao: string;
  whatsapp: string;
  fotos: string[];
}

const CHAVE_WHATSAPP = 'graoraiz:whatsapp-anuncio';

export function whatsappSalvo(): string {
  return ler<string>(CHAVE_WHATSAPP) ?? '';
}

/** Cria ou edita o anúncio. Devolve o id. */
export async function salvarAnuncio(form: FormAnuncio, id?: string): Promise<string> {
  gravar(CHAVE_WHATSAPP, form.whatsapp);
  if (id) {
    await chamarServidor(`/api/anuncios/${id}`, { metodo: 'PUT', corpo: form });
    return id;
  }
  const r = await chamarServidor<{ id: string }>('/api/anuncios', { metodo: 'POST', corpo: { ...form, aceiteComissao: true } });
  return r.id;
}

export function mudarSituacao(id: string, situacao: 'ativo' | 'pausado'): Promise<unknown> {
  return chamarServidor(`/api/anuncios/${id}/situacao`, { metodo: 'POST', corpo: { situacao } });
}

export function marcarVendido(id: string, valor: number): Promise<{ comissaoPercentual: number; comissaoValor: number }> {
  return chamarServidor(`/api/anuncios/${id}/vendido`, { metodo: 'POST', corpo: { valor } });
}

export function tirarDoAr(id: string): Promise<unknown> {
  return chamarServidor(`/api/anuncios/${id}`, { metodo: 'DELETE' });
}

// ---------- fotos ----------

const LADO_MAIOR = 1600;

/** Escolhe fotos da galeria (ou tira uma com a câmera) e devolve os endereços locais. */
export async function escolherFotos(origem: 'galeria' | 'camera', maximo: number): Promise<ImagePicker.ImagePickerAsset[]> {
  if (Platform.OS !== 'web') {
    const permissao = origem === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) throw new Error(origem === 'camera' ? 'Permita o uso da câmera nas configurações do celular.' : 'Permita o acesso às fotos nas configurações do celular.');
  }
  const r =
    origem === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 1, exif: false })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: maximo, quality: 1 });
  return r.canceled ? [] : r.assets.slice(0, maximo);
}

/** Reduz a foto no aparelho (lado maior 1600 px, JPEG) e envia ao servidor. Devolve o id. */
export async function enviarFoto(foto: ImagePicker.ImagePickerAsset): Promise<string> {
  const contexto = ImageManipulator.manipulate(foto.uri);
  if (Math.max(foto.width, foto.height) > LADO_MAIOR) {
    contexto.resize(foto.width >= foto.height ? { width: LADO_MAIOR } : { height: LADO_MAIOR });
  }
  const imagem = await contexto.renderAsync();
  const salva = await imagem.saveAsync({ compress: 0.72, format: SaveFormat.JPEG, base64: true });
  if (!salva.base64) throw new Error('Não deu para preparar a foto.');
  const r = await chamarServidor<{ id: string }>('/api/anuncios/fotos', { metodo: 'POST', corpo: { base64: salva.base64 } });
  return r.id;
}

// ---------- contato ----------

/** Pede o WhatsApp do vendedor (fica registrado) e abre a conversa com uma mensagem pronta. */
export async function chamarVendedor(anuncio: Pick<AnuncioResumo, 'id' | 'titulo'>): Promise<void> {
  const r = await chamarServidor<{ whatsapp: string; vendedor: string }>(`/api/anuncios/${anuncio.id}/contato`, { metodo: 'POST' });
  const numero = r.whatsapp.length <= 11 ? `55${r.whatsapp}` : r.whatsapp;
  const texto = `Olá ${r.vendedor}! Vi seu anúncio "${anuncio.titulo}" no Grão Raiz e tenho interesse. ${linkAnuncio(anuncio.id)}`;
  await Linking.openURL(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`);
}

/** Manda o link do anúncio para alguém pelo WhatsApp. */
export function compartilharAnuncio(anuncio: Pick<AnuncioResumo, 'id' | 'titulo' | 'preco'>, preco: string): Promise<void> {
  const texto = `${anuncio.titulo} por ${preco}, no Grão Raiz: ${linkAnuncio(anuncio.id)}`;
  return Linking.openURL(`https://wa.me/?text=${encodeURIComponent(texto)}`);
}
