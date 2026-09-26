import type { Map as LeafletMapInstance } from 'leaflet';

/**
 * Custom panes keep the draw order right regardless of renderer:
 * tiles (200) < network canvas < animated SVG flow < facilities in overlayPane (400) < pin (600).
 */
export const PANES = {
  network: { name: 'uw-network', zIndex: 360 },
  flow: { name: 'uw-flow', zIndex: 370 },
} as const;

export function createPanes(map: LeafletMapInstance): void {
  for (const pane of Object.values(PANES)) {
    const el = map.createPane(pane.name);
    el.style.zIndex = String(pane.zIndex);
  }
}
