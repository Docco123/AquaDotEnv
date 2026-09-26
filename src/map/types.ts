import type { UpstreamTrace } from '@/types';

/** [[south, west], [north, east]] in lat/lng order. */
export type LatLngBoundsTuple = [[number, number], [number, number]];

/** Imperative commands the map screen sends to the Leaflet map. */
export interface MapHandle {
  /** Drop (or move) the "you are here" pin. Pans to it when it is off-screen. */
  setPin(lat: number, lng: number): void;
  /** Draw a finished trace (basin, flowlines, facilities) and fit to it. Null removes it. */
  setTrace(trace: UpstreamTrace | null): void;
  /** Ring the selected facility; optionally pan to it. */
  selectFacility(id: string | null, pan?: boolean): void;
  /** Limit drawn facilities to these ids (null = all facilities of the trace). */
  filterFacilities(ids: string[] | null): void;
  /** Remove pin, trace and selection. */
  clear(): void;
  fitTo(bounds: LatLngBoundsTuple): void;
}

export interface LeafletMapProps {
  onMapClick?(lat: number, lng: number): void;
  onFacilityClick?(id: string): void;
}
