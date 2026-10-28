/**
 * Página HTML do mapa: MapLibre GL JS com imagem de satélite (Esri World Imagery) por baixo dos
 * nomes de lugares e estradas do estilo "liberty" do OpenFreeMap (dados do OpenStreetMap).
 * Roda dentro de um WebView (ou iframe na web) e conversa com o app por mensagens:
 * - do mapa: { carregado }, { lat, lon } ao marcar o ponto, { contorno: [[lat, lon]…] } ao desenhar,
 *   { semMapa } se a biblioteca não carregar, { erroMapa } se o estilo falhar;
 * - para o mapa: window.comando({ mover | modo | contorno | camada | realces | desfazer | limpar | enquadrar }).
 */
export const MAPLIBRE_URL = 'https://unpkg.com/maplibre-gl@4.7.1/dist';
export const ESTILO_MAPA = 'https://tiles.openfreemap.org/styles/liberty';
/** Imagem de satélite de alta resolução. Uso comercial nas lojas pede conta ArcGIS Location Platform (chave). */
export const IMAGEM_SATELITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ATRIBUICAO_IMAGEM = 'Imagens: Esri, Maxar, Earthstar Geographics';
/** Créditos do mapa, mostrados pelo app embaixo do mapa (o quadro do MapLibre cobria a imagem). */
export const ATRIBUICAO_MAPA = `${ATRIBUICAO_IMAGEM} · Nomes: OpenFreeMap, © OpenMapTiles, © OpenStreetMap`;

export interface PontoMapa {
  lat: number;
  lon: number;
}

export type ModoMapa = 'ponto' | 'contorno' | 'ver';

/** Área desenhada por cima do mapa: desmatamento (vermelho) ou limite do imóvel no CAR (tracejado). */
export interface Realce {
  tipo: 'desmatamento' | 'imovel';
  /** Pontos [lat, lon]. */
  anel: [number, number][];
}

export interface OpcoesMapa {
  modo?: ModoMapa;
  contorno?: [number, number][] | null;
  /** Modelo de URL de blocos {z}/{x}/{y} sobre o mapa (imagem de satélite). */
  camada?: string | null;
  realces?: Realce[] | null;
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
    realces: opcoes.realces ?? null,
    telaCheia: opcoes.telaCheia ?? false,
  });
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link href="${MAPLIBRE_URL}/maplibre-gl.css" rel="stylesheet">
<style>html,body,#mapa{margin:0;padding:0;height:100%;width:100%;background:#E9ECE4}
.vertice{width:14px;height:14px;border-radius:7px;background:#fff;border:3px solid #17663A;box-sizing:border-box}
#dica{position:absolute;top:10px;left:10px;right:52px;z-index:5;width:fit-content;padding:8px 14px;border-radius:18px;background:rgba(12,32,18,.86);color:#fff;font:600 14px/1.3 system-ui,-apple-system,sans-serif;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.35)}
#dica:empty{display:none}</style>
</head><body><div id="mapa"></div><div id="dica"></div>
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
    cooperativeGestures: !c.telaCheia, attributionControl: false, // créditos embaixo do mapa, no app (ATRIBUICAO_MAPA)
    locale: {
      'CooperativeGesturesHandler.MobileHelpText': 'Use dois dedos para mover o mapa',
      'CooperativeGesturesHandler.WindowsHelpText': 'Use Ctrl + roda do mouse (ou os botões + e −) para aproximar',
      'CooperativeGesturesHandler.MacHelpText': 'Use ⌘ + roda do mouse (ou os botões + e −) para aproximar',
      'NavigationControl.ZoomIn': 'Aproximar', 'NavigationControl.ZoomOut': 'Afastar'
    }
  });
  mapa.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  window.__mapa = mapa; // diagnóstico e testes
  var marcador = null;
  // Instrução sobre o mapa: muda conforme o modo, o zoom e se já há pino.
  function dica() {
    var texto = '';
    if (modo === 'contorno') texto = '👆 Toque nos cantos da lavoura, um por um';
    else if (modo === 'ponto') texto = marcador ? '✅ Talhão marcado. Toque em outro lugar ou arraste o pino para mudar'
      : mapa.getZoom() < 12 ? '🔍 Aproxime o mapa até ver a sua lavoura' : '👆 Toque na sua lavoura para marcar o talhão';
    document.getElementById('dica').textContent = texto;
  }
  function marcar(lon, lat, avisar) {
    if (!marcador) {
      marcador = new maplibregl.Marker({ color: '#17663A', draggable: modo === 'ponto' }).setLngLat([lon, lat]).addTo(mapa);
      marcador.on('dragend', function () { var p = marcador.getLngLat(); enviar({ lat: p.lat, lon: p.lng }); });
    } else { marcador.setLngLat([lon, lat]); }
    dica();
    if (avisar) enviar({ lat: lat, lon: lon });
  }
  // Satélite por baixo dos nomes de lugares e estradas (em branco, legíveis sobre a foto). Ícones de
  // comércio e o desenho do mapa que viria por cima da foto (prédios 3D, divisas) saem.
  function imagemDeSatelite() {
    var primeiroRotulo;
    mapa.getStyle().layers.forEach(function (l) {
      if (l.type === 'symbol' && !primeiroRotulo) primeiroRotulo = l.id;
      if ((l.type === 'symbol' && l['source-layer'] === 'poi') || (primeiroRotulo && l.type !== 'symbol') || l.type === 'fill-extrusion') {
        mapa.setLayoutProperty(l.id, 'visibility', 'none');
      } else if (l.type === 'symbol') {
        mapa.setPaintProperty(l.id, 'text-color', '#FFFFFF');
        mapa.setPaintProperty(l.id, 'text-halo-color', 'rgba(0,0,0,0.75)');
        mapa.setPaintProperty(l.id, 'text-halo-width', 1.4);
      }
    });
    mapa.addSource('imagem', { type: 'raster', tiles: ['${IMAGEM_SATELITE}'], tileSize: 256, maxzoom: 19, attribution: '${ATRIBUICAO_IMAGEM}' });
    mapa.addLayer({ id: 'imagem', type: 'raster', source: 'imagem' }, primeiroRotulo);
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
  function realcesGeojson() {
    return { type: 'FeatureCollection', features: (c.realces || []).filter(function (r) { return r.anel.length >= 3; }).map(function (r) {
      var anel = r.anel.map(function (p) { return [p[1], p[0]]; });
      anel.push(anel[0]);
      return { type: 'Feature', properties: { tipo: r.tipo }, geometry: { type: 'Polygon', coordinates: [anel] } };
    }) };
  }
  function realces(lista) {
    c.realces = lista;
    var fonte = pronto && mapa.getSource('realces');
    if (fonte) fonte.setData(realcesGeojson());
  }
  function enquadrar() {
    var b = new maplibregl.LngLatBounds();
    var pontos = contorno.slice();
    (c.realces || []).forEach(function (r) { if (r.tipo === 'imovel') pontos = pontos.concat(r.anel); });
    if (pontos.length < 2) return;
    pontos.forEach(function (p) { b.extend([p[1], p[0]]); });
    mapa.fitBounds(b, { padding: 48, duration: 0, maxZoom: 16 });
  }
  mapa.on('click', function (e) {
    if (modo === 'ponto') marcar(e.lngLat.lng, e.lngLat.lat, true);
    else if (modo === 'contorno') { contorno.push([e.lngLat.lat, e.lngLat.lng]); desenhar(); enviar({ contorno: contorno }); }
  });
  mapa.once('style.load', imagemDeSatelite); // antes da primeira pintura: o mapa de ruas nem chega a aparecer
  mapa.on('load', function () {
    mapa.addSource('contorno', { type: 'geojson', data: geojson() });
    mapa.addLayer({ id: 'contorno-area', type: 'fill', source: 'contorno', paint: { 'fill-color': '#17663A', 'fill-opacity': 0.12 }, filter: ['==', '$type', 'Polygon'] });
    mapa.addLayer({ id: 'contorno-linha', type: 'line', source: 'contorno', paint: { 'line-color': '#FFFFFF', 'line-width': 3 } });
    mapa.addSource('realces', { type: 'geojson', data: realcesGeojson() });
    mapa.addLayer({ id: 'realce-imovel', type: 'line', source: 'realces', filter: ['==', ['get', 'tipo'], 'imovel'], paint: { 'line-color': '#F4C542', 'line-width': 2.5, 'line-dasharray': [2, 1.5] } }, 'contorno-area');
    mapa.addLayer({ id: 'realce-desmatamento', type: 'fill', source: 'realces', filter: ['==', ['get', 'tipo'], 'desmatamento'], paint: { 'fill-color': '#E5372B', 'fill-opacity': 0.55, 'fill-outline-color': '#FFB4AB' } }, 'contorno-area');
    pronto = true;
    desenhar();
    if (c.camada) camada(c.camada);
    if (contorno.length >= 2 || c.realces) enquadrar();
    enviar({ carregado: true });
  });
  // Só o estilo que não carrega derruba o mapa; um bloco de imagem que falha (sinal fraco) não.
  mapa.on('error', function (e) { if (!pronto && !e.sourceId && !e.tile) enviar({ erroMapa: true }); });
  mapa.on('zoomend', dica);
  if (c.marcado && modo !== 'ver') marcar(c.lon, c.lat, false);
  dica();
  window.moverPara = function (lat, lon) { marcar(lon, lat, false); mapa.flyTo({ center: [lon, lat], zoom: 15 }); };
  window.comando = function (cmd) {
    if (cmd.mover) window.moverPara(cmd.mover.lat, cmd.mover.lon);
    if (cmd.modo) { modo = cmd.modo; if (marcador) marcador.setDraggable(modo === 'ponto'); desenhar(); dica(); }
    if (cmd.contorno !== undefined) { contorno = (cmd.contorno || []).slice(); desenhar(); }
    if (cmd.camada !== undefined) camada(cmd.camada);
    if (cmd.realces !== undefined) realces(cmd.realces);
    if (cmd.desfazer) { contorno.pop(); desenhar(); enviar({ contorno: contorno }); }
    if (cmd.limpar) { contorno = []; desenhar(); enviar({ contorno: contorno }); }
    if (cmd.enquadrar) enquadrar();
  };
})();
</script></body></html>`;
}
