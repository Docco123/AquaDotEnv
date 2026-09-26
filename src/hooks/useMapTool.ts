import { useEffect, useState, type RefObject } from 'react';
import { DEFAULT_DISTANCE_KM } from '@/map/config';
import type { MapHandle } from '@/map/types';
import { useFacilityFilters } from './useFacilityFilters';
import { useTrace } from './useTrace';

/**
 * Screen controller: pin → trace → results, facility selection, distance and
 * list filters, and keeping the Leaflet map in sync with all of it.
 */
export function useMapTool(map: RefObject<MapHandle | null>) {
  const { state, start, cancel, retry } = useTrace();
  const [distanceKm, setDistanceKm] = useState<number>(DEFAULT_DISTANCE_KM);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const trace = state.status === 'ready' ? state.trace : null;
  const pin = state.status === 'idle' ? null : state.request;
  const filters = useFacilityFilters(trace?.facilities ?? null);

  // Plain functions (not useCallback): `map` is a ref, which the React Compiler memoizes around.
  const dropPin = (lat: number, lng: number, km: number = distanceKm) => {
    setSelectedId(null);
    map.current?.clear();
    map.current?.setPin(lat, lng);
    start({ lat, lng, distanceKm: km });
  };

  const changeDistance = (km: number) => {
    setDistanceKm(km);
    if (pin) dropPin(pin.lat, pin.lng, km);
  };

  const clearPin = () => {
    cancel();
    setSelectedId(null);
    map.current?.clear();
  };

  const selectFacility = (id: string | null, pan = true) => {
    setSelectedId(id);
    map.current?.selectFacility(id, pan);
  };

  useEffect(() => {
    if (trace) map.current?.setTrace(trace);
  }, [map, trace]);

  useEffect(() => {
    map.current?.filterFacilities(filters.mapIds);
  }, [map, filters.mapIds]);

  const selected = trace && selectedId ? (trace.facilities.find((f) => f.id === selectedId) ?? null) : null;

  return { state, trace, pin, distanceKm, changeDistance, dropPin, clearPin, retry, selected, selectFacility, filters };
}

export type MapTool = ReturnType<typeof useMapTool>;
