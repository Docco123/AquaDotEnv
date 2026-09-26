/** Geodesy helpers. Coordinates are GeoJSON order [lng, lat]. */
export type LngLat = [number, number];

const EARTH_RADIUS_KM = 6371.0088;
const RAD = Math.PI / 180;

export function haversineKm(a: LngLat, b: LngLat): number {
  const dLat = (b[1] - a[1]) * RAD;
  const dLng = (b[0] - a[0]) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * RAD) * Math.cos(b[1] * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function polylineLengthKm(coords: LngLat[]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) total += haversineKm(coords[i - 1], coords[i]);
  return total;
}

export interface Projection {
  point: LngLat; // nearest point on the line
  offLineKm: number; // distance from the input point to the line
  alongKm: number; // distance along the line from its first vertex to `point`
  segment: number; // index of the segment's end vertex
}

/** Parameter t in [0,1] of the nearest point on segment a-b (local equirectangular approximation). */
function segmentT(p: LngLat, a: LngLat, b: LngLat): number {
  const k = Math.cos(p[1] * RAD);
  const dx = (b[0] - a[0]) * k;
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return 0;
  const t = (((p[0] - a[0]) * k) * dx + (p[1] - a[1]) * dy) / len2;
  return Math.max(0, Math.min(1, t));
}

/** Nearest point on a polyline and how far along the line it is. */
export function projectOntoPolyline(p: LngLat, coords: LngLat[]): Projection {
  if (coords.length === 1) return { point: coords[0], offLineKm: haversineKm(p, coords[0]), alongKm: 0, segment: 0 };
  let best: Projection = { point: coords[0], offLineKm: Infinity, alongKm: 0, segment: 1 };
  let walked = 0;
  for (let i = 1; i < coords.length; i++) {
    const a = coords[i - 1];
    const b = coords[i];
    const segKm = haversineKm(a, b);
    const t = segmentT(p, a, b);
    const q: LngLat = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
    const d = haversineKm(p, q);
    if (d < best.offLineKm) best = { point: q, offLineKm: d, alongKm: walked + t * segKm, segment: i };
    walked += segKm;
  }
  return best;
}
