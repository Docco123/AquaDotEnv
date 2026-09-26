import type { Map as LeafletMapInstance, Marker } from 'leaflet';
import { MAP_VIEW } from '../config';
import type { LeafletModule } from './load';

const PIN_SIZE = 40;
const PIN_HTML = '<span class="uw-pin-ring"></span><span class="uw-pin-dot"></span>';

export interface PinLayer {
  set(lat: number, lng: number): void;
  clear(): void;
}

/** The "you are here" pin: a divIcon with a pulsing ring (CSS in ./styles). */
export function createPinLayer(L: LeafletModule, map: LeafletMapInstance): PinLayer {
  let marker: Marker | null = null;
  const icon = L.divIcon({
    className: 'uw-pin',
    html: PIN_HTML,
    iconSize: [PIN_SIZE, PIN_SIZE],
    iconAnchor: [PIN_SIZE / 2, PIN_SIZE / 2],
  });

  /** Fly to the pin when it is off-screen or the map is zoomed too far out to see a river. */
  function reveal(lat: number, lng: number) {
    const latlng = L.latLng(lat, lng);
    if (map.getZoom() >= MAP_VIEW.minPinZoom && map.getBounds().contains(latlng)) return;
    map.flyTo(latlng, Math.max(map.getZoom(), MAP_VIEW.pinZoom), { duration: 0.8 });
  }

  return {
    set(lat, lng) {
      marker?.remove();
      marker = L.marker([lat, lng], { icon, interactive: false, keyboard: false, zIndexOffset: 1000 }).addTo(map);
      reveal(lat, lng);
    },
    clear() {
      marker?.remove();
      marker = null;
    },
  };
}
