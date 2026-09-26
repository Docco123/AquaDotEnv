import type { LatLngBoundsExpression, LayerGroup } from 'leaflet';
import type { UpstreamFacility } from '@/types';
import { MAP_VIEW } from '../config';
import { traceBounds } from '../traceBounds';
import type { MapHandle } from '../types';
import { addBasemaps } from './basemaps';
import { createFacilityLayer } from './facilities';
import { drawNetwork } from './network';
import type { LeafletModule } from './load';
import { PANES, createPanes } from './panes';
import { createPinLayer } from './pin';
import { injectMapStyles } from './styles';

export interface SceneEvents {
  onMapClick(lat: number, lng: number): void;
  onFacilityClick(id: string): void;
}

export interface MapScene extends MapHandle {
  destroy(): void;
}

/** Creates the Leaflet map inside `el` and returns the commands that draw on it. */
export function createScene(L: LeafletModule, el: HTMLElement, events: SceneEvents): MapScene {
  injectMapStyles();
  const map = L.map(el, { preferCanvas: true, zoomControl: true, worldCopyJump: true });
  map.setView(MAP_VIEW.center, MAP_VIEW.zoom);
  createPanes(map);
  addBasemaps(L, map);

  const flowRenderer = L.svg({ pane: PANES.flow.name });
  const pin = createPinLayer(L, map);
  const facilities = createFacilityLayer(L, map, (id) => events.onFacilityClick(id));
  let network: LayerGroup | null = null;
  let traced: readonly UpstreamFacility[] = [];

  map.on('click', (e) => {
    const { lat, lng } = e.latlng.wrap();
    events.onMapClick(lat, lng);
  });

  const resize = new ResizeObserver(() => map.invalidateSize());
  resize.observe(el);

  const fitTo = (bounds: LatLngBoundsExpression) =>
    map.fitBounds(bounds, { padding: [MAP_VIEW.fitPadding, MAP_VIEW.fitPadding], maxZoom: MAP_VIEW.fitMaxZoom });

  const clearTrace = () => {
    network?.remove();
    network = null;
    traced = [];
    facilities.clear();
  };

  return {
    setPin: (lat, lng) => pin.set(lat, lng),
    setTrace(trace) {
      clearTrace();
      if (!trace) return;
      network = drawNetwork(L, trace, flowRenderer).addTo(map);
      traced = trace.facilities;
      facilities.set(traced);
      fitTo(traceBounds(trace));
    },
    selectFacility: (id, pan = false) => facilities.select(id, pan),
    filterFacilities(ids) {
      const keep = ids ? new Set(ids) : null;
      facilities.set(keep ? traced.filter((f) => keep.has(f.id)) : traced);
    },
    clear() {
      pin.clear();
      clearTrace();
    },
    fitTo,
    destroy() {
      resize.disconnect();
      map.remove();
    },
  };

}
