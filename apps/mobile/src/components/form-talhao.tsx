import { dataDe } from '@graoraiz/clima';
import { useState } from 'react';

import { MapaTalhao } from '@/components/mapa-talhao';
import { SeletorData } from '@/components/seletor-data';
import { Aviso, Botao, Campo, Chip, Linha, T } from '@/components/ui';
import { useAgora } from '@/hooks/use-agora';
import { type Cultura, CULTURAS, type Talhao } from '@/lib/estado';
import { type Coordenada, localizacaoAtual } from '@/lib/localizacao';

export interface DadosTalhao {
  nome: string;
  coordenada: Coordenada | null;
  cultura: Cultura | null;
  dataPlantio: string | null;
}

export function dadosIniciais(talhao?: Talhao | null): DadosTalhao {
  return {
    nome: talhao?.nome ?? 'Meu talhão',
    coordenada: talhao ? { lat: talhao.lat, lon: talhao.lon } : null,
    cultura: talhao?.cultura ?? null,
    dataPlantio: talhao?.dataPlantio ?? null,
  };
}

/** Campos do talhão, usados no cadastro inicial e na edição. */
export function FormTalhao({ dados, aoMudar, comPlantio = true }: { dados: DadosTalhao; aoMudar: (d: DadosTalhao) => void; comPlantio?: boolean }) {
  const [buscando, setBuscando] = useState(false);
  const [semPermissao, setSemPermissao] = useState(false);
  const hoje = dataDe(useAgora());

  const usarLocalizacao = async () => {
    setBuscando(true);
    try {
      const c = await localizacaoAtual();
      setSemPermissao(c === null);
      if (c) aoMudar({ ...dados, coordenada: c });
    } catch {
      setSemPermissao(true);
    } finally {
      setBuscando(false);
    }
  };

  return (
    <>
      <Campo rotulo="Nome do talhão" value={dados.nome} onChangeText={(nome) => aoMudar({ ...dados, nome })} maxLength={40} testID="campo-nome" />

      <T variante="forte">Onde fica</T>
      <Botao titulo="Estou no talhão: usar minha localização" tipo="secundario" aoTocar={usarLocalizacao} carregando={buscando} testID="usar-localizacao" />
      {semPermissao ? <Aviso tipo="atencao">Não consegui a localização. Permita o acesso nas configurações do celular ou marque no mapa.</Aviso> : null}
      <MapaTalhao coordenada={dados.coordenada} aoMudar={(coordenada) => aoMudar({ ...dados, coordenada })} />
      {dados.coordenada ? (
        <T variante="pequeno">
          Marcado em {dados.coordenada.lat.toFixed(4)}, {dados.coordenada.lon.toFixed(4)}
        </T>
      ) : null}

      <T variante="forte">Cultura (opcional)</T>
      <Linha>
        {CULTURAS.map((c) => (
          <Chip key={c.valor} rotulo={c.rotulo} ativo={dados.cultura === c.valor} aoTocar={() => aoMudar({ ...dados, cultura: dados.cultura === c.valor ? null : c.valor })} />
        ))}
      </Linha>

      {comPlantio ? (
        <>
          <T variante="forte">Plantio (opcional)</T>
          <Linha>
            <Chip rotulo="Ainda não plantei" ativo={dados.dataPlantio === null} aoTocar={() => aoMudar({ ...dados, dataPlantio: null })} />
            <Chip rotulo="Já plantei" ativo={dados.dataPlantio !== null} aoTocar={() => aoMudar({ ...dados, dataPlantio: dados.dataPlantio ?? hoje })} />
          </Linha>
          {dados.dataPlantio ? <SeletorData valor={dados.dataPlantio} maximo={hoje} aoMudar={(dataPlantio) => aoMudar({ ...dados, dataPlantio })} /> : null}
          <T variante="pequeno">Com a data de plantio o app avisa veranico durante a lavoura.</T>
        </>
      ) : null}
    </>
  );
}
