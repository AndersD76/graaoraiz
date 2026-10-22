import type { Metadata } from 'next';
import Link from 'next/link';
import { DocumentoLegal } from '@/components/documento-legal';
import { CONTATO_EMAIL, PRECO, RESPONSAVEL, ULTIMA_ATUALIZACAO_LEGAL } from '@/lib/config';
import { metadadosPagina } from '@/lib/metadados';

export const metadata: Metadata = metadadosPagina({
  titulo: 'Termos de Uso',
  descricao:
    'Termos de uso do app Grão Raiz: as informações são estimativas de modelos meteorológicos, a decisão é sua e a assinatura Pro é gerida pela loja do celular.',
  caminho: '/termos',
});

export default function Termos() {
  const email = (
    <a href={`mailto:${CONTATO_EMAIL}`} className="break-all">
      {CONTATO_EMAIL}
    </a>
  );

  return (
    <DocumentoLegal titulo="Termos de Uso" atualizacao={ULTIMA_ATUALIZACAO_LEGAL}>
      <p>
        Estes termos regulam o uso do aplicativo Grão Raiz e do seu site, oferecidos por <strong>{RESPONSAVEL}</strong>.
        Ao usar o app ou o site, você concorda com eles. Leia também a{' '}
        <Link href="/privacidade">Política de Privacidade</Link>.
      </p>

      <h2>1. O que o Grão Raiz faz</h2>
      <p>
        O app mostra, para cada talhão cadastrado no celular, as condições do tempo para pulverizar, colher e entrar com
        máquina, guarda anotações de chuva e emite avisos de geada e temporal. Tudo isso é calculado a partir de
        previsões de modelos meteorológicos fornecidas pelo Open-Meteo.
      </p>

      <h2>2. As informações são estimativas</h2>
      <ul>
        <li>
          Previsões do tempo são estimativas e podem errar — inclusive em horário, local e intensidade de chuva, vento,
          geada e temporal. A estimativa automática de chuva não substitui a leitura de um pluviômetro no local.
        </li>
        <li>
          O serviço depende de internet, de fontes de dados externas e do funcionamento do celular. Previsões e avisos
          podem atrasar, ficar desatualizados ou não chegar (por exemplo, sem sinal, com o celular desligado, com
          economia de bateria ativa ou com notificações desativadas).
        </li>
        <li>Confira sempre as condições no local antes de agir.</li>
      </ul>

      <h2>3. A decisão é sua</h2>
      <p>
        O Grão Raiz é uma ferramenta de apoio. As decisões sobre pulverizar, colher, entrar com máquinas ou proteger a
        lavoura são de responsabilidade de quem as toma. O app <strong>não é receituário agronômico</strong> e não
        recomenda produto, dose ou momento de aplicação de defensivos: essa orientação é do engenheiro agrônomo
        responsável, conforme a legislação. Os limites usados no semáforo seguem referências técnicas usuais e podem não
        servir para todo produto, equipamento ou situação.
      </p>

      <h2>4. Uso permitido</h2>
      <p>
        Você pode usar o app e o site para fins pessoais e profissionais na sua atividade. Não é permitido tentar
        interromper o serviço, fazer consultas automatizadas em massa à nossa API, copiar o app para revenda ou usá-lo
        de forma contrária à lei.
      </p>

      <h2>5. Plano Grátis e assinatura Pro</h2>
      <ul>
        <li>
          O plano Grátis tem os recursos indicados no app e no site. A assinatura Pro libera recursos adicionais e custa,
          no lançamento, {PRECO.mensal} por mês ou {PRECO.anual} por ano. O preço vigente é sempre o exibido na loja no
          momento da compra.
        </li>
        <li>
          A cobrança é feita pela Google Play ou pela App Store, na conta da loja usada na compra, e a assinatura é{' '}
          <strong>renovada automaticamente</strong> ao fim de cada período, até que você cancele.
        </li>
        <li>
          Quando oferecido, o período de teste grátis é de 14 dias. Se você não cancelar até o fim do teste, a cobrança
          começa automaticamente.
        </li>
        <li>
          Para cancelar, acesse as assinaturas da sua conta na Google Play ou nas configurações do seu ID Apple (App
          Store). O cancelamento vale para a próxima renovação; o acesso Pro continua até o fim do período já pago.
          Desinstalar o app não cancela a assinatura.
        </li>
        <li>
          Pedidos de reembolso seguem as regras da loja onde a compra foi feita, sem prejuízo dos direitos previstos no
          Código de Defesa do Consumidor.
        </li>
      </ul>

      <h2>6. Disponibilidade e mudanças</h2>
      <p>
        Trabalhamos para manter o serviço no ar, mas ele pode ficar indisponível por manutenção, falhas técnicas ou de
        fornecedores. Podemos alterar, incluir ou retirar recursos; mudanças que afetem a assinatura Pro serão informadas
        com antecedência.
      </p>

      <h2>7. Limitação de responsabilidade</h2>
      <p>
        Na máxima extensão permitida pela lei brasileira, não respondemos por perdas de produção, de produtos ou de
        receita decorrentes de decisões tomadas com base nas informações do app, de erros de previsão ou de avisos que
        não chegaram. Nada nestes termos afasta direitos que o Código de Defesa do Consumidor (Lei nº 8.078/1990)
        garante a você quando a relação for de consumo.
      </p>

      <h2>8. Propriedade intelectual</h2>
      <p>
        O app, o site, a marca e os textos do Grão Raiz pertencem ao seu titular. Os dados meteorológicos são do
        Open-Meteo, sob a licença CC BY 4.0.
      </p>

      <h2>9. Alterações destes termos</h2>
      <p>
        Podemos atualizar estes termos. A data da última atualização fica no topo da página e mudanças relevantes serão
        informadas no app ou no site.
      </p>

      <h2>10. Lei aplicável e foro</h2>
      <p>
        Estes termos são regidos pelas leis do Brasil. Quando a relação for de consumo, fica eleito o foro do domicílio
        do consumidor.
      </p>

      <h2>11. Contato</h2>
      <p>
        {RESPONSAVEL} — {email}
      </p>
    </DocumentoLegal>
  );
}
