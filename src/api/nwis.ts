/** USGS NWIS instantaneous values: latest discharge (parameter 00060, cfs) for a set of gauges. */
import { ENDPOINTS, FLOW_MAX_AGE_MS, TIMEOUT_MS } from './config';
import { getJson, qs } from './http';

const SOURCE = 'USGS NWIS';
const DISCHARGE = '00060';

export interface FlowReading {
  cfs: number;
  time: string; // ISO with offset, as reported
}

function latestReading(series: any): FlowReading | null {
  const noData = Number(series?.variable?.noDataValue);
  const values: any[] = series?.values?.[0]?.value ?? [];
  const last = values[values.length - 1];
  const cfs = Number(last?.value);
  if (!last || !Number.isFinite(cfs) || cfs === noData) return null;
  return { cfs, time: String(last.dateTime) };
}

const isFresh = (r: FlowReading, now: number) => now - Date.parse(r.time) <= FLOW_MAX_AGE_MS;

/** Latest discharge by site number (e.g. "01104500"); stale (> 7 days) and missing readings are omitted. One request. */
export async function fetchLatestDischarge(siteNumbers: string[], signal?: AbortSignal): Promise<Map<string, FlowReading>> {
  const out = new Map<string, FlowReading>();
  if (!siteNumbers.length) return out;
  const url = `${ENDPOINTS.nwisIv}?${qs({ format: 'json', sites: siteNumbers.join(','), parameterCd: DISCHARGE, siteStatus: 'all' })}`;
  const json = await getJson(url, { signal, timeoutMs: TIMEOUT_MS.nwis, source: SOURCE });
  const now = Date.now();
  for (const series of json?.value?.timeSeries ?? []) {
    const site = String(series?.sourceInfo?.siteCode?.[0]?.value ?? '');
    const reading = latestReading(series);
    if (site && reading && isFresh(reading, now)) out.set(site, reading);
  }
  return out;
}
