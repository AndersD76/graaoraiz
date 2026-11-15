import type { Metadata } from 'next';
import Link from 'next/link';
import { DocumentoLegal } from '@/components/documento-legal';
import { CONTATO_EMAIL } from '@/lib/config';
import { metadadosPagina } from '@/lib/metadados';

export const metadata: Metadata = metadadosPagina({
  titulo: 'Excluir sua conta e seus dados',
  descricao: 'Como excluir a conta do Grão Raiz e todos os dados dela, pelo app ou por e-mail, e como cancelar a assinatura na loja.',
  caminho: '/excluir-dados',
});

export default function ExcluirDados() {
  const assunto = encodeURIComponent('Excluir minha conta do Grão Raiz');
  const emailContato = (
    <a href={`mailto:${CONTATO_EMAIL}?subject=${assunto}`} className="break-all">
      {CONTATO_EMAIL}
    </a>
  );
  return (
    <DocumentoLegal titulo="Excluir sua conta e seus dados" avisoRevisao={false}>
      <p>Você pode excluir a sua conta do Grão Raiz e todos os dados dela a qualquer momento, pelo próprio app ou por e-mail.</p>

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

      <h2>2. Por e-mail (sem o app)</h2>
      <p>
        Envie um e-mail para {emailContato}, a partir do e-mail da sua conta, com o assunto “Excluir minha conta do Grão
        Raiz”. Atendemos em até 15 dias e avisamos quando for concluído.
      </p>

      <h2>3. O que é apagado</h2>
      <ul>
        <li>a conta (nome, e-mail e senha);</li>
        <li>os dados da lavoura guardados na conta: talhões, chuvas, caderno, ocorrências e preferências;</li>
        <li>os seus anúncios de máquinas, as fotos deles e os registros de quem pediu o seu contato;</li>
        <li>no aparelho, tudo o que o app tinha guardado.</li>
      </ul>
      <p>
        <strong>O que fica guardado:</strong> se você marcou alguma máquina como vendida, o registro da venda e da
        comissão (valor, data e contato) fica guardado pelo prazo exigido pela legislação fiscal e civil, em geral 5
        anos. Os registros de acesso ficam 6 meses, como pede o Marco Civil da Internet.
      </p>

      <h2>4. Assinatura Pro</h2>
      <p>Excluir a conta não cancela a assinatura feita pela loja. Para cancelar:</p>
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

      <h2>5. Avaliação e lista de espera</h2>
      <p>
        Se você respondeu à avaliação ou entrou na lista de espera, peça a exclusão por e-mail para {emailContato} e
        informe o contato que usou.
      </p>

      <p>
        Mais detalhes sobre quais dados tratamos estão na <Link href="/privacidade">Política de Privacidade</Link>.
      </p>
    </DocumentoLegal>
  );
}
