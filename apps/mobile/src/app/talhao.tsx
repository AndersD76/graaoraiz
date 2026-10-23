import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { dadosIniciais, FormTalhao, lerArea } from '@/components/form-talhao';
import { Botao, Tela } from '@/components/ui';
import { reagendarAvisos } from '@/lib/avisos';
import { confirmar } from '@/lib/dialogo';
import { LIMITE_TALHOES_GRATIS, removerTalhao, salvarTalhao, temPro, useEstado } from '@/lib/estado';

export default function TalhaoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const estado = useEstado();
  const existente = id ? estado.talhoes.find((t) => t.id === id) : undefined;
  const [dados, setDados] = useState(() => dadosIniciais(existente));

  // Criar além do limite do grátis (por link direto, por exemplo) leva ao Pro. Vale só na entrada:
  // depois de salvar, a contagem sobe e a tela não pode mandar para o Pro enquanto volta.
  const [alemDoLimite] = useState(() => !existente && !temPro(estado) && estado.talhoes.length >= LIMITE_TALHOES_GRATIS);
  if (alemDoLimite) return <Redirect href="/assinatura" />;

  const valido = dados.nome.trim().length > 0 && dados.coordenada !== null;

  const salvar = () => {
    if (!dados.coordenada) return;
    salvarTalhao({
      id: existente?.id,
      nome: dados.nome.trim(),
      lat: dados.coordenada.lat,
      lon: dados.coordenada.lon,
      cultura: dados.cultura,
      dataPlantio: dados.dataPlantio,
      solo: dados.solo,
      areaHa: lerArea(dados.areaTexto),
      contorno: dados.contorno && dados.contorno.length >= 3 ? dados.contorno : null,
      zarc: dados.zarc,
      baixada: dados.baixada,
    });
    void reagendarAvisos({ buscar: true });
    router.back();
  };

  const excluir = async () => {
    if (!existente) return;
    const ok = await confirmar('Excluir talhão', `Apagar "${existente.nome}" com as anotações, ocorrências e aplicações dele?`, 'Excluir');
    if (!ok) return;
    removerTalhao(existente.id);
    void reagendarAvisos();
    router.back();
  };

  return (
    <Tela comAbas={false} cabecalhoNativo>
      <FormTalhao dados={dados} aoMudar={setDados} />
      <Botao titulo="Salvar talhão" icone="check" aoTocar={salvar} desabilitado={!valido} testID="salvar-talhao" />
      {existente ? <Botao titulo="Excluir talhão" tipo="perigo" icone="lixeira" aoTocar={excluir} testID="excluir-talhao" /> : null}
    </Tela>
  );
}
