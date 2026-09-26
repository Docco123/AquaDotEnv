import { GEOCODER } from '../config';

export interface GeoResult {
  id: string;
  label: string;
  detail: string;
  lat: number;
  lng: number;
}

interface NominatimPlace {
  place_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
}

const COUNTRY = 'United States';

function toResult(place: NominatimPlace): GeoResult | null {
  const lat = Number(place.lat);
  const lng = Number(place.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const parts = place.display_name.split(', ').filter((p) => p !== COUNTRY);
  const label = place.name || parts[0] || place.display_name;
  const rest = parts[0] === label ? parts.slice(1) : parts;
  return { id: String(place.place_id), label, detail: rest.join(', '), lat, lng };
}

/** Free-text place search (US only) via OpenStreetMap Nominatim. */
export async function geocodePlace(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    countrycodes: GEOCODER.countryCodes,
    limit: String(GEOCODER.limit),
  });
  const res = await fetch(`${GEOCODER.url}?${params.toString()}`, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Place search failed (HTTP ${res.status}).`);
  const places = (await res.json()) as NominatimPlace[];
  return places.map(toResult).filter((r): r is GeoResult => r !== null);
}
