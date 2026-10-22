/**
 * Temperatura de bulbo úmido pela fórmula empírica de Stull (2011),
 * válida para umidade de 5% a 99% e temperatura de −20 °C a 50 °C (erro típico < 0,3 °C).
 * Fora dessa faixa de umidade o valor é limitado às bordas, o que mantém o delta T coerente.
 */
export function temperaturaBulboUmido(temperatura: number, umidade: number): number {
  const ur = Math.min(Math.max(umidade, 5), 99);
  const t = temperatura;
  return (
    t * Math.atan(0.151977 * Math.sqrt(ur + 8.313659)) +
    Math.atan(t + ur) -
    Math.atan(ur - 1.676331) +
    0.00391838 * Math.pow(ur, 1.5) * Math.atan(0.023101 * ur) -
    4.686035
  );
}

/**
 * Delta T = temperatura do ar − temperatura de bulbo úmido.
 * Indica a velocidade de evaporação das gotas: abaixo de 2 °C o ar está quase saturado,
 * acima de 8–10 °C as gotas evaporam antes de chegar ao alvo.
 */
export function deltaT(temperatura: number, umidade: number): number {
  return temperatura - temperaturaBulboUmido(temperatura, umidade);
}
