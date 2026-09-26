import type * as Leaflet from 'leaflet';

export type LeafletModule = typeof Leaflet;

let pending: Promise<LeafletModule> | null = null;

/**
 * Loads Leaflet on demand. Leaflet touches `window` at import time, so it must
 * never be imported at module top level (expo-router renders on the server).
 */
export function loadLeaflet(): Promise<LeafletModule> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Leaflet needs a browser.'));
  pending ??= import('leaflet').then((mod) => {
    const withDefault = mod as LeafletModule & { default?: LeafletModule };
    return withDefault.default ?? withDefault;
  });
  return pending;
}
