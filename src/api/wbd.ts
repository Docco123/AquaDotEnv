/** USGS Watershed Boundary Dataset (hydrologic units). */
import type { FeatureCollection, Huc, HucLevel } from '../types';
import { ENDPOINTS, TIMEOUT_MS } from './config';
import { getJson, qs } from './http';

const SOURCE = 'USGS WBD';
/** WBD MapServer layer ids by HUC digit count. */
const WBD_LAYER: Record<number, number> = { 2: 1, 4: 2, 8: 4, 12: 6 };
/** Polygon simplification (degrees) per level: keeps payloads small. */
const SIMPLIFY: Record<number, number> = { 2: 0.05, 4: 0.004, 8: 0.0015, 12: 0.0004 };

const layerUrl = (level: number) => `${ENDPOINTS.wbd}/${WBD_LAYER[level]}/query`;
const opts = (signal?: AbortSignal) => ({ signal, timeoutMs: TIMEOUT_MS.wbd, source: SOURCE, cache: true });
const pointQuery = (lat: number, lng: number) => ({
  geometry: `${lng},${lat}`,
  geometryType: 'esriGeometryPoint',
  inSR: 4326,
  spatialRel: 'esriSpatialRelIntersects',
});

async function wbdQuery(level: number, params: Record<string, string | number>, signal?: AbortSignal): Promise<FeatureCollection> {
  const fields = level === 2 ? 'huc2,name' : `huc${level},name,areasqkm,states`;
  const query = { outFields: fields, outSR: 4326, maxAllowableOffset: SIMPLIFY[level], geometryPrecision: 5, returnGeometry: 'true', f: 'geojson', ...params };
  return getJson(`${layerUrl(level)}?${qs(query)}`, opts(signal));
}

function toHuc(level: HucLevel, f: FeatureCollection['features'][number]): Huc {
  const p = f.properties;
  const code = String(p[`huc${level}`]);
  f.properties = { code, name: p.name, level };
  return { code, name: p.name, level, areaSqKm: p.areasqkm, states: p.states, feature: f };
}

export async function fetchRegions(): Promise<FeatureCollection> {
  const fc = await wbdQuery(2, { where: '1=1' });
  fc.features.forEach((f) => (f.properties = { code: f.properties.huc2, name: f.properties.name, level: 2 }));
  return fc;
}

export async function fetchHucAtPoint(level: HucLevel, lat: number, lng: number, signal?: AbortSignal): Promise<Huc | null> {
  const fc = await wbdQuery(level, pointQuery(lat, lng), signal);
  return fc.features[0] ? toHuc(level, fc.features[0]) : null;
}

export interface HucInfo {
  code: string;
  name: string;
  states: string | null;
}

/** Code/name/states of the hydrologic unit containing a point, without geometry (fast). */
export async function fetchHucInfoAtPoint(level: 8 | 12, lat: number, lng: number, signal?: AbortSignal): Promise<HucInfo | null> {
  const query = { ...pointQuery(lat, lng), outFields: `huc${level},name,states`, returnGeometry: 'false', f: 'json' };
  const json = await getJson(`${layerUrl(level)}?${qs(query)}`, opts(signal));
  const a = json?.features?.[0]?.attributes;
  return a ? { code: String(a[`huc${level}`]), name: a.name, states: a.states ?? null } : null;
}

export async function fetchHuc(code: string): Promise<Huc | null> {
  const level = code.length as HucLevel;
  const fc = await wbdQuery(level, { where: `huc${level}='${code}'` });
  return fc.features[0] ? toHuc(level, fc.features[0]) : null;
}

export async function fetchChildHucs(parent: string, childLevel: HucLevel): Promise<Huc[]> {
  const fc = await wbdQuery(childLevel, { where: `huc${childLevel} LIKE '${parent}%'` });
  return fc.features.map((f) => toHuc(childLevel, f)).sort((a, b) => a.code.localeCompare(b.code));
}
