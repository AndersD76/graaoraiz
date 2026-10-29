import type { Metadata } from 'next';
import Link from 'next/link';
import { DocumentoLegal } from '@/components/documento-legal';
import { CONTATO_EMAIL, RESPONSAVEL, SITE_URL, ULTIMA_ATUALIZACAO_LEGAL } from '@/lib/config';
import { metadadosPagina } from '@/lib/metadados';

export const metadata: Metadata = metadadosPagina({
  titulo: 'Política de Privacidade',
  descricao:
    'Como o app e o site do Grão Raiz tratam dados pessoais, de acordo com a LGPD: sem conta, dados do app guardados no celular e coordenadas arredondadas para buscar a previsão.',
  caminho: '/privacidade',
});

export default function Privacidade() {
  const email = (
    <a href={`mailto:${CONTATO_EMAIL}`} className="break-all">
      {CONTATO_EMAIL}
    </a>
  );

  return (
    <DocumentoLegal titulo="Política de Privacidade" atualizacao={ULTIMA_ATUALIZACAO_LEGAL}>
      <p>
        Esta política explica quais dados o aplicativo Grão Raiz (Android e iPhone) e o site{' '}
        <span className="break-all">{SITE_URL.replace(/^https?:\/\//, '')}</span> tratam, para quê, com quem são
        compartilhados e como você exerce seus direitos, conforme a Lei Geral de Proteção de Dados Pessoais (Lei nº
        13.709/2018 — LGPD).
      </p>

      <h2>Resumo</h2>
      <ul>
        <li>O app não tem cadastro nem login.</li>
        <li>Seus talhões, anotações de chuva e preferências ficam guardados só no seu celular.</li>
        <li>
          Para buscar a previsão, o app envia apenas as coordenadas do talhão arredondadas (precisão de cerca de 1 km),
          sem nenhum dado que identifique você.
        </li>
        <li>Os avisos de geada, temporal e janelas são gerados no próprio celular.</li>
        <li>Pagamentos da assinatura são feitos pela loja (Google Play ou App Store). Não recebemos dados de cartão.</li>
        <li>No site, a lista de espera guarda apenas o que você preencher, para avisar sobre o lançamento.</li>
      </ul>

      <h2>1. Quem é o controlador</h2>
      <p>
        O controlador dos dados é <strong>{RESPONSAVEL}</strong>. Para qualquer assunto sobre privacidade, inclusive
        para exercer seus direitos, o canal de atendimento é o e-mail {email}.
      </p>

      <h2>2. Dados tratados pelo aplicativo</h2>

      <h3>2.1 Dados que ficam só no seu celular</h3>
      <p>
        O app não pede cadastro. As informações que você inclui — nome, localização e contorno dos talhões, registros
        de chuva, caderno de aplicações, ocorrências com fotos, dados do seu seguro, configurações e preferências de
        avisos — são gravadas apenas na memória do seu aparelho. As fotos que você tira ou escolhe para uma ocorrência
        são copiadas para a pasta do app no celular e só saem dele no PDF que você mesmo compartilhar.
        Não temos acesso a elas. Se você permitir o acesso à localização do aparelho, ela é usada apenas no celular e
        só quando você pede: para marcar o talhão onde você está e mostrar sua posição no mapa. O app não acompanha sua
        localização em segundo plano.
      </p>
      <p>
        Quando você compartilha um cartão de chuva ou gera um relatório em PDF, o arquivo é criado no próprio celular e
        enviado apenas para onde você escolher (por exemplo, o WhatsApp). Não recebemos cópia.
      </p>

      <h3>2.2 Consulta da previsão do tempo</h3>
      <p>
        Para buscar a previsão, o histórico de chuva e os dados usados nos avisos, o app envia as coordenadas do talhão
        arredondadas para duas casas decimais (precisão de cerca de 1 km) ao nosso servidor e/ou diretamente ao serviço
        Open-Meteo, que fornece os dados meteorológicos. Essas consultas não levam nome, telefone, e-mail, identificador
        do aparelho nem o nome do talhão.
      </p>
      <p>
        Como em qualquer conexão pela internet, o endereço IP do aparelho chega aos servidores que respondem à consulta.
        Não usamos o IP para identificar você. Registros técnicos de acesso (como IP, data e hora) podem ser mantidos
        pelo provedor de hospedagem, por segurança e pelo prazo exigido pelo Marco Civil da Internet (Lei nº
        12.965/2014).
      </p>
      <p>
        <strong>Base legal:</strong> execução do serviço que você solicitou ao usar o app (art. 7º, V, da LGPD).
      </p>

      <h3>2.3 Imagens de satélite</h3>
      <p>
        Quando você abre a tela de satélite, o app envia o contorno do talhão (ou um quadrado em volta do ponto marcado)
        ao Microsoft Planetary Computer, que guarda as imagens públicas do satélite Sentinel-2 (programa Copernicus), para
        localizar as passagens e calcular o vigor da área. A consulta não leva nome, contato, identificador do aparelho
        nem o nome do talhão. As imagens e os resultados ficam guardados no celular.
      </p>
      <p>
        <strong>Base legal:</strong> execução do serviço que você solicitou ao usar o app (art. 7º, V, da LGPD).
      </p>

      <h3>2.4 Notificações</h3>
      <p>
        Os avisos de chuva chegando, geada, temporal, doença pelo clima, chuva sobre uma aplicação, janelas de
        pulverização ou de tempo seco e o boletim da manhã são calculados e agendados no próprio celular, a partir da
        previsão baixada. Você pode desligá-los nas configurações do app ou do sistema.
      </p>

      <h3>2.5 Assinatura Pro</h3>
      <p>
        A assinatura é cobrada e processada pela Google Play (Android) ou pela App Store (iPhone), de acordo com as
        políticas de cada loja. Para saber se a assinatura está ativa, usamos o serviço RevenueCat, que recebe um
        identificador anônimo gerado pelo app e os comprovantes de compra enviados pela loja. Não recebemos número de
        cartão nem outros dados de pagamento.
      </p>
      <p>
        <strong>Base legal:</strong> execução de contrato (art. 7º, V, da LGPD).
      </p>

      <h2>3. Dados tratados pelo site (lista de espera e avaliação)</h2>
      <p>
        Se você entrar na lista de espera, guardamos o que preencher: contato (WhatsApp ou e-mail) e, se informar,
        nome, cidade, UF, cultura e se quer testar a versão de teste. Usamos esses dados apenas para avisar sobre o
        lançamento do app e convidar para testes. Eles ficam armazenados em um banco de dados contratado (Supabase),
        com acesso restrito ao nosso servidor.
      </p>
      <p>
        Se você responder à avaliação da versão de teste (página /avaliar), guardamos as respostas sem o seu nome: nota,
        o que ajudou, comentário, perfil e, se informar, cidade e contato. Usamos as respostas para melhorar o app e o
        contato só para responder você. Elas ficam em um banco de dados contratado (Neon), com acesso restrito ao nosso
        servidor.
      </p>
      <p>
        <strong>Base legal:</strong> consentimento (art. 7º, I, da LGPD), que você pode revogar a qualquer momento.
      </p>
      <p>
        <strong>Prazo:</strong> mantemos esses dados até você pedir a remoção ou, no máximo, por 12 meses após o
        lançamento do app — o que acontecer primeiro.
      </p>
      <p>O site não usa cookies de rastreamento nem ferramentas de publicidade.</p>

      <h2>4. Compartilhamento</h2>
      <p>
        Não vendemos nem alugamos dados. O compartilhamento acontece somente com os operadores necessários para o
        funcionamento do serviço, citados nesta política:
      </p>
      <ul>
        <li>
          <strong>Open-Meteo</strong> — recebe as coordenadas arredondadas para devolver a previsão.
        </li>
        <li>
          <strong>Google Play e App Store</strong> — processam a compra e a cobrança da assinatura.
        </li>
        <li>
          <strong>RevenueCat</strong> — gerencia o status da assinatura com um identificador anônimo e os comprovantes de
          compra.
        </li>
        <li>
          <strong>Provedor de hospedagem do site e da API e Supabase</strong> — hospedam o site, respondem às consultas
          de previsão e guardam a lista de espera.
        </li>
      </ul>
      <p>Também podemos fornecer dados quando houver obrigação legal ou ordem de autoridade competente.</p>

      <h2>5. Transferência internacional</h2>
      <p>
        Alguns desses operadores, como o Open-Meteo e o RevenueCat, podem processar dados em servidores fora do Brasil.
        Nesses casos, a transferência ocorre para a execução do serviço e com as garantias previstas no art. 33 da LGPD.
      </p>

      <h2>6. Segurança</h2>
      <p>
        Coletamos o mínimo necessário. As conexões usam criptografia (HTTPS), as coordenadas enviadas são arredondadas e o
        banco da lista de espera não aceita acesso público — apenas o nosso servidor consegue ler e gravar.
      </p>

      <h2>7. Seus direitos</h2>
      <p>Pela LGPD (art. 18), você pode pedir, a qualquer momento:</p>
      <ul>
        <li>confirmação de que tratamos seus dados e acesso a eles;</li>
        <li>correção de dados incompletos, inexatos ou desatualizados;</li>
        <li>anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei;</li>
        <li>portabilidade dos dados a outro fornecedor;</li>
        <li>eliminação dos dados tratados com base no seu consentimento;</li>
        <li>informação sobre com quem compartilhamos seus dados;</li>
        <li>revogação do consentimento.</li>
      </ul>
      <p>
        Envie o pedido para {email}. Os dados do app ficam no seu celular e você mesmo pode apagá-los — veja{' '}
        <Link href="/excluir-dados">como excluir seus dados</Link>. Você também pode apresentar reclamação à Autoridade
        Nacional de Proteção de Dados (ANPD).
      </p>

      <h2>8. Crianças e adolescentes</h2>
      <p>O Grão Raiz é voltado a produtores rurais e não é direcionado a menores de 18 anos.</p>

      <h2>9. Alterações desta política</h2>
      <p>
        Podemos atualizar esta política para refletir mudanças no app, no site ou na lei. A data da última atualização
        fica no topo da página. Mudanças relevantes serão informadas no app ou no site.
      </p>

      <h2>10. Contato</h2>
      <p>
        {RESPONSAVEL} — {email}
      </p>
    </DocumentoLegal>
  );
}
