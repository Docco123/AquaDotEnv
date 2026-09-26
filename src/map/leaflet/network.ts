import type { GeoJsonObject } from 'geojson';
import type { LatLngTuple, LayerGroup, Renderer } from 'leaflet';
import { alpha } from '@/components/ui/color';
import { C } from '@/theme';
import type { Flowline, UpstreamTrace } from '@/types';
import type { LeafletModule } from './load';
import { PANES } from './panes';

const BASIN_STYLE = {
  color: C.primary,
  weight: 1.5,
  opacity: 0.55,
  dashArray: '6 6',
  fillColor: C.primary,
  fillOpacity: 0.06,
};

const TRIBUTARY_STYLE = { color: C.primary, weight: 1.4, opacity: 0.6 };
const MAINSTEM_STYLE = { color: C.secondary, weight: 4.5, opacity: 0.95, lineCap: 'round' as const };
/** Light dashes on top of the mainstem, animated toward the pin via the `uw-flow` CSS class. */
const FLOW_STYLE = { color: alpha(C.surface, 0.9), weight: 2, lineCap: 'round' as const, className: 'uw-flow' };

/** NHDPlus coords are [lng, lat] and digitized upstream → downstream, so dashes flow toward the pin. */
const toLatLngs = (f: Flowline): LatLngTuple[] => f.coords.map(([lng, lat]) => [lat, lng]);

/**
 * The traced river network: basin outline, thin tributaries, a thick mainstem
 * and an animated flow overlay (SVG renderer, so the CSS animation applies).
 */
export function drawNetwork(L: LeafletModule, trace: UpstreamTrace, flowRenderer: Renderer): LayerGroup {
  const group = L.layerGroup();
  const pane = PANES.network.name;

  if (trace.basin) {
    L.geoJSON(trace.basin as unknown as GeoJsonObject, { pane, interactive: false, style: BASIN_STYLE }).addTo(group);
  }

  const tributaries = trace.flowlines.filter((f) => !f.mainstem).map(toLatLngs);
  const mainstem = trace.flowlines.filter((f) => f.mainstem).map(toLatLngs);

  if (tributaries.length) L.polyline(tributaries, { pane, interactive: false, ...TRIBUTARY_STYLE }).addTo(group);
  if (mainstem.length) {
    L.polyline(mainstem, { pane, interactive: false, ...MAINSTEM_STYLE }).addTo(group);
    L.polyline(mainstem, { renderer: flowRenderer, interactive: false, ...FLOW_STYLE }).addTo(group);
  }
  return group;
}
