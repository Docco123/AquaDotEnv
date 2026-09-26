import type { FeatureCollection } from '../types';

export interface MapFacility {
  id: string;
  name: string;
  lat: number;
  lng: number;
  r: number;
  color: string;
  status: string;
}

export type MapCommand =
  | { type: 'setRegions'; geojson: FeatureCollection }
  | { type: 'setWatersheds'; context: FeatureCollection | null; children: FeatureCollection | null; selected: string | null; fit: boolean }
  | { type: 'highlightHuc'; code: string | null; fit: boolean }
  | { type: 'setFacilities'; items: MapFacility[] }
  | { type: 'selectFacility'; id: string | null; pan: boolean }
  | { type: 'fitUS' }
  | { type: 'invalidate' };

export type MapEvent =
  | { type: 'ready' }
  | { type: 'mapClick'; lat: number; lng: number }
  | { type: 'hucClick'; code: string; level: number }
  | { type: 'facClick'; id: string };

export interface MapHandle {
  send(cmd: MapCommand): void;
}

export interface MapProps {
  onEvent(e: MapEvent): void;
}
