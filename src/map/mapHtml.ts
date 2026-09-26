/**
 * Self-contained Leaflet page. Rendered in an <iframe> on web and a WebView on
 * iOS/Android. It only draws; all data fetching happens in React Native, which
 * talks to it through JSON messages (see MapCommand / MapEvent in ./protocol).
 */
export const MAP_HTML = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; background: #e9eef2; }
  .leaflet-control-layers { font: 12px/1.4 system-ui, sans-serif; }
  .huc-label { background: rgba(255,255,255,.92); border: 0; border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,.25); font: 600 11px system-ui, sans-serif; color: #1b3a4b; padding: 2px 6px; }
  .huc-label:before { display: none; }
  .fac-tip { font: 12px system-ui, sans-serif; }
</style>
</head><body>
<div id="map"></div>
<script>
(function () {
  var send = function (msg) {
    var s = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
    else window.parent.postMessage(s, '*');
  };

  var map = L.map('map', { zoomControl: true, preferCanvas: true, worldCopyJump: true })
    .setView([39.5, -97], 4);

  var usgs = 'https://basemap.nationalmap.gov/arcgis/rest/services/';
  // Keyless USGS The National Map basemaps.
  var tnm = function (name, maxZoom) {
    return L.tileLayer(usgs + name + '/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19, maxNativeZoom: maxZoom, attribution: 'USGS The National Map' });
  };
  var bases = {
    'USGS Topo': tnm('USGSTopo', 16),
    'USGS Imagery + labels': tnm('USGSImageryTopo', 16),
    'USGS Shaded relief': tnm('USGSShadedReliefOnly', 16)
  };
  bases['USGS Topo'].addTo(map);

  // Rivers & streams: USGS National Hydrography Dataset, pre-rendered tiles.
  var hydro = L.tileLayer(usgs + 'USGSHydroCached/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19, maxNativeZoom: 16, opacity: 0.9, attribution: 'USGS NHD' }).addTo(map);
  // Coastal / estuarine context: NOAA electronic nautical charts (Office of Coast Survey).
  var noaa = L.tileLayer.wms(
    'https://gis.charttools.noaa.gov/arcgis/rest/services/MCS/NOAAChartDisplay/MapServer/exts/MaritimeChartService/WMSServer', {
      layers: '0,1,2,3,4,5,6,7,8,9,10,11,12', format: 'image/png', transparent: true,
      version: '1.3.0', opacity: 0.75, attribution: 'NOAA Office of Coast Survey' });

  L.control.layers(bases, {
    'Rivers & streams (USGS NHD)': hydro,
    'Nautical charts (NOAA ENC)': noaa
  }, { position: 'topright', collapsed: true }).addTo(map);
  L.control.scale({ imperial: true, metric: true, position: 'bottomleft' }).addTo(map);

  var regionLayer = null, contextLayer = null, childLayer = null, facLayer = null, selRing = null;
  var facIndex = {};

  function hucStyle(selected) {
    return selected
      ? { color: '#0b7285', weight: 3, fillColor: '#15aabf', fillOpacity: 0.08 }
      : { color: '#1864ab', weight: 1.2, fillColor: '#4dabf7', fillOpacity: 0.06 };
  }

  function bindHuc(layer, feature, clickable) {
    var p = feature.properties;
    layer.bindTooltip(p.code + ' · ' + p.name, { sticky: true, className: 'huc-label' });
    if (!clickable) return;
    layer.on('mouseover', function () { layer.setStyle({ weight: 2.5, fillOpacity: 0.18 }); });
    layer.on('mouseout', function () { childLayer && childLayer.resetStyle(layer); });
    layer.on('click', function (e) {
      L.DomEvent.stop(e);
      send({ type: 'hucClick', code: p.code, level: p.level });
    });
  }

  map.on('click', function (e) {
    send({ type: 'mapClick', lat: e.latlng.lat, lng: e.latlng.lng });
  });

  var handlers = {
    setRegions: function (m) {
      if (regionLayer) map.removeLayer(regionLayer);
      regionLayer = L.geoJSON(m.geojson, {
        interactive: false,
        style: { color: '#6741d9', weight: 1.5, opacity: 0.7, fill: false }
      }).addTo(map);
      regionLayer.bringToBack();
    },

    // context: the selected parent watershed(s); children: clickable sub-units.
    setWatersheds: function (m) {
      if (contextLayer) map.removeLayer(contextLayer);
      if (childLayer) map.removeLayer(childLayer);
      contextLayer = childLayer = null;
      if (m.context && m.context.features.length) {
        contextLayer = L.geoJSON(m.context, {
          interactive: false,
          style: { color: '#0b7285', weight: 3, fill: false }
        }).addTo(map);
      }
      if (m.children && m.children.features.length) {
        childLayer = L.geoJSON(m.children, {
          style: function (f) { return hucStyle(f.properties.code === m.selected); },
          onEachFeature: function (f, layer) { bindHuc(layer, f, true); }
        }).addTo(map);
      }
      if (regionLayer) regionLayer.setStyle({ opacity: contextLayer ? 0.25 : 1 });
      if (facLayer) facLayer.bringToFront();
      var fitTo = contextLayer || childLayer;
      if (m.fit && fitTo) map.fitBounds(fitTo.getBounds(), { padding: [16, 16] });
    },

    highlightHuc: function (m) {
      if (!childLayer) return;
      childLayer.eachLayer(function (l) {
        l.setStyle(hucStyle(l.feature.properties.code === m.code));
        if (l.feature.properties.code === m.code && m.fit) map.fitBounds(l.getBounds(), { padding: [16, 16] });
      });
    },

    setFacilities: function (m) {
      if (facLayer) map.removeLayer(facLayer);
      if (selRing) { map.removeLayer(selRing); selRing = null; }
      facIndex = {};
      facLayer = L.featureGroup();
      // Draw least severe first so violations sit on top.
      m.items.forEach(function (f) {
        var c = L.circleMarker([f.lat, f.lng], {
          radius: f.r, color: '#fff', weight: 1, fillColor: f.color, fillOpacity: 0.9
        });
        c.bindTooltip('<b>' + f.name + '</b><br>' + f.id + ' · ' + f.status, { className: 'fac-tip', direction: 'top' });
        c.on('click', function (e) { L.DomEvent.stop(e); send({ type: 'facClick', id: f.id }); });
        c.addTo(facLayer);
        facIndex[f.id] = c;
      });
      facLayer.addTo(map);
    },

    selectFacility: function (m) {
      if (selRing) { map.removeLayer(selRing); selRing = null; }
      var c = facIndex[m.id];
      if (!c) return;
      selRing = L.circleMarker(c.getLatLng(), {
        radius: c.options.radius + 6, color: '#212529', weight: 2.5, fill: false, interactive: false
      }).addTo(map);
      if (m.pan) map.setView(c.getLatLng(), Math.max(map.getZoom(), 12));
    },

    fitUS: function () { map.setView([39.5, -97], 4); },

    invalidate: function () { map.invalidateSize(); }
  };

  function receive(raw) {
    var m;
    try { m = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return; }
    if (m && handlers[m.type]) handlers[m.type](m);
  }
  window.__recv = receive;
  window.addEventListener('message', function (e) { receive(e.data); });
  document.addEventListener('message', function (e) { receive(e.data); }); // Android WebView
  window.addEventListener('resize', function () { map.invalidateSize(); });

  send({ type: 'ready' });
})();
</script>
</body></html>`;
