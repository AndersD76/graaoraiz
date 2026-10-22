import type { Metadata } from 'next';
import Link from 'next/link';
import { DocumentoLegal } from '@/components/documento-legal';
import { CONTATO_EMAIL } from '@/lib/config';
import { metadadosPagina } from '@/lib/metadados';

export const metadata: Metadata = metadadosPagina({
  titulo: 'Excluir seus dados',
  descricao:
    'Como apagar os dados do app Grão Raiz no celular, cancelar a assinatura na loja e pedir a remoção da lista de espera do site.',
  caminho: '/excluir-dados',
});

export default function ExcluirDados() {
  const assunto = encodeURIComponent('Excluir meus dados da lista de espera');
  return (
    <DocumentoLegal titulo="Excluir seus dados" avisoRevisao={false}>
      <p>
        O Grão Raiz não tem cadastro nem conta. Por isso, a maior parte dos seus dados está no seu celular, e você mesmo
        pode apagá-la. Veja abaixo como excluir cada tipo de dado.
      </p>

      <h2>1. Dados do aplicativo (talhões, chuvas e preferências)</h2>
      <ol>
        <li>Abra o Grão Raiz.</li>
        <li>
          Vá em <strong>Ajustes</strong>.
        </li>
        <li>
          Toque em <strong>“Apagar todos os meus dados”</strong> e confirme.
        </li>
      </ol>
      <p>
        Isso apaga do aparelho todos os talhões, registros de chuva, previsões salvas e preferências. Desinstalar o app
        também remove esses dados do celular. Como eles nunca são enviados para nós, não há cópia em nossos servidores.
      </p>

      <h2>2. Assinatura Pro</h2>
      <p>
        Os dados de compra e assinatura são gerenciados pela loja onde você assinou e pelo serviço de gestão de
        assinaturas (RevenueCat), vinculados a um identificador anônimo. Apagar o app ou os dados não cancela a
        assinatura. Para cancelar:
      </p>
      <ul>
        <li>
          <strong>Android:</strong> abra a Google Play, toque na sua foto de perfil → <strong>Pagamentos e assinaturas</strong>{' '}
          → <strong>Assinaturas</strong> → Grão Raiz → <strong>Cancelar assinatura</strong>.
        </li>
        <li>
          <strong>iPhone:</strong> abra <strong>Ajustes</strong> → toque no seu nome → <strong>Assinaturas</strong> →
          Grão Raiz → <strong>Cancelar assinatura</strong>.
        </li>
      </ul>
      <p>
        Para excluir os dados que a Google ou a Apple guardam sobre suas compras, siga as opções de privacidade da sua
        conta na respectiva loja.
      </p>

      <h2>3. Lista de espera do site</h2>
      <p>
        Se você se cadastrou na lista de espera, envie um e-mail para{' '}
        <a href={`mailto:${CONTATO_EMAIL}?subject=${assunto}`} className="break-all">
          {CONTATO_EMAIL}
        </a>{' '}
        pedindo a exclusão e informe o contato (WhatsApp ou e-mail) que usou no cadastro. O pedido é atendido em até 15
        dias, e avisamos quando for concluído.
      </p>

      <p>
        Mais detalhes sobre quais dados tratamos estão na <Link href="/privacidade">Política de Privacidade</Link>.
      </p>
    </DocumentoLegal>
  );
}
