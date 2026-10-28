import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Ilustracao } from '@/components/icone';
import { Aviso, Botao, Campo, Cartao, Chip, Linha, T, Tela } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { LIBERA_PRO } from '@/lib/config';
import { criarConta, entrar, entrarNaDemonstracao, ErroConta, pedirCodigo, redefinirSenha, useConta } from '@/lib/conta';

type Modo = 'entrar' | 'criar' | 'recuperar';

/** Entrar ou criar conta (e-mail e senha). Os dados do app ficam guardados na conta. */
export default function EntrarScreen() {
  const router = useRouter();
  const tema = useTheme();
  const conta = useConta();
  const [modo, setModo] = useState<Modo>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [codigoEnviado, setCodigoEnviado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<'conta' | 'demo' | 'codigo' | null>(null);

  if (conta) return <Redirect href="/" />;

  const executar = async (qual: 'conta' | 'demo', acao: () => Promise<unknown>) => {
    setErro(null);
    setOcupado(qual);
    try {
      await acao();
      router.replace('/');
    } catch (e) {
      setErro(e instanceof ErroConta ? e.message : 'Algo deu errado. Tente de novo.');
    } finally {
      setOcupado(null);
    }
  };

  const mudarModo = (novo: Modo) => {
    setModo(novo);
    setErro(null);
    setCodigoEnviado(null);
    setCodigo('');
    setSenha('');
  };

  const mandarCodigo = async () => {
    if (!email.trim()) return setErro('Informe o e-mail da sua conta.');
    setErro(null);
    setOcupado('codigo');
    try {
      setCodigoEnviado(await pedirCodigo(email.trim()));
    } catch (e) {
      setErro(e instanceof ErroConta ? e.message : 'Algo deu errado. Tente de novo.');
    } finally {
      setOcupado(null);
    }
  };

  const enviar = () => {
    if (modo === 'recuperar') {
      if (!/^\d{6}$/.test(codigo.trim())) return setErro('Digite o código de 6 números que chegou no e-mail.');
      if (senha.length < 6) return setErro('A senha nova precisa de pelo menos 6 caracteres.');
      return void executar('conta', () => redefinirSenha(email.trim(), codigo.trim(), senha));
    }
    if (modo === 'criar' && !nome.trim()) return setErro('Informe seu nome.');
    if (!email.trim()) return setErro('Informe o e-mail.');
    if (modo === 'criar' && senha.length < 6) return setErro('A senha precisa de pelo menos 6 caracteres.');
    if (!senha) return setErro('Informe a senha.');
    void executar('conta', () => (modo === 'criar' ? criarConta(nome, email.trim(), senha) : entrar(email.trim(), senha)));
  };

  return (
    <Tela comAbas={false}>
      <View style={estilos.topo}>
        <Ilustracao nome="man_farmer" tamanho={96} />
        <T variante="rotulo" cor={tema.marca}>
          Grão Raiz
        </T>
        <T variante="titulo" style={estilos.centro}>
          {modo === 'entrar' ? 'Entre na sua conta' : modo === 'criar' ? 'Crie sua conta' : 'Crie uma senha nova'}
        </T>
        <T variante="pequeno" style={estilos.centro}>
          Seus talhões, chuvas e caderno ficam guardados na conta: troque de celular sem perder nada.
        </T>
      </View>

      <Linha style={estilos.modos}>
        <Chip rotulo="Entrar" ativo={modo === 'entrar'} aoTocar={() => mudarModo('entrar')} testID="modo-entrar" />
        <Chip rotulo="Criar conta" ativo={modo === 'criar'} aoTocar={() => mudarModo('criar')} testID="modo-criar" />
      </Linha>

      <Cartao>
        {modo === 'criar' ? (
          <Campo rotulo="Seu nome" value={nome} onChangeText={setNome} autoComplete="name" textContentType="name" maxLength={80} placeholder="Ex.: João da Silva" testID="campo-nome-conta" />
        ) : null}
        <Campo
          rotulo="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          maxLength={120}
          placeholder="voce@exemplo.com"
          testID="campo-email"
        />
        {modo === 'recuperar' && !codigoEnviado ? (
          <>
            <T variante="pequeno">Mandamos um código de 6 números para o e-mail da sua conta. Com ele você cria uma senha nova.</T>
            {erro ? <Aviso tipo="ruim">{erro}</Aviso> : null}
            <Botao titulo="Mandar código" icone="sino" aoTocar={mandarCodigo} carregando={ocupado === 'codigo'} desabilitado={ocupado !== null} testID="mandar-codigo" />
          </>
        ) : null}
        {modo === 'recuperar' && codigoEnviado ? (
          <>
            <Aviso tipo="bom">{codigoEnviado} Olhe também a caixa de spam.</Aviso>
            <Campo
              rotulo="Código do e-mail"
              value={codigo}
              onChangeText={setCodigo}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={6}
              placeholder="000000"
              testID="campo-codigo"
            />
          </>
        ) : null}
        {modo !== 'recuperar' || codigoEnviado ? (
          <>
            <Campo
              rotulo={modo === 'recuperar' ? 'Senha nova' : 'Senha'}
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              autoCapitalize="none"
              autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
              textContentType={modo === 'entrar' ? 'password' : 'newPassword'}
              maxLength={100}
              placeholder={modo === 'entrar' ? '' : 'Pelo menos 6 caracteres'}
              onSubmitEditing={enviar}
              testID="campo-senha"
            />
            {erro ? <Aviso tipo="ruim">{erro}</Aviso> : null}
            <Botao
              titulo={modo === 'entrar' ? 'Entrar' : modo === 'criar' ? 'Criar conta' : 'Salvar senha e entrar'}
              aoTocar={enviar}
              carregando={ocupado === 'conta'}
              desabilitado={ocupado !== null}
              testID="enviar-conta"
            />
          </>
        ) : null}
        {modo === 'entrar' ? <Botao titulo="Esqueci a senha" tipo="texto" aoTocar={() => mudarModo('recuperar')} testID="esqueci-senha" /> : null}
        {modo === 'recuperar' && codigoEnviado ? <Botao titulo="Mandar outro código" tipo="texto" aoTocar={mandarCodigo} desabilitado={ocupado !== null} /> : null}
      </Cartao>

      {LIBERA_PRO ? (
        <Cartao tom="destaque">
          <T variante="subtitulo">Só quer conhecer?</T>
          <T variante="pequeno">Entre na conta de demonstração: duas lavouras reais, de soja e de trigo, perto de Passo Fundo.</T>
          <Botao
            titulo="Entrar na demonstração"
            tipo="secundario"
            icone="folha"
            aoTocar={() => void executar('demo', entrarNaDemonstracao)}
            carregando={ocupado === 'demo'}
            desabilitado={ocupado !== null}
            testID="entrar-demo"
          />
        </Cartao>
      ) : null}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  topo: { alignItems: 'center', gap: 6, marginBottom: 8 },
  centro: { textAlign: 'center' },
  modos: { justifyContent: 'center' },
});
