/**
 * Página HTML do mapa open-source: MapLibre GL JS com o estilo "liberty" do OpenFreeMap
 * (dados do OpenStreetMap). Sem chave, uso comercial permitido. Roda dentro de um WebView
 * (ou iframe na web) e conversa com o app por mensagens:
 * - do mapa: { carregado }, { lat, lon } ao marcar o ponto, { contorno: [[lat, lon]…] } ao desenhar,
 *   { semMapa } se a biblioteca não carregar, { erroMapa } se o estilo falhar;
 * - para o mapa: window.comando({ mover | modo | contorno | camada | desfazer | limpar | enquadrar }).
 */
export const MAPLIBRE_URL = 'https://unpkg.com/maplibre-gl@4.7.1/dist';
export const ESTILO_MAPA = 'https://tiles.openfreemap.org/styles/liberty';

export interface PontoMapa {
  lat: number;
  lon: number;
}

export type ModoMapa = 'ponto' | 'contorno' | 'ver';

export interface OpcoesMapa {
  modo?: ModoMapa;
  contorno?: [number, number][] | null;
  /** Modelo de URL de blocos {z}/{x}/{y} sobre o mapa (imagem de satélite). */
  camada?: string | null;
  /** Mapa só para ver: sem gesto cooperativo (a tela inteira é o mapa). */
  telaCheia?: boolean;
}

export function paginaDoMapa(inicial: PontoMapa | null, opcoes: OpcoesMapa = {}): string {
  const config = JSON.stringify({
    lat: inicial?.lat ?? -15.8,
    lon: inicial?.lon ?? -50.5,
    zoom: inicial ? 15 : 3.5,
    marcado: inicial !== null,
    modo: opcoes.modo ?? 'ponto',
    contorno: opcoes.contorno ?? null,
    camada: opcoes.camada ?? null,
    telaCheia: opcoes.telaCheia ?? false,
  });
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link href="${MAPLIBRE_URL}/maplibre-gl.css" rel="stylesheet">
<style>html,body,#mapa{margin:0;padding:0;height:100%;width:100%;background:#E9ECE4}
.vertice{width:14px;height:14px;border-radius:7px;background:#fff;border:3px solid #17663A;box-sizing:border-box}</style>
</head><body><div id="mapa"></div>
<script src="${MAPLIBRE_URL}/maplibre-gl.js"></script>
<script>
(function () {
  function enviar(dados) { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(dados)); }
  if (typeof maplibregl === 'undefined') { enviar({ semMapa: true }); return; }
  var c = ${config};
  var modo = c.modo;
  var contorno = c.contorno ? c.contorno.slice() : [];
  var vertices = [];
  var pronto = false;
  var mapa = new maplibregl.Map({
    container: 'mapa', style: '${ESTILO_MAPA}', center: [c.lon, c.lat], zoom: c.zoom,
    cooperativeGestures: !c.telaCheia, attributionControl: { compact: true },
    locale: { 'CooperativeGesturesHandler.MobileHelpText': 'Use dois dedos para mover o mapa' }
  });
  window.__mapa = mapa; // diagnóstico e testes
  var marcador = null;
  function marcar(lon, lat, avisar) {
    if (!marcador) {
      marcador = new maplibregl.Marker({ color: '#17663A', draggable: modo === 'ponto' }).setLngLat([lon, lat]).addTo(mapa);
      marcador.on('dragend', function () { var p = marcador.getLngLat(); enviar({ lat: p.lat, lon: p.lng }); });
    } else { marcador.setLngLat([lon, lat]); }
    if (avisar) enviar({ lat: lat, lon: lon });
  }
  function geojson() {
    var anel = contorno.map(function (p) { return [p[1], p[0]]; });
    if (anel.length >= 3) anel.push(anel[0]);
    return { type: 'FeatureCollection', features: anel.length >= 4
      ? [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [anel] } }]
      : anel.length >= 2 ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: anel } }] : [] };
  }
  function desenhar() {
    if (!pronto) return;
    var fonte = mapa.getSource('contorno');
    if (fonte) fonte.setData(geojson());
    vertices.forEach(function (v) { v.remove(); });
    vertices = [];
    if (modo === 'contorno') contorno.forEach(function (p) {
      var el = document.createElement('div'); el.className = 'vertice';
      vertices.push(new maplibregl.Marker({ element: el }).setLngLat([p[1], p[0]]).addTo(mapa));
    });
  }
  function camada(url) {
    if (!pronto) { c.camada = url; return; }
    if (mapa.getLayer('satelite')) mapa.removeLayer('satelite');
    if (mapa.getSource('satelite')) mapa.removeSource('satelite');
    if (!url) return;
    // Até o nível 14 (≈10 m por pixel, a resolução do satélite); acima disso o mapa amplia suavizando.
    mapa.addSource('satelite', { type: 'raster', tiles: [url], tileSize: 512, maxzoom: 14, attribution: 'Copernicus Sentinel-2 / Microsoft Planetary Computer' });
    mapa.addLayer({ id: 'satelite', type: 'raster', source: 'satelite', paint: { 'raster-opacity': 1, 'raster-resampling': 'linear' } }, 'contorno-area');
  }
  function enquadrar() {
    if (contorno.length < 2) return;
    var b = new maplibregl.LngLatBounds();
    contorno.forEach(function (p) { b.extend([p[1], p[0]]); });
    mapa.fitBounds(b, { padding: 48, duration: 0, maxZoom: 16 });
  }
  mapa.on('click', function (e) {
    if (modo === 'ponto') marcar(e.lngLat.lng, e.lngLat.lat, true);
    else if (modo === 'contorno') { contorno.push([e.lngLat.lat, e.lngLat.lng]); desenhar(); enviar({ contorno: contorno }); }
  });
  mapa.on('load', function () {
    mapa.addSource('contorno', { type: 'geojson', data: geojson() });
    mapa.addLayer({ id: 'contorno-area', type: 'fill', source: 'contorno', paint: { 'fill-color': '#17663A', 'fill-opacity': 0.12 }, filter: ['==', '$type', 'Polygon'] });
    mapa.addLayer({ id: 'contorno-linha', type: 'line', source: 'contorno', paint: { 'line-color': '#FFFFFF', 'line-width': 3 } });
    pronto = true;
    desenhar();
    if (c.camada) camada(c.camada);
    if (contorno.length >= 2) enquadrar();
    enviar({ carregado: true });
  });
  mapa.on('error', function () { enviar({ erroMapa: true }); });
  if (c.marcado && modo !== 'ver') marcar(c.lon, c.lat, false);
  window.moverPara = function (lat, lon) { marcar(lon, lat, false); mapa.flyTo({ center: [lon, lat], zoom: 15 }); };
  window.comando = function (cmd) {
    if (cmd.mover) window.moverPara(cmd.mover.lat, cmd.mover.lon);
    if (cmd.modo) { modo = cmd.modo; if (marcador) marcador.setDraggable(modo === 'ponto'); desenhar(); }
    if (cmd.contorno !== undefined) { contorno = (cmd.contorno || []).slice(); desenhar(); }
    if (cmd.camada !== undefined) camada(cmd.camada);
    if (cmd.desfazer) { contorno.pop(); desenhar(); enviar({ contorno: contorno }); }
    if (cmd.limpar) { contorno = []; desenhar(); enviar({ contorno: contorno }); }
    if (cmd.enquadrar) enquadrar();
  };
})();
</script></body></html>`;
}
