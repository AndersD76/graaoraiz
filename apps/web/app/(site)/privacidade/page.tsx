import type { Metadata } from 'next';
import Link from 'next/link';
import { DocumentoLegal } from '@/components/documento-legal';
import { CONTATO_EMAIL, RESPONSAVEL, SITE_URL, ULTIMA_ATUALIZACAO_LEGAL } from '@/lib/config';
import { metadadosPagina } from '@/lib/metadados';

export const metadata: Metadata = metadadosPagina({
  titulo: 'Política de Privacidade',
  descricao:
    'Como o Grão Raiz trata seus dados pela LGPD: conta, dados da lavoura na nuvem, clima, satélite, PRODES, CAR e classificados de máquinas.',
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
        Esta política explica quais dados o Grão Raiz — o aplicativo (no navegador, no Android e no iPhone) e o site{' '}
        <span className="break-all">{SITE_URL.replace(/^https?:\/\//, '')}</span> — trata, para quê, com quem são
        compartilhados e como você exerce seus direitos, conforme a Lei Geral de Proteção de Dados Pessoais (Lei nº
        13.709/2018 — LGPD).
      </p>

      <h2>Resumo</h2>
      <ul>
        <li>Para usar o app você cria uma conta com nome, e-mail e senha. A senha é guardada protegida (embaralhada), nunca em texto.</li>
        <li>Seus talhões, chuvas, caderno e preferências ficam guardados na sua conta, num banco de dados na nuvem, para você trocar de aparelho sem perder nada.</li>
        <li>Para buscar previsão, satélite, município e a checagem de EUDR e crédito rural, o app envia a localização ou o contorno do talhão aos serviços citados abaixo, sem o seu nome.</li>
        <li>Nos classificados de máquinas, o anúncio é público; o seu WhatsApp aparece só para quem tem conta e pede o contato, e registramos quem pediu.</li>
        <li>Medimos o uso do app no nosso próprio banco, sem nome, e-mail ou WhatsApp e sem empresas de fora.</li>
        <li>Não vendemos dados e não usamos publicidade nem cookies de rastreamento.</li>
      </ul>

      <h2>1. Quem é o controlador</h2>
      <p>
        O controlador dos dados é <strong>{RESPONSAVEL}</strong>. Para qualquer assunto sobre privacidade, inclusive
        para exercer seus direitos, o canal de atendimento é o e-mail {email}.
      </p>

      <h2>2. Dados que tratamos e para quê</h2>

      <h3>2.1 Conta</h3>
      <p>
        Nome, e-mail e senha (guardada só como resumo criptográfico). Usamos para você entrar no app, guardar seus dados
        e, se pedir, mandar o código de &quot;esqueci a senha&quot; por e-mail.
      </p>
      <p>
        <strong>Base legal:</strong> execução de contrato (art. 7º, V, da LGPD).
      </p>

      <h3>2.2 Dados da lavoura</h3>
      <p>
        O que você cadastra no app — nome, localização e contorno dos talhões, cultura e plantio, registros de chuva,
        caderno de aplicações, ocorrências, dados do seguro, limites e preferências de avisos — fica no aparelho e numa
        cópia na sua conta, atualizada sozinha. As fotos de ocorrências ficam só no aparelho e saem dele apenas no PDF que
        você mesmo compartilhar. Se você permitir a localização do aparelho, ela é usada só quando você pede (para
        marcar o talhão onde está); o app não acompanha sua localização em segundo plano.
      </p>
      <p>
        <strong>Base legal:</strong> execução de contrato (art. 7º, V, da LGPD).
      </p>

      <h3>2.3 Consultas feitas com a localização do talhão</h3>
      <p>Para mostrar as informações do talhão, o app (ou o nosso servidor, em nome dele) envia, sem o seu nome:</p>
      <ul>
        <li>
          <strong>Previsão e histórico do tempo:</strong> as coordenadas arredondadas (cerca de 1 km) ao Open-Meteo.
        </li>
        <li>
          <strong>Município do talhão:</strong> o ponto do talhão ao serviço de mapas do IBGE.
        </li>
        <li>
          <strong>Imagens de satélite e vigor:</strong> o contorno do talhão ao Microsoft Planetary Computer (imagens
          Sentinel-2, programa Copernicus).
        </li>
        <li>
          <strong>Checagem de EUDR e crédito rural:</strong> o contorno do talhão ao PRODES (INPE, TerraBrasilis) e ao
          Cadastro Ambiental Rural (SICAR). O resultado mostra dados públicos do imóvel no CAR, como número e situação.
        </li>
        <li>
          <strong>Mapa:</strong> o aparelho baixa os pedaços do mapa da Esri (satélite) e do OpenFreeMap (nomes de
          lugares), como em qualquer mapa na internet.
        </li>
      </ul>
      <p>
        Os preços do dia (Cepea/Esalq e Banco Central) são buscados pelo nosso servidor e não usam dados seus.
      </p>
      <p>
        <strong>Base legal:</strong> execução do serviço que você solicitou (art. 7º, V, da LGPD).
      </p>

      <h3>2.4 Classificados de máquinas e implementos</h3>
      <p>
        Quando você anuncia, guardamos o anúncio (categoria, título, marca, modelo, ano, horas de uso, preço, cidade,
        descrição e fotos), o seu WhatsApp e a data em que aceitou os termos de uso. O anúncio, as fotos, a cidade e o
        seu primeiro nome ficam visíveis para qualquer pessoa. O WhatsApp aparece só para quem tem conta e toca em
        &quot;Chamar no WhatsApp&quot;; registramos quem pediu cada contato. Quando você marca o anúncio como vendido,
        guardamos o valor informado da venda, para acompanhar como os classificados estão funcionando. Anunciar e vender
        é grátis: não cobramos comissão.
      </p>
      <p>
        <strong>Base legal:</strong> execução de contrato (art. 7º, V, da LGPD).
      </p>

      <h3>2.5 Notificações</h3>
      <p>
        Os avisos de chuva chegando, geada, temporal, doença pelo clima, chuva sobre uma aplicação, preço-alvo e o boletim
        da manhã são calculados e agendados no próprio aparelho. Você pode desligá-los no app ou no sistema.
      </p>

      <h3>2.6 Pagamentos</h3>
      <p>
        Hoje o Grão Raiz é todo grátis: não há assinatura nem compra dentro do app, e não tratamos dados de pagamento. Se
        um dia houver plano pago, esta política será atualizada antes.
      </p>

      <h3>2.7 Avaliação da versão de teste</h3>
      <p>
        Se você responder à avaliação (página /avaliar), guardamos as respostas sem o seu nome: nota, o que ajudou,
        comentário, perfil e, se informar, cidade e contato. Usamos para melhorar o app e o contato só para responder.
      </p>
      <p>
        <strong>Base legal:</strong> consentimento (art. 7º, I, da LGPD), que você pode revogar a qualquer momento.
      </p>

      <h3>2.8 Registros de acesso</h3>
      <p>
        Como em qualquer serviço na internet, o endereço IP, a data e a hora dos acessos chegam aos nossos servidores e
        são mantidos pelo provedor de hospedagem, por segurança e pelo prazo exigido pelo Marco Civil da Internet (Lei nº
        12.965/2014).
      </p>

      <h3>2.9 Uso do app e origem do cadastro</h3>
      <p>
        Para saber o que funciona e o que atrapalha, registramos no nosso próprio banco alguns passos de uso: abriu o
        app, criou o talhão, viu a previsão do talhão, ligou os avisos, viu, criou ou vendeu um anúncio, pediu contato.
        Esses registros não levam nome, e-mail nem WhatsApp, e não vão para empresas de fora. Também guardamos de onde
        veio o seu primeiro acesso (o link ou site de origem e a campanha, quando o link tiver) e o último. Essa informação
        fica no navegador e só chega até nós se você criar uma conta.
      </p>
      <p>
        <strong>Base legal:</strong> legítimo interesse em melhorar o serviço (art. 7º, IX, da LGPD). Você pode pedir a
        exclusão pelo contato abaixo.
      </p>

      <h2>3. Por quanto tempo guardamos</h2>
      <ul>
        <li>Conta, dados da lavoura, anúncios e registros de contato: enquanto a conta existir. Ao excluir a conta, eles são apagados.</li>
        <li>Registros de uso do app: até 24 meses. Ao excluir a conta, eles deixam de ser ligados a ela.</li>
        <li>Registros de venda: enquanto a conta existir. Ao excluir a conta, eles são apagados.</li>
        <li>Avaliações: até 12 meses ou até você pedir a remoção.</li>
        <li>Registros de acesso: 6 meses, como pede o Marco Civil da Internet.</li>
      </ul>

      <h2>4. Compartilhamento</h2>
      <p>
        Não vendemos nem alugamos dados. O compartilhamento acontece somente com quem é necessário para o serviço
        funcionar:
      </p>
      <ul>
        <li>
          <strong>Railway</strong> (hospedagem do app e do servidor) e <strong>Neon</strong> (banco de dados da conta,
          da lavoura, dos anúncios e das avaliações).
        </li>
        <li>
          <strong>Resend</strong> — envia o e-mail com o código de &quot;esqueci a senha&quot;.
        </li>
        <li>
          <strong>Open-Meteo, IBGE, Microsoft Planetary Computer, INPE (PRODES) e SICAR (CAR), Esri e OpenFreeMap</strong>{' '}
          — recebem a localização ou o contorno do talhão, sem o seu nome, como descrito no item 2.3.
        </li>
        <li>
          <strong>Compradores interessados</strong> — veem o seu anúncio e, se pedirem o contato, o seu WhatsApp.
        </li>
      </ul>
      <p>Também podemos fornecer dados quando houver obrigação legal ou ordem de autoridade competente.</p>

      <h2>5. Transferência internacional</h2>
      <p>
        A hospedagem (Railway) e o banco de dados (Neon) ficam em servidores nos Estados Unidos, e outros operadores
        citados, como o Open-Meteo, o Microsoft Planetary Computer e a Resend, também podem processar dados
        fora do Brasil. A transferência é necessária para executar o serviço que você contratou e segue as garantias do
        art. 33 da LGPD.
      </p>

      <h2>6. Segurança</h2>
      <p>
        Coletamos o mínimo necessário. As conexões usam criptografia (HTTPS), a senha é guardada só como resumo
        criptográfico, as coordenadas enviadas para a previsão são arredondadas e o banco de dados não aceita acesso
        público: só o nosso servidor lê e grava.
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
        Envie o pedido para {email}. Você mesmo pode excluir a conta e todos os dados dela no app — veja{' '}
        <Link href="/excluir-dados">como excluir sua conta e seus dados</Link>. Você também pode apresentar reclamação à
        Autoridade Nacional de Proteção de Dados (ANPD).
      </p>

      <h2>8. Crianças e adolescentes</h2>
      <p>O Grão Raiz é voltado a produtores rurais e não é direcionado a menores de 18 anos.</p>

      <h2>9. Alterações desta política</h2>
      <p>
        Podemos atualizar esta política para refletir mudanças no app, no site ou na lei. A data da última atualização
        fica no topo da página. Mudanças relevantes serão informadas no app.
      </p>

      <h2>10. Contato</h2>
      <p>
        {RESPONSAVEL} — {email}
      </p>
    </DocumentoLegal>
  );
}
