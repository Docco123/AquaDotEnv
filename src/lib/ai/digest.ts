/**
 * Compact, model-friendly JSON digests of an upstream trace and of one facility.
 * Client-safe pure TS (no React Native, no Node): the Explainer builds these in the browser
 * and POSTs them to /api/explain, and the smoke test builds them in Node.
 * Distances are converted to miles and velocities to mph/ft·s⁻¹ here so the model never does unit math.
 */
import { COMPLIANCE, GROUPS, fmtHours } from '@/theme';
import type { ComplianceClass, Gauge, RiskLevel, UpstreamFacility, UpstreamTrace } from '@/types';

export const DIGEST_TOP_FACILITIES = 25;
/** Expired/terminated permits are listed only if they violated recently, and at most this many. */
export const DIGEST_MAX_INACTIVE_OF_NOTE = 3;
const MAX_GAUGES = 5;
const KM_TO_MI = 0.621371;
const MPS_TO_MPH = 2.23694;
const MPS_TO_FTPS = 3.28084;

export interface RiskDigest {
  score: number;
  level: RiskLevel;
  reasons: string[];
}

/** One permit as it appears in the trace digest. */
export interface FacilitySummaryDigest {
  id: string;
  name: string;
  city: string;
  state: string;
  permitType: string;
  permitClass: string;
  major: boolean;
  potw: boolean;
  riverMiles: number | null;
  travelHours: number | null;
  travelTime: string | null;
  onMainstem: boolean;
  risk: RiskDigest;
  compliance: ComplianceClass;
  complianceMeaning: string;
  sncStatus: string | null;
  effluentExceedances1yr: number;
  exceedancePollutants1yr: string | null;
  pollutantsWithViolation: string | null;
  quartersInNoncompliance: number;
  quartersInSnc: number;
  quartersReported: number;
  missedDmrQuarters: number | null;
  formalActions: number;
  penalties: string | null;
  /** False when ECHO says the permit is expired or terminated; true when in force or unknown. */
  permitActive: boolean;
  permitStatus: string | null;
  submitsMonitoringReports: boolean;
}

/** Everything known about one permit (for kind 'facility'). */
export interface FacilityDigest extends FacilitySummaryDigest {
  registryId: string;
  lat: number;
  lng: number;
  receivingWater: string | null;
  huc12: string | null;
  huc12Name: string | null;
  designFlowMgd: number | null;
  combinedSewerOverflow: boolean;
  permitExpires: string | null;
  lastDmrDate: string | null;
  quarterHistory: string;
  quarterHistoryLegend: string;
}

export interface GaugeDigest {
  id: string;
  name: string;
  riverMiles: number | null;
  flowCfs: number | null;
  flowTime: string | null;
}

export interface TraceDigest {
  place: {
    waterName: string | null;
    huc12Name: string | null;
    huc8Name: string | null;
    state: string | null;
    lat: number;
    lng: number;
  };
  searchedMilesUpstream: number;
  velocity: { milesPerHour: number; feetPerSecond: number; note: string };
  /** Every count here is ACTIVE permits only; expired/terminated permits are counted in inactivePermits. */
  summary: {
    countsNote: string;
    activePermitsUpstream: number;
    withViolations: number;
    inSignificantNoncompliance: number;
    withEffluentExceedances: number;
    majors: number;
    highRisk: number;
    nearestViolatorMiles: number | null;
    inactivePermits: number;
  };
  gauges: GaugeDigest[];
  /** Active permits only, highest risk first. */
  facilities: FacilitySummaryDigest[];
  /** Expired/terminated permits with current SNC or exceedances in the last year (at most 3). */
  inactivePermitsOfNote: FacilitySummaryDigest[];
  omitted: { count: number; byRiskLevel: Partial<Record<RiskLevel, number>>; note: string };
  generatedAt: string;
  sources: string[];
}

export interface TraceDigestOptions {
  maxFacilities?: number;
}

// ---------------------------------------------------------------- helpers

const round = (n: number, digits = 1) => Math.round(n * 10 ** digits) / 10 ** digits;
const toMiles = (km: number | null) => (km === null ? null : round(km * KM_TO_MI));

/** Unknown status counts as active (same rule as the data layer's summary). */
export const isActivePermit = (f: UpstreamFacility) => f.permitActive !== false;

/** Current SNC or any effluent-limit exceedance in the last year. */
const violatedRecently = (f: UpstreamFacility) => !!f.sncStatus || f.effluentExceedances1yr > 0;

function statusLabel(f: UpstreamFacility): string | null {
  if (f.permitStatus) return f.permitStatus;
  return isActivePermit(f) ? null : 'Expired or terminated';
}

function countQuarters(history: string, codes: string): number {
  return history.split('').filter((c) => codes.includes(c)).length;
}

/** Highest risk first; ties broken by distance (nearest first, unplaced last). */
export function byRiskThenDistance(a: UpstreamFacility, b: UpstreamFacility): number {
  if (b.risk.score !== a.risk.score) return b.risk.score - a.risk.score;
  return (a.riverKm ?? Infinity) - (b.riverKm ?? Infinity);
}

// ---------------------------------------------------------------- builders

export function buildFacilitySummaryDigest(f: UpstreamFacility): FacilitySummaryDigest {
  const history = f.qtrHistory ?? '';
  return {
    id: f.id,
    name: f.name,
    city: f.city,
    state: f.state,
    permitType: f.permitType,
    permitClass: GROUPS[f.group],
    major: f.major,
    potw: f.potw,
    riverMiles: toMiles(f.riverKm),
    travelHours: f.travelHours === null ? null : round(f.travelHours),
    travelTime: f.travelHours === null ? null : fmtHours(f.travelHours),
    onMainstem: f.onMainstem,
    risk: { score: Math.round(f.risk.score), level: f.risk.level, reasons: f.risk.reasons.slice(0, 4) },
    compliance: f.compliance,
    complianceMeaning: COMPLIANCE[f.compliance].label,
    sncStatus: f.sncStatus,
    effluentExceedances1yr: f.effluentExceedances1yr,
    exceedancePollutants1yr: f.exceedancePollutants1yr,
    pollutantsWithViolation: f.pollWithViolation,
    quartersInNoncompliance: countQuarters(history, 'VSE'),
    quartersInSnc: countQuarters(history, 'S'),
    quartersReported: history.length,
    missedDmrQuarters: f.qtrsUndetermined ?? null,
    formalActions: f.formalActions,
    penalties: f.penalties,
    permitActive: isActivePermit(f),
    permitStatus: statusLabel(f),
    submitsMonitoringReports: f.hasDmrs,
  };
}

export function buildFacilityDigest(f: UpstreamFacility): FacilityDigest {
  return {
    ...buildFacilitySummaryDigest(f),
    registryId: f.registryId,
    lat: round(f.lat, 4),
    lng: round(f.lng, 4),
    receivingWater: f.receivingWater,
    huc12: f.huc12,
    huc12Name: f.huc12Name,
    designFlowMgd: f.designFlowMgd,
    combinedSewerOverflow: f.cso,
    permitExpires: f.permitExpires ?? null,
    lastDmrDate: f.lastDmrDate,
    quarterHistory: f.qtrHistory,
    quarterHistoryLegend: 'One character per quarter, oldest first: _ = no violation, V = violation, E = effluent violation, S = significant noncompliance.',
  };
}

function buildGaugeDigest(g: Gauge): GaugeDigest {
  return { id: g.id, name: g.name, riverMiles: toMiles(g.riverKm), flowCfs: g.flowCfs, flowTime: g.flowTime };
}

function countByLevel(facilities: UpstreamFacility[]): Partial<Record<RiskLevel, number>> {
  const counts: Partial<Record<RiskLevel, number>> = {};
  for (const f of facilities) counts[f.risk.level] = (counts[f.risk.level] ?? 0) + 1;
  return counts;
}

export function buildTraceDigest(trace: UpstreamTrace, options: TraceDigestOptions = {}): TraceDigest {
  const limit = options.maxFacilities ?? DIGEST_TOP_FACILITIES;
  const active = trace.facilities.filter(isActivePermit).sort(byRiskThenDistance);
  const inactive = trace.facilities.filter((f) => !isActivePermit(f));
  const inactiveOfNote = inactive.filter(violatedRecently).sort(byRiskThenDistance).slice(0, DIGEST_MAX_INACTIVE_OF_NOTE);
  const shown = active.slice(0, limit);
  const omitted = active.slice(limit);
  const nearestGauges = [...trace.gauges]
    .sort((a, b) => (a.riverKm ?? Infinity) - (b.riverKm ?? Infinity))
    .slice(0, MAX_GAUGES);
  const { pin, summary } = trace;

  return {
    place: {
      waterName: pin.waterName,
      huc12Name: pin.huc12Name,
      huc8Name: pin.huc8Name,
      state: pin.state,
      lat: round(pin.lat, 4),
      lng: round(pin.lng, 4),
    },
    searchedMilesUpstream: round(trace.distanceKm * KM_TO_MI, 0),
    velocity: {
      milesPerHour: round(trace.velocityMps * MPS_TO_MPH),
      feetPerSecond: round(trace.velocityMps * MPS_TO_FTPS),
      note: 'Travel times assume water moves at this constant speed; real speed changes with flow, dams and weather.',
    },
    summary: {
      countsNote:
        'All counts are ACTIVE permits (in force or administratively continued). Expired or terminated permits are excluded and counted only in inactivePermits.',
      activePermitsUpstream: summary.activeTotal ?? active.length,
      withViolations: summary.withViolations,
      inSignificantNoncompliance: summary.snc,
      withEffluentExceedances: summary.effluentExceedances,
      majors: active.filter((f) => f.major).length,
      highRisk: summary.highRisk,
      nearestViolatorMiles: toMiles(summary.nearestViolatorKm),
      inactivePermits: summary.inactive ?? inactive.length,
    },
    gauges: nearestGauges.map(buildGaugeDigest),
    facilities: shown.map(buildFacilitySummaryDigest),
    inactivePermitsOfNote: inactiveOfNote.map(buildFacilitySummaryDigest),
    omitted: {
      count: omitted.length,
      byRiskLevel: countByLevel(omitted),
      note: 'Lower-risk ACTIVE permits left out of this list; many are general stormwater permits with no monitoring data.',
    },
    generatedAt: trace.generatedAt,
    sources: trace.sources.slice(0, 6),
  };
}
