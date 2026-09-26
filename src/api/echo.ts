/** EPA ECHO Clean Water Act facility data (ICIS-NPDES). */
import type { Facility, PermitGroup } from '../types';
import { classifyCompliance, isActivePermitStatus, normalizeQtrHistory } from '../lib/compliance';
import { chunk, mapWithConcurrency } from '../lib/async';
import { joinList, num, usDateToIso } from '../lib/parse';
import { ECHO_CONCURRENCY, ECHO_ID_CHUNK, ECHO_PAGE_SIZE, ENDPOINTS, TIMEOUT_MS } from './config';
import { getJson, qs } from './http';

const CWA = `${ENDPOINTS.echo}/cwa_rest_services`;
const SOURCE = 'EPA ECHO';

/**
 * Column ids from cwa_rest_services.metadata (verified live, Sept 2026):
 * 1 CWPName, 2 SourceID, 4 CWPCity, 5 CWPState, 9 RegistryID, 24 FacLat, 25 FacLong, 26 CWPTotalDesignFlowNmbr,
 * 27 CWPActualAverageFlowNmbr, 28 CWPFacilityTypeIndicator, 51 CWPPermitStatusDesc, 54 CWPPermitTypeDesc,
 * 59 CWPExpirationDate, 60 CWPMajorMinorStatusFlag, 64 CWPInspectionCount, 66 CWPDateLastInspection, 98 CWPSNCStatus,
 * 99 CWPVioStatus, 101 CWPQtrsWithNC, 103 CWPQtrsWithSNC, 104 MissDMRQtrs, 105 CWPE90Cnt, 113 CWPInformalEnfActCount,
 * 114 CWPFormalEaCnt, 118 CWPDateLastFea, 121 CWPTotalPenalties, 145 PollWithViolation, 147 DMRPounds, 151 DMRTwpe,
 * 156 CWPCsoFlag, 163 RadWBDHuc12s, 164 FacDerivedWBD, 165 FacDerivedWBDName, 166 RadGnisName, 167 RadReachcode,
 * 168 RadWBDHu8, 169 RadWBDHu8Name, 179 AttainsPssbleE90NPDESParams, 190 CWPPermitStatusCode, 192 CWPSNCEventDesc,
 * 195 CWP13qtrsComplHistory, 198 DMRImpairedPoll, 200 EffChartsFlag, 204 ViolFlag, 212 LastDMRValueRcvdDate,
 * 216 E90Exceeds5yr, 220 E90Exceeds1yr, 221 E90Pollutants5yr, 225 E90Pollutants1yr, 230 VioLastYear
 */
export const FAC_COLUMNS = [
  1, 2, 4, 5, 9, 24, 25, 26, 27, 28, 51, 54, 59, 60, 64, 66, 98, 99, 101, 103, 104, 105, 113, 114, 118, 121, 145, 147,
  151, 156, 163, 164, 165, 166, 167, 168, 169, 179, 190, 192, 195, 198, 200, 204, 212, 216, 220, 221, 225, 230,
].join(',');

/** NPDES ids are 2-letter state code + 7 characters; NLDI sometimes appends an outfall suffix (e.g. MA0003531001). */
const PERMIT_ID = /^[A-Z]{2}[A-Z0-9]{7}$/;

export function toPermitId(nldiId: string): string {
  const id = nldiId.trim().toUpperCase();
  return id.length > 9 && PERMIT_ID.test(id.slice(0, 9)) ? id.slice(0, 9) : id;
}

function permitGroup(type: string, major: boolean): PermitGroup {
  if (major) return 'major';
  if (/IU Permit|Non-NPDES/i.test(type)) return 'pretreatment';
  if (/Individual/i.test(type)) return 'individual';
  return 'general';
}

const str = (v: unknown): string | null => (v === null || v === undefined || v === '' ? null : String(v));

function complianceFields(r: any) {
  const qtrHistory = normalizeQtrHistory(r.CWP13qtrsComplHistory);
  const effluentExceedances1yr = num(r.E90Exceeds1yr) ?? 0;
  const hasDmrs = r.EffChartsFlag === 'Y';
  const lastDmrDate = usDateToIso(r.LastDMRValueRcvdDate);
  const violationLastYear = String(r.VioLastYear) === '1';
  const compliance = classifyCompliance({
    qtrHistory,
    sncStatus: str(r.CWPSNCStatus),
    vioStatus: str(r.CWPVioStatus),
    effluentExceedances1yr,
    violationLastYear,
    hasMonitoring: hasDmrs || lastDmrDate !== null,
  });
  return { qtrHistory, effluentExceedances1yr, hasDmrs, lastDmrDate, violationLastYear, compliance };
}

function optionalFields(r: any): Partial<Facility> {
  const penaltiesUsd = num(r.CWPTotalPenalties) ?? 0;
  return {
    actualFlowMgd: num(r.CWPActualAverageFlowNmbr),
    permitStatus: str(r.CWPPermitStatusDesc),
    permitStatusCode: str(r.CWPPermitStatusCode),
    permitActive: isActivePermitStatus(str(r.CWPPermitStatusCode)),
    permitExpires: usDateToIso(r.CWPExpirationDate),
    inspections5yr: num(r.CWPInspectionCount) ?? 0,
    lastInspectionDate: usDateToIso(r.CWPDateLastInspection),
    vioStatus: str(r.CWPVioStatus),
    qtrsWithNc: num(r.CWPQtrsWithNC) ?? 0,
    qtrsWithSnc: num(r.CWPQtrsWithSNC) ?? 0,
    qtrsUndetermined: num(r.MissDMRQtrs) ?? 0,
    effluentExceedances3yr: num(r.CWPE90Cnt) ?? 0,
    effluentExceedances5yr: num(r.E90Exceeds5yr) ?? 0,
    exceedancePollutants5yr: joinList(r.E90Pollutants5yr),
    informalActions: num(r.CWPInformalEnfActCount) ?? 0,
    lastFormalActionDate: usDateToIso(r.CWPDateLastFea),
    penaltiesUsd,
    sncEventDesc: str(r.CWPSNCEventDesc),
    violationLast3yr: String(r.ViolFlag) === '1',
    dmrPoundsLastYear: num(r.DMRPounds),
    dmrToxicWeightedLastYear: num(r.DMRTwpe),
    impairingPollutants: joinList(r.DMRImpairedPoll),
    impairingExceedancePollutants: joinList(r.AttainsPssbleE90NPDESParams),
    radReachcode: str(r.RadReachcode),
    radHuc8: str(r.RadWBDHu8),
    radHuc8Name: str(r.RadWBDHu8Name),
    radHuc12s: str(r.RadWBDHuc12s),
  };
}

/** Map one ECHO row to a Facility. Rows without coordinates are dropped. */
export function toFacility(r: any): Facility | null {
  const lat = num(r.FacLat);
  const lng = num(r.FacLong);
  if (lat === null || lng === null) return null;
  const major = r.CWPMajorMinorStatusFlag === 'M';
  const type = r.CWPPermitTypeDesc ?? '';
  const c = complianceFields(r);
  const penalties = num(r.CWPTotalPenalties) ?? 0;
  return {
    id: r.SourceID,
    registryId: r.RegistryID ?? '',
    name: r.CWPName ?? r.SourceID,
    city: r.CWPCity ?? '',
    state: r.CWPState ?? '',
    lat,
    lng,
    permitType: type,
    group: permitGroup(type, major),
    major,
    potw: r.CWPFacilityTypeIndicator === 'POTW',
    designFlowMgd: num(r.CWPTotalDesignFlowNmbr),
    huc12: str(r.FacDerivedWBD),
    huc12Name: str(r.FacDerivedWBDName),
    receivingWater: str(r.RadGnisName),
    compliance: c.compliance,
    sncStatus: str(r.CWPSNCStatus),
    qtrHistory: c.qtrHistory,
    effluentExceedances1yr: c.effluentExceedances1yr,
    exceedancePollutants1yr: joinList(r.E90Pollutants1yr),
    pollWithViolation: joinList(r.PollWithViolation),
    penalties: penalties > 0 ? String(r.CWPTotalPenalties) : null,
    formalActions: num(r.CWPFormalEaCnt) ?? 0,
    hasDmrs: c.hasDmrs,
    lastDmrDate: c.lastDmrDate,
    cso: r.CWPCsoFlag === 'Y',
    violationLastYear: c.violationLastYear,
    ...optionalFields(r),
  };
}

const facilityRows = (json: any): any[] => json?.Results?.Facilities ?? [];

/**
 * Rows for a QueryID. QueryIDs are small recycled integers shared across ECHO services (a QueryID reused minutes later
 * returned someone else's rows), so pages are fetched immediately and never cached.
 */
async function fetchQidPages(qid: string, rows: number, signal?: AbortSignal): Promise<any[]> {
  const pages = Math.max(1, Math.ceil(rows / ECHO_PAGE_SIZE));
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      getJson(`${CWA}.get_qid?${qs({ output: 'JSON', qid, pageno: i + 1, qcolumns: FAC_COLUMNS })}`, { signal, timeoutMs: TIMEOUT_MS.echo, source: SOURCE }),
    ),
  );
  return results.flatMap(facilityRows);
}

/**
 * One id batch via get_facility_info, which returns rows directly (no QueryID round trip). If ECHO answers with map
 * clusters instead of rows (large result sets), fall back to get_qid with the QueryID from the same response.
 */
async function fetchIdBatch(ids: string[], signal?: AbortSignal): Promise<any[]> {
  const url = `${CWA}.get_facility_info?${qs({ output: 'JSON', p_pid: ids.join(','), qcolumns: FAC_COLUMNS })}`;
  const json = await getJson(url, { signal, timeoutMs: TIMEOUT_MS.echo, source: SOURCE, cache: true });
  const rows = json?.Results?.Facilities;
  if (Array.isArray(rows)) return rows;
  const { QueryID, QueryRows } = json?.Results ?? {};
  return QueryID && Number(QueryRows) > 0 ? fetchQidPages(String(QueryID), Number(QueryRows), signal) : [];
}

export interface EchoLookup {
  facilities: Map<string, Facility>;
  /** Ids ECHO has no record for. */
  missing: string[];
  /** Ids whose batch request failed. */
  failed: string[];
  errors: string[];
}

/**
 * Look up permits by NPDES id, in batches of ECHO_ID_CHUNK with ECHO_CONCURRENCY requests in flight. No permit-status
 * filter: inactive / terminated permits are returned with their status so the UI can decide.
 */
export async function fetchFacilitiesByIds(ids: string[], signal?: AbortSignal): Promise<EchoLookup> {
  const unique = [...new Set(ids.map((i) => i.toUpperCase()))];
  const out: EchoLookup = { facilities: new Map(), missing: [], failed: [], errors: [] };
  await mapWithConcurrency(chunk(unique, ECHO_ID_CHUNK), ECHO_CONCURRENCY, async (batch) => {
    try {
      for (const row of await fetchIdBatch(batch, signal)) {
        const f = toFacility(row);
        const id = String(row.SourceID ?? '').toUpperCase();
        if (f && batch.includes(id)) out.facilities.set(id, f);
      }
    } catch (err) {
      if (signal?.aborted) throw err;
      out.failed.push(...batch);
      out.errors.push((err as Error).message);
    }
  });
  const failed = new Set(out.failed);
  out.missing = unique.filter((id) => !out.facilities.has(id) && !failed.has(id));
  return out;
}

/** Active permits (Effective + Administratively Continued) located in a HUC-8. */
export async function fetchFacilities(huc8: string, signal?: AbortSignal): Promise<Facility[]> {
  const search = await getJson(`${CWA}.get_facilities?${qs({ output: 'JSON', p_huc: huc8, p_pstat: 'EFF,ADC', responseset: ECHO_PAGE_SIZE })}`, {
    signal,
    timeoutMs: TIMEOUT_MS.echo,
    source: SOURCE,
  });
  const { QueryID, QueryRows } = search.Results;
  const rows = await fetchQidPages(String(QueryID), Number(QueryRows), signal);
  return rows.map(toFacility).filter((f): f is Facility => f !== null);
}

export const echoReportUrl = (registryId: string) => `${ENDPOINTS.echoReport}?fid=${registryId}`;
