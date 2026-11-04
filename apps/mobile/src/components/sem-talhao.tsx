import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Ilustracao, type NomeIlustracao } from '@/components/icone';
import { Botao, Cartao, T, Tela } from '@/components/ui';
import { COM_CONTAS, useConta } from '@/lib/conta';

/**
 * Aba que depende de talhão, antes do primeiro: diz o que a aba faz e leva ao cadastro.
 * Sem conta, cadastrar passa antes por criar a conta (o talhão fica guardado nela).
 */
export function SemTalhao({ titulo, subtitulo, ilustracao = 'seedling', texto }: { titulo: string; subtitulo?: string; ilustracao?: NomeIlustracao; texto: string }) {
  const router = useRouter();
  const conta = useConta();
  const pedeConta = COM_CONTAS && !conta;

  return (
    <Tela titulo={titulo} subtitulo={subtitulo}>
      <Cartao tom="marca">
        <Ilustracao nome={ilustracao} tamanho={72} />
        <T variante="subtitulo">Cadastre seu talhão</T>
        <T variante="pequeno">{texto}</T>
        <Botao
          titulo="Cadastrar meu talhão"
          icone="mais"
          testID="cadastrar-talhao"
          aoTocar={() => (pedeConta ? router.push({ pathname: '/entrar', params: { modo: 'criar', depois: 'onboarding' } }) : router.push('/onboarding'))}
        />
        {pedeConta ? (
          <Botao titulo="Já tenho conta" tipo="texto" aoTocar={() => router.push({ pathname: '/entrar', params: { depois: 'onboarding' } })} testID="ja-tenho-conta" />
        ) : null}
      </Cartao>
      <Botao titulo="Ver máquinas usadas" tipo="secundario" icone="trator" aoTocar={() => router.navigate('/maquinas')} />
      {conta ? <Botao titulo="Ajustes" tipo="texto" aoTocar={() => router.push('/ajustes')} /> : null}
      <T variante="pequeno" style={estilos.centro}>
        É grátis.{pedeConta ? ' Sem conta você já vê as máquinas à venda.' : ''}
      </T>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  centro: { textAlign: 'center' },
});
