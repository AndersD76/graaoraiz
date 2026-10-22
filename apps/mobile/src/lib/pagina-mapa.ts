/**
 * Página HTML do mapa open-source: MapLibre GL JS com o estilo "liberty" do OpenFreeMap
 * (dados do OpenStreetMap). Sem chave, uso comercial permitido. Roda dentro de um WebView;
 * conversa com o app por postMessage: { lat, lon } ao marcar, { semMapa } se a biblioteca não carregar.
 */
export const MAPLIBRE_URL = 'https://unpkg.com/maplibre-gl@4.7.1/dist';
export const ESTILO_MAPA = 'https://tiles.openfreemap.org/styles/liberty';

export interface PontoMapa {
  lat: number;
  lon: number;
}

export function paginaDoMapa(inicial: PontoMapa | null): string {
  const config = JSON.stringify({
    lat: inicial?.lat ?? -15.8,
    lon: inicial?.lon ?? -50.5,
    zoom: inicial ? 15 : 3.5,
    marcado: inicial !== null,
  });
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link href="${MAPLIBRE_URL}/maplibre-gl.css" rel="stylesheet">
<style>html,body,#mapa{margin:0;padding:0;height:100%;width:100%;background:#F0F2EF}</style>
</head><body><div id="mapa"></div>
<script src="${MAPLIBRE_URL}/maplibre-gl.js"></script>
<script>
(function () {
  function enviar(dados) { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(dados)); }
  if (typeof maplibregl === 'undefined') { enviar({ semMapa: true }); return; }
  var c = ${config};
  var mapa = new maplibregl.Map({
    container: 'mapa', style: '${ESTILO_MAPA}', center: [c.lon, c.lat], zoom: c.zoom,
    cooperativeGestures: true, attributionControl: { compact: true },
    locale: { 'CooperativeGesturesHandler.MobileHelpText': 'Use dois dedos para mover o mapa' }
  });
  var marcador = null;
  function marcar(lon, lat, avisar) {
    if (!marcador) {
      marcador = new maplibregl.Marker({ color: '#1F6B2E', draggable: true }).setLngLat([lon, lat]).addTo(mapa);
      marcador.on('dragend', function () { var p = marcador.getLngLat(); enviar({ lat: p.lat, lon: p.lng }); });
    } else { marcador.setLngLat([lon, lat]); }
    if (avisar) enviar({ lat: lat, lon: lon });
  }
  mapa.on('click', function (e) { marcar(e.lngLat.lng, e.lngLat.lat, true); });
  mapa.on('load', function () { enviar({ carregado: true }); });
  mapa.on('error', function () { enviar({ erroMapa: true }); });
  if (c.marcado) marcar(c.lon, c.lat, false);
  window.moverPara = function (lat, lon) { marcar(lon, lat, false); mapa.flyTo({ center: [lon, lat], zoom: 15 }); };
})();
</script></body></html>`;
}
