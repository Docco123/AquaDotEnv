/** EPA WATERS NHDPlus V2 flowline attributes for a single COMID (name, reachcode, EROM mean-annual velocity). */
import { ENDPOINTS, TIMEOUT_MS } from './config';
import { getJson, qs } from './http';

const SOURCE = 'EPA NHDPlus';
const FEET_TO_METERS = 0.3048;

export interface ReachAttributes {
  comid: number;
  gnisName: string | null;
  reachcode: string | null;
  /** EROM gage-adjusted mean-annual velocity (VA_MA, ft/s in the source), m/s. */
  meanAnnualVelocityMps: number | null;
  /** EROM gage-adjusted mean-annual flow (QA_MA), cfs. */
  meanAnnualFlowCfs: number | null;
}

const positive = (v: unknown): number | null => {
  const n = Number(v);
  return v !== null && v !== '' && Number.isFinite(n) && n > 0 ? n : null;
};

export async function fetchReachAttributes(comid: number, signal?: AbortSignal): Promise<ReachAttributes | null> {
  const query = { where: `comid=${comid}`, outFields: 'comid,gnis_name,reachcode,va_ma,qa_ma', returnGeometry: 'false', f: 'json' };
  const json = await getJson(`${ENDPOINTS.nhdplusFlowline}/query?${qs(query)}`, { signal, timeoutMs: TIMEOUT_MS.nhdplus, source: SOURCE, cache: true });
  const a = json?.features?.[0]?.attributes;
  if (!a) return null;
  const va = positive(a.va_ma);
  return {
    comid,
    gnisName: a.gnis_name || null,
    reachcode: a.reachcode || null,
    meanAnnualVelocityMps: va === null ? null : va * FEET_TO_METERS,
    meanAnnualFlowCfs: positive(a.qa_ma),
  };
}
