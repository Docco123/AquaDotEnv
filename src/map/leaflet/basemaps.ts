import type { Map as LeafletMapInstance, TileLayer } from 'leaflet';
import { BASEMAPS, HYDRO_OVERLAY, TILE_OPTIONS } from '../config';
import type { LeafletModule } from './load';

/** USGS basemaps (topo by default), the NHD hydro overlay, a layer switcher and a scale bar. */
export function addBasemaps(L: LeafletModule, map: LeafletMapInstance): void {
  const bases: Record<string, TileLayer> = {};
  for (const b of BASEMAPS) bases[b.name] = L.tileLayer(b.url, { ...TILE_OPTIONS });
  bases[BASEMAPS[0].name].addTo(map);

  const hydro = L.tileLayer(HYDRO_OVERLAY.url, {
    ...TILE_OPTIONS,
    opacity: HYDRO_OVERLAY.opacity,
    attribution: 'USGS NHD',
  }).addTo(map);

  L.control.layers(bases, { [HYDRO_OVERLAY.name]: hydro }, { position: 'topright', collapsed: true }).addTo(map);
  L.control.scale({ position: 'bottomleft', imperial: true, metric: true }).addTo(map);
}
