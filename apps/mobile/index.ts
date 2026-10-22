// Ponto de entrada do app. A tarefa em segundo plano é definida aqui, antes do roteador:
// quando o sistema acorda o app sem interface, nenhuma tela (nem o _layout) é carregada.
import './src/lib/tarefa-fundo';
import 'expo-router/entry';
