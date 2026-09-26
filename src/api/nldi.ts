/** USGS Network-Linked Data Index: snapping, upstream navigation, linked NPDES / NWIS sites, basins. */
import type { Feature } from '../types';
import type { LngLat } from '../lib/geo';
import type { RawFlowline } from '../lib/network';
import { ENDPOINTS, TIMEOUT_MS } from './config';
import { ApiError, getJson, qs } from './http';

const SOURCE = 'USGS NLDI';
const opts = (signal?: AbortSignal) => ({ signal, timeoutMs: TIMEOUT_MS.nldi, source: SOURCE, cache: true });

export interface SnappedReach {
  comid: number;
  coords: LngLat[];
}

export interface LinkedSite {
  identifier: string;
  name: string;
  comid: number | null;
  reachcode: string | null;
  measure: number | null;
  uri: string;
  point: LngLat;
}

/** Flatten LineString / MultiLineString to one vertex list (parts are digitized downstream, in order). */
function lineCoords(geometry: any): LngLat[] {
  if (geometry?.type === 'LineString') return geometry.coordinates;
  if (geometry?.type === 'MultiLineString') return geometry.coordinates.flat();
  return [];
}

/** The NHDPlus flowline whose catchment contains the point, or null. */
export async function snapToReach(lat: number, lng: number, signal?: AbortSignal): Promise<SnappedReach | null> {
  const url = `${ENDPOINTS.nldi}/comid/position?${qs({ coords: `POINT(${lng} ${lat})` })}`;
  let json: any;
  try {
    json = await getJson(url, opts(signal));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
  const f = json?.features?.[0];
  const comid = Number(f?.properties?.comid);
  return Number.isFinite(comid) && comid > 0 ? { comid, coords: lineCoords(f.geometry) } : null;
}

/** Flowlines upstream of a comid: UT = all tributaries, UM = main stem only. */
export async function fetchFlowlines(comid: number, mode: 'UT' | 'UM', distanceKm: number, signal?: AbortSignal): Promise<RawFlowline[]> {
  const json = await getJson(`${ENDPOINTS.nldi}/comid/${comid}/navigation/${mode}/flowlines?distance=${distanceKm}`, opts(signal));
  return (json?.features ?? [])
    .map((f: any): RawFlowline => ({ comid: Number(f.properties?.nhdplus_comid), coords: lineCoords(f.geometry) }))
    .filter((l: RawFlowline) => Number.isFinite(l.comid) && l.coords.length > 1);
}

/** Linked features (NPDES permits or NWIS sites) indexed to the upstream network. 404 = none. */
export async function fetchLinkedSites(comid: number, source: 'npdes' | 'nwissite', distanceKm: number, signal?: AbortSignal): Promise<LinkedSite[]> {
  let json: any;
  try {
    json = await getJson(`${ENDPOINTS.nldi}/comid/${comid}/navigation/UT/${source}?distance=${distanceKm}`, opts(signal));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
  return (json?.features ?? [])
    .filter((f: any) => f?.geometry?.type === 'Point' && f.properties?.identifier)
    .map((f: any): LinkedSite => {
      const p = f.properties;
      const measure = Number(p.measure);
      return {
        identifier: String(p.identifier),
        name: String(p.name ?? p.identifier),
        comid: Number.isFinite(Number(p.comid)) && p.comid !== '' ? Number(p.comid) : null,
        reachcode: p.reachcode || null,
        measure: p.measure !== '' && Number.isFinite(measure) ? measure : null,
        uri: String(p.uri ?? ''),
        point: f.geometry.coordinates as LngLat,
      };
    });
}

/** Simplified drainage basin polygon upstream of a comid. */
export async function fetchBasin(comid: number, signal?: AbortSignal): Promise<Feature | null> {
  const json = await getJson(`${ENDPOINTS.nldi}/comid/${comid}/basin?simplified=true`, opts(signal));
  return json?.features?.[0] ?? null;
}
