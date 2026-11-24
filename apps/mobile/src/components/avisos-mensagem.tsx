import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { Aviso, Botao, Cartao, T } from '@/components/ui';
import { informar } from '@/lib/dialogo';
import { ativarAvisosMensagem, type EstadoAvisosMensagem, estadoAvisosMensagem } from '@/lib/push-mensagens';

const ONDE = Platform.OS === 'web' ? 'neste navegador' : 'no celular';

/**
 * Convite para ligar o aviso de mensagem nova (push). Some quando já está ligado; `compacto` (dentro da
 * conversa) só mostra o convite, sem as explicações de bloqueado ou indisponível.
 */
export function CartaoAvisosMensagem({ compacto = false }: { compacto?: boolean }) {
  const [estado, setEstado] = useState<EstadoAvisosMensagem | null>(null);
  const [ligando, setLigando] = useState(false);

  useEffect(() => {
    let ativo = true;
    estadoAvisosMensagem()
      .then((e) => ativo && setEstado(e))
      .catch(() => ativo && setEstado('indisponivel'));
    return () => {
      ativo = false;
    };
  }, []);

  if (estado === null || estado === 'ativo') return null;
  if (estado === 'indisponivel') {
    return compacto ? null : (
      <Aviso tipo="info" titulo="Aviso de mensagem por e-mail">
        Aqui não dá para receber aviso de mensagem: quando alguém responder, avisamos no seu e-mail. No iPhone, adicione o site à tela de
        início para receber o aviso.
      </Aviso>
    );
  }
  if (estado === 'negado') {
    return compacto ? null : (
      <Aviso tipo="atencao" titulo="Avisos bloqueados">
        Os avisos do Grão Raiz estão bloqueados {ONDE}. Libere nas configurações para saber quando chegar mensagem; enquanto isso, avisamos
        no seu e-mail.
      </Aviso>
    );
  }

  const ligar = async () => {
    setLigando(true);
    try {
      setEstado(await ativarAvisosMensagem());
    } catch {
      informar('Avisos', 'Não deu para ligar os avisos agora. Tente de novo.');
    } finally {
      setLigando(false);
    }
  };

  return (
    <Cartao tom="marca" testID="avisos-mensagem">
      <T variante="forte">Avisar de mensagem nova</T>
      <T variante="pequeno">Receba um aviso {ONDE} quando alguém responder. Sem isso, avisamos no seu e-mail.</T>
      <Botao titulo="Ligar avisos" icone="sino" carregando={ligando} aoTocar={() => void ligar()} testID="ligar-avisos-mensagem" />
    </Cartao>
  );
}
