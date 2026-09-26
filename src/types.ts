export type HucLevel = 4 | 8 | 12;

export interface Feature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: any;
}

export interface FeatureCollection {
  type: 'FeatureCollection';
  features: Feature[];
}

/** A watershed (hydrologic unit) with its boundary as GeoJSON. */
export interface Huc {
  code: string;
  name: string;
  level: HucLevel;
  areaSqKm?: number;
  states?: string;
  feature: Feature;
}

export type ComplianceClass = 'snc' | 'effluent' | 'violation' | 'ok' | 'nodata';

export type PermitGroup = 'major' | 'individual' | 'general' | 'pretreatment';

/** One NPDES permit / facility from ECHO's CWA facility search. */
export interface Facility {
  id: string; // NPDES permit id (SourceID)
  registryId: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  permitType: string;
  group: PermitGroup;
  major: boolean;
  potw: boolean;
  designFlowMgd: number | null;
  huc12: string | null;
  huc12Name: string | null;
  receivingWater: string | null;
  compliance: ComplianceClass;
  sncStatus: string | null;
  /**
   * Compliance status by quarter [195 CWP13qtrsComplHistory], always 13 chars, oldest first: chars 0-11 are the 12 official
   * (QNCR) quarters, char 12 is the current quarter (draft, post-QNCR data). "_" no violation, "V" violation,
   * "S" significant noncompliance (high priority violation), "U" undetermined, "-" permit not in force (ECHO truncates the
   * history when a permit is terminated; we pad the missing recent quarters with "-").
   */
  qtrHistory: string;
  effluentExceedances1yr: number;
  exceedancePollutants1yr: string | null;
  pollWithViolation: string | null;
  penalties: string | null;
  formalActions: number;
  hasDmrs: boolean;
  lastDmrDate: string | null;
  cso: boolean;

  // ---- Optional ECHO fields (cwa_rest_services column id in brackets; semantics from ECHO's CWA swagger + Water Facility Search help).
  /** Actual average flow at time of permit application, MGD [27 CWPActualAverageFlowNmbr]. */
  actualFlowMgd?: number | null;
  /** Permit life-cycle status, e.g. "Effective", "Admin Continued", "Expired", "Terminated", "Pending" [51 CWPPermitStatusDesc]. */
  permitStatus?: string | null;
  /** Status code: EFF, ADC, EXP, TRM, PND, NON ... [190 CWPPermitStatusCode]. */
  permitStatusCode?: string | null;
  /** True when the permit currently authorizes discharge (EFF = Effective or ADC = Administratively Continued). */
  permitActive?: boolean;
  /** ISO date the permit expires/expired [59 CWPExpirationDate]. */
  permitExpires?: string | null;
  /** Compliance-monitoring activities (inspections) in the last 5 years [64 CWPInspectionCount]. */
  inspections5yr?: number;
  /** ISO date of the last compliance-monitoring activity [66 CWPDateLastInspection]. */
  lastInspectionDate?: string | null;
  /**
   * Reportable-noncompliance status of the most recent official quarter [99 CWPVioStatus]. Observed values:
   * "Reportable Noncompliance", "Other Violation", "Resolved", "Resolved - Pending", "Undetermined", or an SNC type
   * such as "Effluent - Monthly Average Limit" (equal to sncStatus when in SNC).
   */
  vioStatus?: string | null;
  /** Quarters with any violation (NC or SNC) of the last 12, incl. draft post-QNCR data; = min(12, V/S count in qtrHistory) [101 CWPQtrsWithNC]. */
  qtrsWithNc?: number;
  /** Quarters in significant noncompliance of the last 12 official quarters; = count of "S" in qtrHistory[0..11] [103 CWPQtrsWithSNC]. */
  qtrsWithSnc?: number;
  /** Quarters of the last 12 whose compliance status could not be determined, typically missing DMRs [104 MissDMRQtrs]. */
  qtrsUndetermined?: number;
  /** Effluent-limit exceedances (E90) in the last 3 years [105 CWPE90Cnt]. */
  effluentExceedances3yr?: number;
  /** Effluent-limit exceedances in the last 5 years [216 E90Exceeds5yr]. */
  effluentExceedances5yr?: number;
  /** Pollutants with exceedances in the last 5 years, comma separated [221 E90Pollutants5yr]. */
  exceedancePollutants5yr?: string | null;
  /** Informal enforcement actions (e.g. notices of violation) in the last 5 years [113 CWPInformalEnfActCount]. */
  informalActions?: number;
  /** ISO date of the last formal enforcement action (may be older than 5 years) [118 CWPDateLastFea]. */
  lastFormalActionDate?: string | null;
  /** Total assessed penalties in the last 5 years, USD [121 CWPTotalPenalties]. */
  penaltiesUsd?: number;
  /** Description of the event that put the permit in SNC, e.g. "SNC Effluent Violation Monthly Average" [192 CWPSNCEventDesc]. */
  sncEventDesc?: string | null;
  /** Violation in the last 4 official quarters or the current quarter (ECHO flag) [230 VioLastYear]. */
  violationLastYear?: boolean;
  /** Any violation in the last 3 years (ECHO flag) [204 ViolFlag]. */
  violationLast3yr?: boolean;
  /** Pounds discharged in the most recent complete calendar year, from DMRs [147 DMRPounds]. */
  dmrPoundsLastYear?: number | null;
  /** Toxic-weighted pound-equivalents discharged in the most recent complete calendar year [151 DMRTwpe]. */
  dmrToxicWeightedLastYear?: number | null;
  /** Permitted pollutants with the potential to contribute to impairment of the local water body [198 DMRImpairedPoll]. */
  impairingPollutants?: string | null;
  /**
   * Pollutants that both had effluent exceedances and match the receiving water's ATTAINS impairment causes [179 AttainsPssbleE90NPDESParams].
   * (Not described in ECHO's docs; semantics inferred from the column name and verified on WV/MA data to be a subset of the exceeded pollutants.)
   */
  impairingExceedancePollutants?: string | null;
  /** Reach Address Database (RAD) reach code of the receiving water [167 RadReachcode]. */
  radReachcode?: string | null;
  /** RAD 8-digit HUC and name of the receiving water [168 RadWBDHu8, 169 RadWBDHu8Name]. */
  radHuc8?: string | null;
  radHuc8Name?: string | null;
  /** RAD 12-digit HUC(s) with names, "code:name | code:name" [163 RadWBDHuc12s]. */
  radHuc12s?: string | null;
}

/** One row of EPA's Water Pollutant Loading Tool (annual load, one facility x outfall x parameter). */
export interface LoadRow {
  permit: string;
  facility: string;
  huc12: string | null;
  outfall: string;
  paramCode: string;
  param: string;
  lbs: number;
  allowableLbs: number | null;
  overLimitLbs: number | null;
  twf: number | null;
}

export interface DmrValue {
  period: string; // monitoring period end date, ISO
  stat: string; // e.g. "MO AVG"
  value: number | null;
  unit: string | null;
  limit: number | null;
  limitUnit: string | null;
  nodi: string | null; // "No Discharge" etc
  exceedPct: number | null;
  violation: boolean;
}

export interface DmrParameter {
  outfall: string;
  outfallType: string;
  code: string;
  name: string;
  location: string;
  values: DmrValue[];
  exceedances: number;
  latest: DmrValue | null;
}

export interface EffluentSummary {
  permit: string;
  start: string;
  end: string;
  parameters: DmrParameter[];
}

// ---------------------------------------------------------------- Upstream trace (contract shared by all modules)

export type RiskLevel = 'high' | 'elevated' | 'watch' | 'low' | 'unknown';

export interface RiskScore {
  score: number; // 0-100
  level: RiskLevel;
  reasons: string[]; // short human-readable factors, most important first
}

/** Where the user dropped the pin, snapped to the NHDPlus flow network (USGS NLDI). */
export interface PinPoint {
  lat: number;
  lng: number;
  comid: number;
  reachcode: string | null;
  waterName: string | null; // GNIS name of the reach if known
  huc12: string | null;
  huc12Name: string | null;
  huc8: string | null;
  huc8Name: string | null;
  state: string | null;
  /** Where the user actually clicked (lat/lng above are snapped onto the flowline). */
  inputLat?: number;
  inputLng?: number;
  /** Straight-line distance from the click to the snapped point, km. */
  snapDistanceKm?: number;
}

/** One NHDPlus flowline in the upstream network. coords are [lng, lat] pairs (GeoJSON order). */
export interface Flowline {
  comid: number;
  coords: [number, number][];
  lengthKm: number;
  /** Network distance from this flowline's downstream end to the pin, km. */
  distToPinKm: number;
  mainstem: boolean;
}

export interface UpstreamFacility extends Facility {
  comid: number | null;
  reachcode: string | null;
  measure: number | null;
  /** Network distance upstream of the pin, km (null if it could not be placed on the network). */
  riverKm: number | null;
  /** Rough travel time for a slug of water from the outfall to the pin, hours. */
  travelHours: number | null;
  onMainstem: boolean;
  risk: RiskScore;
  /** NLDI knows this permit id but ECHO returned no record for it (minimal record: name = id, compliance 'nodata'). */
  missingInEcho?: boolean;
  /** The ECHO lookup for this id failed (network/service error); fields are minimal like missingInEcho. */
  echoLookupFailed?: boolean;
  /** NLDI identifiers merged into this permit (e.g. outfall-suffixed ids "MA0003531001", "MA0003531002"). */
  nldiIds?: string[];
  /** The NLDI id of the outfall nearest the pin, which riverKm/travelHours refer to (may differ from the plant location). */
  nearestOutfallId?: string;
  /** [lng, lat] of that outfall on the river; lat/lng above are the facility (plant) location from ECHO. */
  outfallPoint?: [number, number];
}

export interface Gauge {
  id: string; // e.g. USGS-01104600
  name: string;
  comid: number | null;
  lat: number;
  lng: number;
  uri: string;
  riverKm: number | null;
  flowCfs: number | null;
  flowTime: string | null; // ISO
}

export interface TraceSummary {
  total: number;
  withViolations: number;
  snc: number;
  effluentExceedances: number;
  majors: number;
  nearestViolatorKm: number | null;
  highRisk: number;
  /** Permits currently in force or of unknown status (permitActive !== false). withViolations, snc, highRisk and
   * nearestViolatorKm count only these; total counts everything. */
  activeTotal?: number;
  /** Expired / terminated / not-needed permits (permitActive === false). */
  inactive?: number;
}

export interface UpstreamTrace {
  pin: PinPoint;
  distanceKm: number; // navigation limit used
  flowlines: Flowline[];
  basin: Feature | null; // upstream drainage polygon (simplified)
  facilities: UpstreamFacility[]; // sorted by risk level (high first), then nearest-first
  gauges: Gauge[];
  summary: TraceSummary;
  velocityMps: number; // assumed / measured stream velocity used for travelHours
  /** Where velocityMps came from, e.g. "NHDPlus EROM mean-annual velocity at the pin reach". */
  velocitySource?: string;
  generatedAt: string; // ISO
  sources: string[]; // human-readable provenance lines
  /** Non-fatal problems (e.g. basin polygon or an ECHO batch failed). Empty when everything loaded. */
  warnings?: string[];
  /** Wall-clock time per stage, ms. */
  timingsMs?: Partial<Record<TraceStage, number>>;
}

export type TraceStage = 'snap' | 'network' | 'facilities' | 'echo' | 'gauges' | 'score' | 'done';

export interface TraceOptions {
  distanceKm?: number; // default 50
  signal?: AbortSignal;
  onStage?(stage: TraceStage, detail?: string): void;
}
