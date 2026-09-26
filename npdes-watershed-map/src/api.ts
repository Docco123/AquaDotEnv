import type {
  ComplianceClass,
  DmrParameter,
  DmrValue,
  EffluentSummary,
  Facility,
  FeatureCollection,
  Huc,
  HucLevel,
  LoadRow,
  PermitGroup,
} from './types';

// All endpoints are public and keyless. ECHO and USGS both send CORS headers,
// so the same code runs in the browser and on device.
const WBD = 'https://hydro.nationalmap.gov/arcgis/rest/services/wbd/MapServer';
const ECHO = 'https://echodata.epa.gov/echo';

/** WBD MapServer layer ids by HUC digit count. */
const WBD_LAYER: Record<number, number> = { 2: 1, 4: 2, 8: 4, 12: 6 };
/** Polygon simplification (degrees) per level: keeps payloads small on phones. */
const SIMPLIFY: Record<number, number> = { 2: 0.05, 4: 0.004, 8: 0.0015, 12: 0.0004 };

const cache = new Map<string, Promise<any>>();

async function getJson(url: string): Promise<any> {
  const hit = cache.get(url);
  if (hit) return hit;
  const p = (async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).host}`);
    const json = await res.json();
    const err = json?.Results?.Error?.ErrorMessage ?? json?.error?.message;
    if (err) throw new Error(err);
    return json;
  })();
  cache.set(url, p);
  p.catch(() => cache.delete(url));
  return p;
}

const qs = (params: Record<string, string | number>) =>
  Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '' || v === '--') return null;
  const n = Number(String(v).replace(/[,$]/g, ''));
  return Number.isFinite(n) ? n : null;
};

// ---------------------------------------------------------------- Watersheds (USGS WBD)

async function wbdQuery(level: number, params: Record<string, string | number>): Promise<FeatureCollection> {
  const fields = level === 2 ? 'huc2,name' : `huc${level},name,areasqkm,states`;
  const url =
    `${WBD}/${WBD_LAYER[level]}/query?` +
    qs({
      outFields: fields,
      outSR: 4326,
      maxAllowableOffset: SIMPLIFY[level],
      geometryPrecision: 5,
      returnGeometry: 'true',
      f: 'geojson',
      ...params,
    });
  return getJson(url);
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

export async function fetchHucAtPoint(level: HucLevel, lat: number, lng: number): Promise<Huc | null> {
  const fc = await wbdQuery(level, {
    geometry: `${lng},${lat}`,
    geometryType: 'esriGeometryPoint',
    inSR: 4326,
    spatialRel: 'esriSpatialRelIntersects',
  });
  return fc.features[0] ? toHuc(level, fc.features[0]) : null;
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

// ---------------------------------------------------------------- Facilities (ECHO CWA / ICIS-NPDES)

// Column ids from cwa_rest_services.metadata. Only what the app displays is requested.
const FAC_COLUMNS = [
  1, 2, 4, 5, 9, 24, 25, 26, 28, 54, 60, 98, 105, 114, 121, 145, 156, 164, 165, 166, 195, 200, 212, 220, 225, 230,
].join(',');
const PAGE = 5000;

function permitGroup(type: string, major: boolean): PermitGroup {
  if (major) return 'major';
  if (/IU Permit|Non-NPDES/i.test(type)) return 'pretreatment';
  if (/Individual/i.test(type)) return 'individual';
  return 'general';
}

function classify(r: any): ComplianceClass {
  // CWP13qtrsComplHistory: one char per quarter, most recent last.
  // "_" = no violation, "V" = violation, "S" = significant noncompliance.
  const last4 = String(r.CWP13qtrsComplHistory ?? '').slice(-4);
  if (last4.includes('S')) return 'snc';
  if ((num(r.E90Exceeds1yr) ?? 0) > 0) return 'effluent';
  if (last4.includes('V') || r.VioLastYear === '1') return 'violation';
  if (r.EffChartsFlag === 'Y' || r.LastDMRValueRcvdDate) return 'ok';
  return 'nodata';
}

function toFacility(r: any): Facility | null {
  const lat = num(r.FacLat);
  const lng = num(r.FacLong);
  if (lat === null || lng === null) return null;
  const major = r.CWPMajorMinorStatusFlag === 'M';
  const type = r.CWPPermitTypeDesc ?? '';
  return {
    id: r.SourceID,
    registryId: r.RegistryID,
    name: r.CWPName,
    city: r.CWPCity ?? '',
    state: r.CWPState ?? '',
    lat,
    lng,
    permitType: type,
    group: permitGroup(type, major),
    major,
    potw: r.CWPFacilityTypeIndicator === 'POTW',
    designFlowMgd: num(r.CWPTotalDesignFlowNmbr),
    huc12: r.FacDerivedWBD ?? null,
    huc12Name: r.FacDerivedWBDName ?? null,
    receivingWater: r.RadGnisName ?? null,
    compliance: classify(r),
    sncStatus: r.CWPSNCStatus ?? null,
    qtrHistory: r.CWP13qtrsComplHistory ?? '',
    effluentExceedances1yr: num(r.E90Exceeds1yr) ?? 0,
    exceedancePollutants1yr: r.E90Pollutants1yr ? String(r.E90Pollutants1yr).split('|').join(', ') : null,
    pollWithViolation: r.PollWithViolation ? String(r.PollWithViolation).split('|').join(', ') : null,
    penalties: r.CWPTotalPenalties && r.CWPTotalPenalties !== '$0' ? r.CWPTotalPenalties : null,
    formalActions: num(r.CWPFormalEaCnt) ?? 0,
    hasDmrs: r.EffChartsFlag === 'Y',
    lastDmrDate: r.LastDMRValueRcvdDate ?? null,
    cso: r.CWPCsoFlag === 'Y',
  };
}

/** Active permits (Effective + Administratively Continued) located in a HUC-8. */
export async function fetchFacilities(huc8: string): Promise<Facility[]> {
  const search = await getJson(
    `${ECHO}/cwa_rest_services.get_facilities?` +
      qs({ output: 'JSON', p_huc: huc8, p_pstat: 'EFF,ADC', responseset: PAGE }),
  );
  const { QueryID, QueryRows } = search.Results;
  const pages = Math.max(1, Math.ceil(Number(QueryRows) / PAGE));
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      getJson(
        `${ECHO}/cwa_rest_services.get_qid?` +
          qs({ output: 'JSON', qid: QueryID, pageno: i + 1, qcolumns: FAC_COLUMNS }),
      ),
    ),
  );
  return results
    .flatMap((r) => r.Results.Facilities ?? [])
    .map(toFacility)
    .filter((f): f is Facility => f !== null);
}

// ---------------------------------------------------------------- Annual loads (EPA Loading Tool)

// Column ids from dmr_rest_services.get_custom_data_annual.
const LOAD_COLUMNS = [2, 3, 23, 32, 38, 39, 40, 48, 51, 52].join(',');

export async function fetchLoads(huc8: string, year: number): Promise<LoadRow[]> {
  const base = { output: 'JSON', p_year: year, p_huc: huc8, responseset: PAGE, qcolumns: LOAD_COLUMNS };
  const first = await getJson(`${ECHO}/dmr_rest_services.get_custom_data_annual?${qs(base)}`);
  const { QueryID, PageCount } = first.Results;
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, Number(PageCount) - 1) }, (_, i) =>
      getJson(`${ECHO}/dmr_rest_services.get_custom_data_annual?${qs({ ...base, qid: QueryID, pageno: i + 2 })}`),
    ),
  );
  return [first, ...rest]
    .flatMap((r) => r.Results.Results ?? [])
    .map((r: any): LoadRow | null => {
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
    })
    .filter((r): r is LoadRow => r !== null);
}

// ---------------------------------------------------------------- DMRs (ECHO effluent charts)

const MONTHS: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
};
/** "30-SEP-25" -> "2025-09-30" */
const oraDate = (d: string) => {
  const [dd, mon, yy] = d.split('-');
  return `20${yy}-${MONTHS[mon]}-${dd}`;
};
const mdy = (d: Date) =>
  `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;

/** Discharge Monitoring Report values for one permit over the last 12 months. */
export async function fetchEffluent(permit: string): Promise<EffluentSummary> {
  const end = new Date();
  const start = new Date(end);
  start.setFullYear(end.getFullYear() - 1);
  const json = await getJson(
    `${ECHO}/eff_rest_services.get_effluent_chart?` +
      qs({ output: 'JSON', p_id: permit, start_date: mdy(start), end_date: mdy(end) }),
  );
  const parameters: DmrParameter[] = [];
  for (const pf of json.Results.PermFeatures ?? []) {
    for (const p of pf.Parameters ?? []) {
      const values: DmrValue[] = (p.DischargeMonitoringReports ?? [])
        .filter((d: any) => d.MonitoringPeriodEndDate)
        .map(
          (d: any): DmrValue => ({
            period: oraDate(d.MonitoringPeriodEndDate),
            stat: d.StatisticalBaseDesc ?? d.ValueTypeDesc ?? '',
            value: num(d.DMRValueStdUnits ?? d.DMRValueNmbr),
            unit: d.StdUnitDesc ?? d.DMRUnitDesc ?? null,
            limit: num(d.LimitValueStdUnits ?? d.LimitValueNmbr),
            limitUnit: d.StdUnitDesc ?? d.LimitUnitDesc ?? null,
            nodi: d.NODIDesc ?? null,
            exceedPct: num(d.ExceedencePct),
            violation: (d.NPDESViolations ?? []).length > 0 || (num(d.ExceedencePct) ?? 0) > 0,
          }),
        )
        .sort((a: DmrValue, b: DmrValue) => b.period.localeCompare(a.period));
      if (!values.length) continue;
      parameters.push({
        outfall: pf.PermFeatureNmbr,
        outfallType: pf.PermFeatureTypeDesc,
        code: p.ParameterCode,
        name: p.ParameterDesc,
        location: p.MonitoringLocationDesc,
        values,
        exceedances: values.filter((v) => v.violation).length,
        latest: values.find((v) => v.value !== null) ?? values[0],
      });
    }
  }
  // Exceedances first, then parameters with measured values, before 'No Discharge' outfalls.
  const measured = (p: DmrParameter) => (p.values.some((v) => v.value !== null) ? 0 : 1);
  parameters.sort((a, b) => b.exceedances - a.exceedances || measured(a) - measured(b) || a.outfall.localeCompare(b.outfall));
  return { permit, start: mdy(start), end: mdy(end), parameters };
}

export const echoReportUrl = (registryId: string) =>
  `https://echo.epa.gov/detailed-facility-report?fid=${registryId}`;
