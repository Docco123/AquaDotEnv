export interface LatLng {
  lat: number;
  lng: number;
}

const PAIR = /^\s*([-+]?\d+(?:\.\d+)?)\s*°?\s*[,;\s]\s*([-+]?\d+(?:\.\d+)?)\s*°?\s*$/;

const inRange = (lat: number, lng: number) => Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

/**
 * Parses "lat, lng" (also "lat lng" or "lat;lng"). If the numbers only make
 * sense the other way round (e.g. "-81.6, 38.37"), they are swapped.
 */
export function parseLatLng(input: string): LatLng | null {
  const match = PAIR.exec(input);
  if (!match) return null;
  const a = Number(match[1]);
  const b = Number(match[2]);
  if (inRange(a, b)) return { lat: a, lng: b };
  if (inRange(b, a)) return { lat: b, lng: a };
  return null;
}
