import {
  acumulado,
  dataDe,
  type EventoSafra,
  formatarData,
  formatarMm,
  formatarNumero,
  isoLocal,
  maiorSequenciaSeca,
  rotuloDia,
  safraDe,
  somarDias,
} from '@graoraiz/clima';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { CalendarioChuva } from '@/components/calendario-chuva';
import { SeletorTalhao } from '@/components/clima';
import { Aviso, Botao, Campo, Cartao, Chip, Linha, T, Tela } from '@/components/ui';
import { useChuvaSafra } from '@/hooks/use-chuva-safra';
import { useTheme } from '@/hooks/use-theme';
import { anotarChuva, registrarEvento, removerEvento, talhaoAtual, useEstado, usePro } from '@/lib/estado';

const RAPIDOS = [0, 5, 10, 20, 50];

const TIPOS_EVENTO: { valor: EventoSafra['tipo']; rotulo: string }[] = [
  { valor: 'granizo', rotulo: 'Granizo' },
  { valor: 'geada', rotulo: 'Geada' },
  { valor: 'seca', rotulo: 'Seca' },
  { valor: 'excessoChuva', rotulo: 'Excesso de chuva' },
  { valor: 'outro', rotulo: 'Outro' },
];

function lerMm(texto: string): number | null {
  const n = Number(texto.replace(',', '.'));
  return texto.trim() !== '' && Number.isFinite(n) && n >= 0 && n <= 500 ? n : null;
}

export default function ChuvaScreen() {
  const router = useRouter();
  const tema = useTheme();
  const estado = useEstado();
  const pro = usePro();
  const talhao = talhaoAtual(estado);
  const hoje = dataDe(isoLocal(new Date()));
  const safra = safraDe(hoje);
  const { registros, normal, carregando, semEstimativa } = useChuvaSafra(talhao);

  const [data, setData] = useState(hoje);
  const [texto, setTexto] = useState('');
  const [mes, setMes] = useState(hoje.slice(0, 7));
  const [tipoEvento, setTipoEvento] = useState<EventoSafra['tipo'] | null>(null);
  const [nota, setNota] = useState('');

  if (!talhao) return null;

  const atalhos = [
    { dia: hoje, rotulo: 'Hoje' },
    { dia: somarDias(hoje, -1), rotulo: 'Ontem' },
    { dia: somarDias(hoje, -2), rotulo: formatarData(somarDias(hoje, -2)) },
  ];
  const anotacao = estado.chuvas.find((c) => c.talhaoId === talhao.id && c.data === data);
  const mm = lerMm(texto);
  const total = acumulado(registros, safra.inicio, hoje);
  const diferenca = normal && normal > 0 ? Math.round(((total - normal) * 100) / normal) : null;
  const anotados = registros.filter((r) => r.origem === 'manual').length;
  const seca = maiorSequenciaSeca(registros);
  const eventos = estado.eventos.filter((e) => e.talhaoId === talhao.id && e.data >= safra.inicio).sort((a, b) => b.data.localeCompare(a.data));

  const escolherDia = (d: string) => {
    setData(d);
    const existente = estado.chuvas.find((c) => c.talhaoId === talhao.id && c.data === d);
    setTexto(existente ? formatarNumero(existente.mm) : '');
  };

  const salvar = () => {
    if (mm === null) return;
    anotarChuva(talhao.id, data, mm);
    setTexto('');
  };

  return (
    <Tela titulo="Chuva" subtitulo={`Safra ${safra.rotulo} · ${talhao.nome}`}>
      <SeletorTalhao talhoes={estado.talhoes} selecionado={talhao} />

      <Cartao>
        <T variante="subtitulo">Quanto choveu?</T>
        <Linha>
          {atalhos.map(({ dia, rotulo }) => (
            <Chip key={dia} rotulo={rotulo} ativo={data === dia} aoTocar={() => escolherDia(dia)} testID={`dia-${dia}`} />
          ))}
        </Linha>
        {atalhos.every((a) => a.dia !== data) ? <T variante="forte">Dia {formatarData(data)} ({rotuloDia(data, hoje)})</T> : null}
        {anotacao ? <T variante="pequeno">Anotado: {formatarMm(anotacao.mm)}. Digite outro valor para corrigir.</T> : null}
        <Campo
          rotulo="Milímetros no pluviômetro"
          value={texto}
          onChangeText={setTexto}
          keyboardType="decimal-pad"
          placeholder="Ex.: 12"
          testID="campo-mm"
        />
        <Linha>
          {RAPIDOS.map((v) => (
            <Chip key={v} rotulo={`${v} mm`} ativo={mm === v} aoTocar={() => setTexto(String(v))} />
          ))}
        </Linha>
        <Botao titulo="Salvar anotação" aoTocar={salvar} desabilitado={mm === null} testID="salvar-chuva" />
        {anotacao ? <Botao titulo="Apagar anotação deste dia" tipo="texto" aoTocar={() => anotarChuva(talhao.id, data, null)} /> : null}
      </Cartao>

      <Cartao testID="resumo-safra">
        <T variante="subtitulo">Acumulado da safra</T>
        <T variante="numero" cor={tema.marca}>
          {formatarMm(total)}
        </T>
        {normal !== null ? (
          <T>
            Média histórica no mesmo período: {formatarMm(normal)}
            {diferenca !== null ? ` (${diferenca >= 0 ? '+' : ''}${diferenca}%)` : ''}
          </T>
        ) : null}
        <T variante="pequeno">
          {anotados} {anotados === 1 ? 'dia anotado' : 'dias anotados'} por você; o resto é estimado.
          {seca && seca.dias >= 5 ? ` Maior sequência sem chuva: ${seca.dias} dias.` : ''}
        </T>
        {carregando ? <T variante="pequeno">Buscando a estimativa de chuva…</T> : null}
      </Cartao>

      {semEstimativa ? <Aviso tipo="atencao">Sem internet: a estimativa automática não foi atualizada. Suas anotações continuam salvas.</Aviso> : null}

      <Cartao>
        <CalendarioChuva mes={mes} aoMudarMes={setMes} registros={registros} hoje={hoje} inicioSafra={safra.inicio} selecionado={data} aoSelecionar={escolherDia} />
      </Cartao>

      <Botao titulo="Compartilhar cartão de chuva" aoTocar={() => router.push('/cartao-chuva')} testID="abrir-cartao" />
      <Botao titulo={pro ? 'Relatório da safra (PDF)' : 'Relatório da safra (PDF) · Pro'} tipo="secundario" aoTocar={() => router.push(pro ? '/relatorio' : '/assinatura')} />

      <Cartao>
        <T variante="subtitulo">Ocorrências</T>
        <T variante="pequeno">Registre granizo, geada, seca ou excesso de chuva. Entra no relatório da safra.</T>
        <Linha>
          {TIPOS_EVENTO.map((t) => (
            <Chip key={t.valor} rotulo={t.rotulo} ativo={tipoEvento === t.valor} aoTocar={() => setTipoEvento(t.valor)} />
          ))}
        </Linha>
        <Campo rotulo="Observação (opcional)" value={nota} onChangeText={setNota} placeholder="Ex.: granizo fino por 10 minutos" />
        <Botao
          titulo={`Registrar ocorrência de ${formatarData(data)}`}
          tipo="secundario"
          desabilitado={!tipoEvento}
          aoTocar={() => {
            if (!tipoEvento) return;
            registrarEvento({ talhaoId: talhao.id, data, tipo: tipoEvento, nota: nota.trim() || undefined });
            setTipoEvento(null);
            setNota('');
          }}
        />
        {eventos.map((e) => (
          <Linha key={e.id} style={{ justifyContent: 'space-between' }}>
            <T>
              {formatarData(e.data)} · {TIPOS_EVENTO.find((t) => t.valor === e.tipo)?.rotulo}
              {e.nota ? ` — ${e.nota}` : ''}
            </T>
            <Botao titulo="Remover" tipo="texto" aoTocar={() => removerEvento(e.id)} />
          </Linha>
        ))}
      </Cartao>
    </Tela>
  );
}
