import { areaHa, CULTURAS, type Cultura, dataDe, formatarNumero, type JanelaZarc, LISTA_CULTURAS, type Solo, SOLOS } from '@graoraiz/clima';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Ilustracao } from '@/components/icone';
import { MapaTalhao } from '@/components/mapa-talhao';
import { SeletorData } from '@/components/seletor-data';
import { Aviso, Botao, Campo, Cartao, Chip, Interruptor, Linha, T } from '@/components/ui';
import { Raio, Spacing } from '@/constants/theme';
import { useAgora } from '@/hooks/use-agora';
import { useTheme } from '@/hooks/use-theme';
import { ILUSTRACAO_CULTURA } from '@/lib/culturas-visual';
import type { Talhao } from '@/lib/estado';
import { type Coordenada, localizacaoAtual } from '@/lib/localizacao';

export interface DadosTalhao {
  nome: string;
  coordenada: Coordenada | null;
  contorno: [number, number][] | null;
  cultura: Cultura | null;
  dataPlantio: string | null;
  solo: Solo;
  areaTexto: string;
  zarc: JanelaZarc | null;
  baixada: boolean;
}

export function dadosIniciais(talhao?: Talhao | null): DadosTalhao {
  return {
    nome: talhao?.nome ?? 'Meu talhão',
    coordenada: talhao ? { lat: talhao.lat, lon: talhao.lon } : null,
    contorno: talhao?.contorno ?? null,
    cultura: talhao?.cultura ?? null,
    dataPlantio: talhao?.dataPlantio ?? null,
    solo: talhao?.solo ?? 'medio',
    areaTexto: talhao?.areaHa ? formatarNumero(talhao.areaHa, 1) : '',
    zarc: talhao?.zarc ?? null,
    baixada: talhao?.baixada ?? false,
  };
}

export function lerArea(texto: string): number | null {
  const n = Number(texto.replace(',', '.'));
  return texto.trim() !== '' && Number.isFinite(n) && n > 0 && n < 100_000 ? n : null;
}

/** Grade de culturas com ilustração. */
function SeletorCultura({ valor, aoMudar }: { valor: Cultura | null; aoMudar: (c: Cultura | null) => void }) {
  const tema = useTheme();
  return (
    <View style={estilos.grade}>
      {LISTA_CULTURAS.map((c) => {
        const ativo = valor === c;
        return (
          <Pressable
            key={c}
            onPress={() => aoMudar(ativo ? null : c)}
            accessibilityRole="button"
            accessibilityLabel={CULTURAS[c].rotulo}
            accessibilityState={{ selected: ativo }}
            testID={`cultura-${c}`}
            style={[estilos.cultura, { backgroundColor: ativo ? tema.marcaSuave : tema.backgroundElement, borderColor: ativo ? tema.marca : tema.borda }]}>
            <Ilustracao nome={ILUSTRACAO_CULTURA[c]} tamanho={36} />
            <T variante="pequeno" cor={ativo ? tema.marca : tema.text} style={estilos.textoCultura}>
              {CULTURAS[c].rotulo}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Campos do talhão, usados no cadastro inicial (resumido) e na edição (completo). */
export function FormTalhao({ dados, aoMudar, completo = true }: { dados: DadosTalhao; aoMudar: (d: DadosTalhao) => void; completo?: boolean }) {
  const tema = useTheme();
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

  const mudarContorno = (contorno: [number, number][] | null) => {
    const area = contorno && contorno.length >= 3 ? areaHa(contorno) : null;
    aoMudar({ ...dados, contorno, areaTexto: area ? formatarNumero(area, 1) : dados.areaTexto });
  };

  return (
    <>
      <Campo rotulo="Nome do talhão" value={dados.nome} onChangeText={(nome) => aoMudar({ ...dados, nome })} maxLength={40} testID="campo-nome" />

      <Cartao>
        <T variante="subtitulo">Onde fica</T>
        <Botao titulo="Estou no talhão: usar minha localização" tipo="secundario" icone="mira" aoTocar={usarLocalizacao} carregando={buscando} testID="usar-localizacao" />
        {semPermissao ? <Aviso tipo="atencao">Não consegui a localização. Permita o acesso nas configurações do celular ou marque no mapa.</Aviso> : null}
        <MapaTalhao
          coordenada={dados.coordenada}
          aoMudar={(coordenada) => aoMudar({ ...dados, coordenada })}
          contorno={dados.contorno}
          aoMudarContorno={completo ? mudarContorno : undefined}
        />
        {dados.coordenada ? (
          <T variante="pequeno">
            Marcado em {dados.coordenada.lat.toFixed(4)}, {dados.coordenada.lon.toFixed(4)}
          </T>
        ) : null}
      </Cartao>

      <Cartao>
        <T variante="subtitulo">Cultura</T>
        <SeletorCultura valor={dados.cultura} aoMudar={(cultura) => aoMudar({ ...dados, cultura })} />
        {dados.cultura && CULTURAS[dados.cultura].doencas.length ? (
          <T variante="pequeno">O vigia acompanha {CULTURAS[dados.cultura].doencas.length === 1 ? 'a doença' : 'as doenças'} desta cultura pelo clima.</T>
        ) : null}
      </Cartao>

      {completo ? (
        <>
          <Cartao>
            <T variante="subtitulo">Plantio</T>
            <Linha>
              <Chip rotulo="Ainda não plantei" ativo={dados.dataPlantio === null} aoTocar={() => aoMudar({ ...dados, dataPlantio: null })} />
              <Chip rotulo="Já plantei" ativo={dados.dataPlantio !== null} aoTocar={() => aoMudar({ ...dados, dataPlantio: dados.dataPlantio ?? hoje })} />
            </Linha>
            {dados.dataPlantio ? <SeletorData valor={dados.dataPlantio} maximo={hoje} aoMudar={(dataPlantio) => aoMudar({ ...dados, dataPlantio })} /> : null}
            <T variante="pequeno">Sem data de plantio, o vigia responde “planto ou espero?”. Com ela, acompanha veranico na lavoura.</T>
          </Cartao>

          <Cartao>
            <T variante="subtitulo">Janela do ZARC</T>
            <Interruptor
              rotulo="Sei a janela de plantio do ZARC"
              descricao="Fora dela não há Proagro nem seguro subsidiado. Veja no app Plantio Certo (Embrapa) ou com o banco."
              valor={dados.zarc !== null}
              aoMudar={(v) => aoMudar({ ...dados, zarc: v ? { inicio: hoje, fim: hoje } : null })}
              testID="tem-zarc"
            />
            {dados.zarc ? (
              <>
                <T variante="rotulo">Início</T>
                <SeletorData valor={dados.zarc.inicio} aoMudar={(inicio) => aoMudar({ ...dados, zarc: { inicio, fim: dados.zarc!.fim < inicio ? inicio : dados.zarc!.fim } })} />
                <T variante="rotulo">Fim</T>
                <SeletorData valor={dados.zarc.fim} aoMudar={(fim) => aoMudar({ ...dados, zarc: { inicio: dados.zarc!.inicio, fim } })} />
              </>
            ) : null}
          </Cartao>

          <Cartao>
            <T variante="subtitulo">Solo e área</T>
            <Linha>
              {(Object.keys(SOLOS) as Solo[]).map((s) => (
                <Chip key={s} rotulo={SOLOS[s].rotulo} ativo={dados.solo === s} aoTocar={() => aoMudar({ ...dados, solo: s })} />
              ))}
            </Linha>
            <Campo
              rotulo="Área (hectares)"
              value={dados.areaTexto}
              onChangeText={(areaTexto) => aoMudar({ ...dados, areaTexto })}
              keyboardType="decimal-pad"
              placeholder="Ex.: 42"
              dica={dados.contorno && dados.contorno.length >= 3 ? 'Calculada pelo contorno desenhado.' : 'Desenhe o contorno no mapa para calcular sozinho.'}
              testID="campo-area"
            />
            <Interruptor
              rotulo="Talhão em baixada"
              descricao="O ar frio escorre e acumula: o vigia avisa geada com mais cuidado."
              valor={dados.baixada}
              aoMudar={(baixada) => aoMudar({ ...dados, baixada })}
            />
          </Cartao>
        </>
      ) : (
        <T variante="pequeno" cor={tema.textSecondary}>
          Plantio, solo, área e janela do ZARC ficam para depois, em Lavoura.
        </T>
      )}
    </>
  );
}

const estilos = StyleSheet.create({
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  cultura: {
    width: '31%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: Raio.medio,
    borderWidth: 1.5,
  },
  textoCultura: { fontSize: 13 },
});
