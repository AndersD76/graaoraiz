import { condicoesNaHora, dataDe, formatarNumero, PRODUTOS, type TipoProduto } from '@graoraiz/clima';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SeletorTalhao } from '@/components/clima';
import { lerArea } from '@/components/form-talhao';
import type { NomeIcone } from '@/components/icone';
import { Aviso, Botao, Campo, Cartao, Chip, LinhaInfo, Linha, Selo, T, Tela } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAgora } from '@/hooks/use-agora';
import { usePrevisao } from '@/hooks/use-previsao';
import { reagendarAvisos } from '@/lib/avisos';
import { registrarAplicacao, talhaoAtual, useEstado } from '@/lib/estado';

const ICONE_PRODUTO: Record<TipoProduto, NomeIcone> = {
  fungicida: 'escudo',
  inseticida: 'praga',
  herbicida: 'folha',
  foliar: 'gota',
  outro: 'pulverizador',
};

function Contador({ rotulo, valor, unidade, min, max, aoMudar }: { rotulo: string; valor: number; unidade: string; min: number; max: number; aoMudar: (v: number) => void }) {
  return (
    <Linha style={estilos.contador}>
      <T style={estilos.flex}>{rotulo}</T>
      <Botao titulo="−" tipo="secundario" compacto desabilitado={valor <= min} aoTocar={() => aoMudar(valor - 1)} />
      <T variante="forte" style={estilos.valor}>
        {valor} {unidade}
      </T>
      <Botao titulo="+" tipo="secundario" compacto desabilitado={valor >= max} aoTocar={() => aoMudar(valor + 1)} />
    </Linha>
  );
}

function lerHora(texto: string): string | null {
  const m = /^(\d{1,2})[:h]?(\d{2})?$/.exec(texto.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2] ?? '0');
  return h <= 23 && min <= 59 ? `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}` : null;
}

/** "Apliquei agora": registra a aplicação no caderno com as condições do tempo daquela hora. */
export default function AplicacaoScreen() {
  const router = useRouter();
  const estado = useEstado();
  const agora = useAgora();
  const talhao = talhaoAtual(estado);
  const { resultado } = usePrevisao(talhao?.lat, talhao?.lon);
  const [tipo, setTipo] = useState<TipoProduto>('fungicida');
  const [produto, setProduto] = useState('');
  const [dose, setDose] = useState('');
  const [horaTexto, setHoraTexto] = useState<string | null>(null);
  const [horasSemChuva, setHorasSemChuva] = useState<number | null>(null);
  const [residual, setResidual] = useState<number | null>(null);
  const [areaTexto, setAreaTexto] = useState<string | null>(null);

  if (!talhao) return null;
  const hoje = dataDe(agora);
  const hora = horaTexto === null ? agora.slice(11, 16) : lerHora(horaTexto);
  const quando = hora ? `${hoje}T${hora}` : null;
  const parametros = PRODUTOS[tipo];
  const semChuva = horasSemChuva ?? parametros.horasSemChuva;
  const diasResidual = parametros.residualDias === null ? null : (residual ?? parametros.residualDias);
  const condicoes = quando && resultado ? condicoesNaHora(resultado.dados.horas, quando, estado.limiares) : null;
  const area = areaTexto === null ? talhao.areaHa : lerArea(areaTexto);
  const valido = quando !== null && quando <= agora;

  const salvar = () => {
    if (!quando) return;
    registrarAplicacao({
      talhaoId: talhao.id,
      quando,
      tipo,
      produto: produto.trim() || parametros.rotulo,
      dose: dose.trim() || undefined,
      areaHa: area ?? undefined,
      horasSemChuva: semChuva,
      residualDias: diasResidual,
      condicoes,
    });
    void reagendarAvisos();
    router.back();
  };

  return (
    <Tela comAbas={false} cabecalhoNativo>
      <SeletorTalhao selecionado={talhao} />
      <T variante="pequeno">{talhao.nome} · o caderno guarda o produto e as condições do tempo na hora da aplicação.</T>

      <Cartao>
        <T variante="subtitulo">O que foi aplicado</T>
        <Linha>
          {(Object.keys(PRODUTOS) as TipoProduto[]).map((t) => (
            <Chip
              key={t}
              rotulo={PRODUTOS[t].rotulo}
              icone={ICONE_PRODUTO[t]}
              ativo={tipo === t}
              aoTocar={() => {
                setTipo(t);
                setHorasSemChuva(null);
                setResidual(null);
              }}
              testID={`tipo-${t}`}
            />
          ))}
        </Linha>
        <Campo rotulo="Produto (opcional)" value={produto} onChangeText={setProduto} placeholder="Nome comercial" maxLength={60} testID="campo-produto" />
        <Campo rotulo="Dose (opcional)" value={dose} onChangeText={setDose} placeholder="Ex.: 0,5 L/ha" maxLength={30} />
        <Campo
          rotulo="Área aplicada (ha)"
          value={areaTexto ?? (talhao.areaHa ? formatarNumero(talhao.areaHa, 1) : '')}
          onChangeText={setAreaTexto}
          keyboardType="decimal-pad"
          placeholder="Ex.: 40"
        />
      </Cartao>

      <Cartao>
        <T variante="subtitulo">Quando</T>
        <Linha>
          <Chip rotulo="Agora" icone="relogio" ativo={horaTexto === null} aoTocar={() => setHoraTexto(null)} />
          <Chip rotulo="Mais cedo hoje" ativo={horaTexto !== null} aoTocar={() => setHoraTexto(agora.slice(11, 13) + ':00')} testID="mais-cedo" />
        </Linha>
        {horaTexto !== null ? (
          <Campo rotulo="Hora do início (HH:MM)" value={horaTexto} onChangeText={setHoraTexto} keyboardType="numbers-and-punctuation" testID="campo-hora" />
        ) : null}
        {quando && quando > agora ? <T variante="pequeno">A hora não pode ser depois de agora.</T> : null}
        <Contador rotulo="Horas sem chuva depois (bula)" valor={semChuva} unidade="h" min={1} max={24} aoMudar={setHorasSemChuva} />
        {diasResidual !== null ? <Contador rotulo="Proteção esperada" valor={diasResidual} unidade="dias" min={3} max={45} aoMudar={setResidual} /> : null}
      </Cartao>

      <Cartao testID="condicoes-aplicacao">
        <View style={estilos.topo}>
          <T variante="subtitulo" style={estilos.flex}>
            Condições na hora
          </T>
          {condicoes ? <Selo status={condicoes.status} /> : null}
        </View>
        {condicoes ? (
          <>
            <LinhaInfo icone="termometro" rotulo="Temperatura" valor={`${formatarNumero(condicoes.temperatura, 0)} °C`} />
            <LinhaInfo icone="gotaMeia" rotulo="Umidade" valor={`${formatarNumero(condicoes.umidade, 0)}%`} />
            <LinhaInfo icone="vento" rotulo="Vento na barra" valor={`${formatarNumero(condicoes.vento2m, 0)} km/h`} />
            <LinhaInfo icone="medidor" rotulo="Delta T" valor={`${formatarNumero(condicoes.deltaT, 1)} °C`} />
            {condicoes.motivos.length ? (
              <Aviso tipo={condicoes.status === 'ruim' ? 'ruim' : 'atencao'}>{`Fora do ideal: ${condicoes.motivos.join('; ')}. O registro fica no caderno assim mesmo.`}</Aviso>
            ) : null}
          </>
        ) : (
          <T variante="pequeno">Sem previsão desta hora no aparelho: o registro fica sem as condições do tempo.</T>
        )}
      </Cartao>

      <Botao titulo="Salvar no caderno" icone="check" aoTocar={salvar} desabilitado={!valido} testID="salvar-aplicacao" />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  contador: { flexWrap: 'nowrap', gap: Spacing.two },
  valor: { minWidth: 70, textAlign: 'center' },
  flex: { flex: 1 },
  topo: { flexDirection: 'row', alignItems: 'center' },
});
