/** EPA ECHO discharge monitoring data: effluent charts (per permit) and annual loads (Water Pollutant Loading Tool). */
import type { DmrParameter, DmrValue, EffluentSummary, LoadRow } from '../types';
import { num, oracleDateToIso } from '../lib/parse';
import { ECHO_PAGE_SIZE, ENDPOINTS, TIMEOUT_MS } from './config';
import { getJson, qs } from './http';

const SOURCE = 'EPA ECHO';

// ---------------------------------------------------------------- Annual loads

/** dmr_rest_services.get_custom_data_annual columns: 2 ExternalPermitNmbr, 3 FacilityName, 23 Huc12, 32 PermFeatureNmbr,
 * 38 ParameterCode, 39 ParameterDesc, 40 Twf, 48 PollutantLoad, 51 AllowableLoad, 52 LoadOverLimit1 (verified live). */
const LOAD_COLUMNS = [2, 3, 23, 32, 38, 39, 40, 48, 51, 52].join(',');

function toLoadRow(r: any): LoadRow | null {
  const lbs = num(r.PollutantLoad);
  if (lbs === null || lbs <= 0) return null;
  return {
    permit: r.ExternalPermitNmbr,
    facility: r.FacilityName,
    huc12: r.Huc12 ?? null,
    outfall: r.PermFeatureNmbr,
    paramCode: r.ParameterCode,
    param: r.ParameterDesc,
    lbs,
    allowableLbs: num(r.AllowableLoad),
    overLimitLbs: num(r.LoadOverLimit1),
    twf: num(r.Twf),
  };
}

/**
 * Annual DMR loads for a HUC-8. The loading tool has no get_qid: each page request re-runs the query (a new QueryID
 * comes back), which was verified to return complete, non-overlapping pages (12,855 of 12,855 rows for HUC 01090001).
 */
export async function fetchLoads(huc8: string, year: number, signal?: AbortSignal): Promise<LoadRow[]> {
  const url = `${ENDPOINTS.echo}/dmr_rest_services.get_custom_data_annual`;
  const base = { output: 'JSON', p_year: year, p_huc: huc8, responseset: ECHO_PAGE_SIZE, qcolumns: LOAD_COLUMNS };
  const opts = { signal, timeoutMs: TIMEOUT_MS.echo, source: SOURCE };
  const first = await getJson(`${url}?${qs(base)}`, opts);
  const { QueryID, PageCount } = first.Results;
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, Number(PageCount) - 1) }, (_, i) => getJson(`${url}?${qs({ ...base, qid: QueryID, pageno: i + 2 })}`, opts)),
  );
  return [first, ...rest].flatMap((r) => r.Results.Results ?? []).map(toLoadRow).filter((r): r is LoadRow => r !== null);
}

// ---------------------------------------------------------------- Effluent charts (DMRs)

const mdy = (d: Date) => `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;

/** Value and unit are taken as a pair: standard units when ECHO converted them, else as reported. */
function valueWithUnit(std: unknown, stdUnit: unknown, raw: unknown, rawUnit: unknown): { value: number | null; unit: string | null } {
  const s = num(std);
  if (s !== null) return { value: s, unit: (stdUnit as string) ?? (rawUnit as string) ?? null };
  return { value: num(raw), unit: (rawUnit as string) ?? null };
}

function toDmrValue(d: any): DmrValue | null {
  const period = oracleDateToIso(d.MonitoringPeriodEndDate);
  if (!period) return null;
  const v = valueWithUnit(d.DMRValueStdUnits, d.StdUnitDesc, d.DMRValueNmbr, d.DMRUnitDesc);
  const l = valueWithUnit(d.LimitValueStdUnits, d.StdUnitDesc, d.LimitValueNmbr, d.LimitUnitDesc);
  const exceedPct = num(d.ExceedencePct); // ECHO sends "11%"
  return {
    period,
    stat: d.StatisticalBaseDesc ?? d.ValueTypeDesc ?? '',
    value: v.value,
    unit: v.unit,
    limit: l.value,
    limitUnit: l.unit,
    nodi: d.NODIDesc ?? null,
    exceedPct,
    violation: (d.NPDESViolations ?? []).length > 0 || (exceedPct ?? 0) > 0,
  };
}

function toParameter(pf: any, p: any): DmrParameter | null {
  const values = (p.DischargeMonitoringReports ?? [])
    .map(toDmrValue)
    .filter((v: DmrValue | null): v is DmrValue => v !== null)
    .sort((a: DmrValue, b: DmrValue) => b.period.localeCompare(a.period));
  if (!values.length) return null;
  return {
    outfall: pf.PermFeatureNmbr,
    outfallType: pf.PermFeatureTypeDesc,
    code: p.ParameterCode,
    name: p.ParameterDesc,
    location: p.MonitoringLocationDesc,
    values,
    exceedances: values.filter((v: DmrValue) => v.violation).length,
    latest: values.find((v: DmrValue) => v.value !== null) ?? values[0],
  };
}

/** Discharge Monitoring Report values for one permit over the last 12 months. */
export async function fetchEffluent(permit: string, signal?: AbortSignal): Promise<EffluentSummary> {
  const end = new Date();
  const start = new Date(end);
  start.setFullYear(end.getFullYear() - 1);
  const json = await getJson(
    `${ENDPOINTS.echo}/eff_rest_services.get_effluent_chart?${qs({ output: 'JSON', p_id: permit, start_date: mdy(start), end_date: mdy(end) })}`,
    { signal, timeoutMs: TIMEOUT_MS.echoEffluent, source: SOURCE, cache: true },
  );
  const parameters: DmrParameter[] = [];
  for (const pf of json.Results.PermFeatures ?? []) {
    for (const p of pf.Parameters ?? []) {
      const param = toParameter(pf, p);
      if (param) parameters.push(param);
    }
  }
  // Exceedances first, then parameters with measured values, before 'No Discharge' outfalls.
  const measured = (p: DmrParameter) => (p.values.some((v) => v.value !== null) ? 0 : 1);
  parameters.sort((a, b) => b.exceedances - a.exceedances || measured(a) - measured(b) || a.outfall.localeCompare(b.outfall));
  return { permit, start: mdy(start), end: mdy(end), parameters };
}
