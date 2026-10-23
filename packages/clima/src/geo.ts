/** Geometria simples de talhão: pontos [lat, lon] em graus. */

const RAIO_TERRA_M = 6_371_008.8;

/** Área de um polígono (fechado ou não) em hectares, por projeção local equiretangular (erro desprezível em talhões). */
export function areaHa(contorno: [number, number][]): number {
  if (contorno.length < 3) return 0;
  const lat0 = (contorno.reduce((s, [lat]) => s + lat, 0) / contorno.length) * (Math.PI / 180);
  const pontos = contorno.map(([lat, lon]): [number, number] => [
    RAIO_TERRA_M * (lon * Math.PI) / 180 * Math.cos(lat0),
    RAIO_TERRA_M * (lat * Math.PI) / 180,
  ]);
  let soma = 0;
  for (let i = 0; i < pontos.length; i++) {
    const [x1, y1] = pontos[i]!;
    const [x2, y2] = pontos[(i + 1) % pontos.length]!;
    soma += x1 * y2 - x2 * y1;
  }
  return Math.abs(soma) / 2 / 10_000;
}

/** Centro (média dos vértices) do contorno. */
export function centro(contorno: [number, number][]): { lat: number; lon: number } {
  const n = contorno.length || 1;
  return { lat: contorno.reduce((s, [lat]) => s + lat, 0) / n, lon: contorno.reduce((s, [, lon]) => s + lon, 0) / n };
}

/** Quadrado em volta de um ponto com a área pedida (talhão sem contorno desenhado). */
export function quadradoEmVolta(lat: number, lon: number, hectares: number): [number, number][] {
  const lado = Math.sqrt(Math.max(hectares, 1) * 10_000);
  const dLat = (lado / 2 / RAIO_TERRA_M) * (180 / Math.PI);
  const dLon = dLat / Math.cos((lat * Math.PI) / 180);
  return [
    [lat - dLat, lon - dLon],
    [lat - dLat, lon + dLon],
    [lat + dLat, lon + dLon],
    [lat + dLat, lon - dLon],
  ];
}
