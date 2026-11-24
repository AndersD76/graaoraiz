import { useRouter } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { StyleSheet } from 'react-native';

import { Ilustracao, type NomeIlustracao } from '@/components/icone';
import { Botao, Cartao, T, Tela } from '@/components/ui';
import { COM_CONTAS, entrarNaDemonstracao, ErroConta, useConta } from '@/lib/conta';
import { informar } from '@/lib/dialogo';

/**
 * Convite para cadastrar o primeiro talhão. Sem conta, cadastrar passa antes por criar a conta
 * (o talhão fica guardado nela).
 */
export function ConviteTalhao({ titulo = 'Cadastre seu talhão', ilustracao, texto }: { titulo?: string; ilustracao?: NomeIlustracao; texto: string }) {
  const router = useRouter();
  const conta = useConta();
  const pedeConta = COM_CONTAS && !conta;
  const [abrindoDemo, setAbrindoDemo] = useState(false);

  // "Ver como funciona": entra na conta de demonstração e mostra a tela Hoje de uma lavoura de exemplo.
  const verDemonstracao = async () => {
    setAbrindoDemo(true);
    try {
      await entrarNaDemonstracao();
      router.navigate('/');
    } catch (e) {
      informar('Demonstração', e instanceof ErroConta ? e.message : 'Não deu para abrir a demonstração agora. Tente de novo.');
    } finally {
      setAbrindoDemo(false);
    }
  };

  return (
    <Cartao tom="marca">
      {ilustracao ? <Ilustracao nome={ilustracao} tamanho={72} /> : null}
      <T variante="subtitulo">{titulo}</T>
      <T variante="pequeno">{texto}</T>
      <Botao
        titulo="Cadastrar meu talhão"
        icone="mais"
        testID="cadastrar-talhao"
        aoTocar={() => (pedeConta ? router.push({ pathname: '/entrar', params: { modo: 'criar', depois: 'onboarding' } }) : router.push('/onboarding'))}
      />
      {pedeConta ? (
        <>
          <Botao titulo="Ver como funciona" tipo="secundario" icone="olho" carregando={abrindoDemo} aoTocar={() => void verDemonstracao()} testID="ver-demonstracao" />
          <T variante="pequeno" style={estilos.centro}>
            Abre uma lavoura de exemplo, com chuvas, aplicações e satélite. Nada fica salvo.
          </T>
          <Botao titulo="Já tenho conta" tipo="texto" aoTocar={() => router.push({ pathname: '/entrar', params: { depois: 'onboarding' } })} testID="ja-tenho-conta" />
        </>
      ) : null}
    </Cartao>
  );
}

/** Aba que depende de talhão, antes do primeiro: diz o que a aba faz e leva ao cadastro. */
export function SemTalhao({
  titulo,
  subtitulo,
  ilustracao = 'seedling',
  texto,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  ilustracao?: NomeIlustracao;
  texto: string;
  /** Antes do convite (ex.: o aviso de localização na tela Hoje). */
  children?: ReactNode;
}) {
  const router = useRouter();
  const conta = useConta();

  return (
    // Estreita: no computador o convite fica do tamanho de um celular, centrado, em vez de esticar na tela toda.
    <Tela titulo={titulo} subtitulo={subtitulo} estreita>
      {children}
      <ConviteTalhao ilustracao={ilustracao} texto={texto} />
      <Botao titulo="Ver máquinas usadas" tipo="secundario" icone="trator" aoTocar={() => router.navigate('/maquinas')} />
      {conta ? <Botao titulo="Ajustes" tipo="texto" aoTocar={() => router.push('/ajustes')} /> : null}
      <T variante="pequeno" style={estilos.centro}>
        É grátis.{COM_CONTAS && !conta ? ' Sem conta você já vê as máquinas à venda.' : ''}
      </T>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  centro: { textAlign: 'center' },
});
