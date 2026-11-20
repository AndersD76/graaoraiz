import type { Metadata } from 'next';
import Link from 'next/link';
import { DocumentoLegal } from '@/components/documento-legal';
import { ContatoWhatsApp } from '@/components/contato-whatsapp';
import { metadadosPagina } from '@/lib/metadados';

export const metadata: Metadata = metadadosPagina({
  titulo: 'Excluir sua conta e seus dados',
  descricao: 'Como excluir a conta do Grão Raiz e todos os dados dela, pelo app ou pelo WhatsApp.',
  caminho: '/excluir-dados',
});

export default function ExcluirDados() {
  const contato = <ContatoWhatsApp mensagem="Quero excluir minha conta do Grão Raiz. E-mail da conta: " />;
  return (
    <DocumentoLegal titulo="Excluir sua conta e seus dados" avisoRevisao={false}>
      <p>Você pode excluir a sua conta do Grão Raiz e todos os dados dela a qualquer momento, pelo próprio app ou pelo WhatsApp.</p>

      <h2>1. Pelo app (na hora)</h2>
      <ol>
        <li>Abra o Grão Raiz e entre na sua conta.</li>
        <li>
          Toque na <strong>engrenagem</strong> (Ajustes), no alto da tela Hoje ou no menu.
        </li>
        <li>
          Em <strong>Sua conta</strong>, toque em <strong>“Excluir minha conta”</strong> e confirme.
        </li>
      </ol>

      <h2>2. Pelo WhatsApp (sem o app)</h2>
      <p>
        Mande uma mensagem para o {contato} pedindo a exclusão e informando o e-mail da sua conta. Para proteger a sua
        conta, confirmamos o pedido por esse e-mail antes de excluir. Atendemos em até 15 dias e avisamos quando for
        concluído.
      </p>

      <h2>3. O que é apagado</h2>
      <ul>
        <li>a conta (nome, e-mail e senha);</li>
        <li>os dados da lavoura guardados na conta: talhões, chuvas, caderno, ocorrências e preferências;</li>
        <li>os seus anúncios de máquinas, as fotos deles, os registros de quem pediu o seu contato e das vendas que você marcou;</li>
        <li>no aparelho, tudo o que o app tinha guardado.</li>
      </ul>
      <p>
        <strong>O que fica guardado:</strong> os registros de acesso ficam 6 meses, como pede o Marco Civil da Internet.
        O Grão Raiz é grátis: não há assinatura para cancelar.
      </p>

      <h2>4. Avaliação e lista de espera</h2>
      <p>
        Se você respondeu à avaliação ou entrou na lista de espera, peça a exclusão pelo {contato} e informe o
        contato que usou.
      </p>

      <p>
        Mais detalhes sobre quais dados tratamos estão na <Link href="/privacidade">Política de Privacidade</Link>.
      </p>
    </DocumentoLegal>
  );
}
