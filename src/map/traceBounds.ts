import type { UpstreamTrace } from '@/types';
import type { LatLngBoundsTuple } from './types';

/**
 * Bounds of what was actually traced: the pin, the upstream flowlines and the
 * placed facilities. The basin polygon is left out on purpose — for big rivers
 * it covers far more than the traced distance.
 */
export function traceBounds(trace: UpstreamTrace): LatLngBoundsTuple {
  let south = trace.pin.lat;
  let north = trace.pin.lat;
  let west = trace.pin.lng;
  let east = trace.pin.lng;
  const extend = (lat: number, lng: number) => {
    if (lat < south) south = lat;
    if (lat > north) north = lat;
    if (lng < west) west = lng;
    if (lng > east) east = lng;
  };
  for (const line of trace.flowlines) for (const [lng, lat] of line.coords) extend(lat, lng);
  for (const f of trace.facilities) if (f.riverKm !== null) extend(f.lat, f.lng);
  return [
    [south, west],
    [north, east],
  ];
}
