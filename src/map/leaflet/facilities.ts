import type { CircleMarker, FeatureGroup, LayerGroup, Map as LeafletMapInstance } from 'leaflet';
import { C, RISK, markerRadius } from '@/theme';
import type { UpstreamFacility } from '@/types';
import { MAP_VIEW } from '../config';
import { isBackgroundPermit } from '../facilityFilters';
import type { LeafletModule } from './load';
import { facilityTooltip } from './tooltip';

export interface FacilityLayer {
  /** Replace the drawn facilities (keeps the current selection if still present). */
  set(list: readonly UpstreamFacility[]): void;
  select(id: string | null, pan: boolean): void;
  clear(): void;
}

const BASE = { color: C.surface, weight: 1.2, fillOpacity: 0.92 };
/** Inactive or unmonitored permits: smaller and paler so they recede. */
const BACKGROUND = { color: C.surface, weight: 0.8, fillOpacity: 0.4 };
const BACKGROUND_RADIUS_SCALE = 0.7;
const HOVER = { color: C.text, weight: 2.5 };
const SELECTED_RING = { color: C.text, weight: 2.5, fill: false, interactive: false };
/** Where distance is measured from when the outfall is not at the plant: hollow dot + dashed tie line. */
const OUTFALL_DOT = { radius: 5, color: C.text, weight: 2, fillColor: C.surface, fillOpacity: 1, interactive: false };
const OUTFALL_TIE = { color: C.text, weight: 1.2, opacity: 0.7, dashArray: '4 4', interactive: false };

/** Background permits first, then low → high risk so high-risk markers are drawn on top. */
const drawOrder = (list: readonly UpstreamFacility[]) =>
  [...list].sort(
    (a, b) =>
      Number(isBackgroundPermit(b)) - Number(isBackgroundPermit(a)) || RISK[b.risk.level].rank - RISK[a.risk.level].rank,
  );

export function createFacilityLayer(
  L: LeafletModule,
  map: LeafletMapInstance,
  onClick: (id: string) => void,
): FacilityLayer {
  let group: FeatureGroup | null = null;
  let ring: LayerGroup | null = null;
  let selectedId: string | null = null;
  const markers = new Map<string, CircleMarker>();
  const byId = new Map<string, UpstreamFacility>();

  function makeMarker(f: UpstreamFacility): CircleMarker {
    const background = isBackgroundPermit(f);
    const rest = background ? BACKGROUND : BASE;
    const radius = markerRadius(f) * (background ? BACKGROUND_RADIUS_SCALE : 1);
    // bubblingMouseEvents: false keeps a marker click from also firing the map click (new pin).
    const marker = L.circleMarker([f.lat, f.lng], {
      ...rest,
      radius,
      fillColor: RISK[f.risk.level].color,
      bubblingMouseEvents: false,
    });
    marker.bindTooltip(facilityTooltip(f), { className: 'uw-tip', direction: 'top', offset: [0, -radius], opacity: 1 });
    marker.on('click', () => onClick(f.id));
    marker.on('mouseover', () => marker.setStyle(HOVER));
    marker.on('mouseout', () => marker.setStyle(rest));
    return marker;
  }

  function drawRing(pan: boolean) {
    ring?.remove();
    ring = null;
    const marker = selectedId ? markers.get(selectedId) : undefined;
    if (!marker) return;
    marker.bringToFront();
    ring = L.layerGroup().addTo(map);
    const outfall = selectedId ? byId.get(selectedId)?.outfallPoint : undefined;
    if (outfall) {
      const [lng, lat] = outfall;
      L.polyline([marker.getLatLng(), [lat, lng]], OUTFALL_TIE).addTo(ring);
      L.circleMarker([lat, lng], OUTFALL_DOT).addTo(ring);
    }
    L.circleMarker(marker.getLatLng(), { ...SELECTED_RING, radius: marker.getRadius() + 5 }).addTo(ring);
    if (pan) map.setView(marker.getLatLng(), Math.max(map.getZoom(), MAP_VIEW.selectZoom), { animate: true });
  }

  function removeMarkers() {
    group?.remove();
    group = null;
    markers.clear();
    byId.clear();
  }

  return {
    set(list) {
      removeMarkers();
      group = L.featureGroup();
      for (const f of drawOrder(list)) {
        const marker = makeMarker(f);
        marker.addTo(group);
        markers.set(f.id, marker);
        byId.set(f.id, f);
      }
      group.addTo(map);
      drawRing(false);
    },
    select(id, pan) {
      selectedId = id;
      drawRing(pan);
    },
    clear() {
      removeMarkers();
      selectedId = null;
      drawRing(false);
    },
  };
}
