/**
 * Deterministic 0-100 risk score for an upstream discharger, from ECHO compliance data plus position on the river.
 *
 * Points (capped per factor, total capped at 100):
 *   Currently in significant noncompliance (CWPSNCStatus)             +35
 *   SNC quarters in last 12 (CWPQtrsWithSNC)                           +4 each, max 16
 *   Violation quarters in last 12 (CWPQtrsWithNC)                      +1.5 each, max 12
 *   Effluent exceedances, last 12 months (E90Exceeds1yr)              6 * log2(1 + n), max 20
 *   Undetermined / missed-DMR quarters (MissDMRQtrs)                   +2 each, max 8
 *   Formal enforcement actions, 5 yr (CWPFormalEaCnt)                  +4 each, max 12
 *   Penalties, 5 yr (CWPTotalPenalties)                                +3 if any, +6 if >= $100k
 *   Expired/terminated permit but DMRs received in the last year       +8
 *   Size: major +8, POTW +4, CSO outfalls +4, design flow 2.5*log10(1 + 10*MGD) max 8
 *   Exceeded pollutants that impair the receiving water (ATTAINS)      +8, else permitted impairing pollutants +4
 *   Proximity: 12 * (1 - riverKm / distanceKm), 0 when unknown
 *   Discharges to the main stem                                        +3
 * Levels: high >= 70, elevated >= 45, watch >= 20, low otherwise; 'unknown' when there is no monitoring data at all
 * (no DMRs, no violation or enforcement history, general/unknown permit), or ECHO has no record.
 * Permits no longer in force (not EFF/ADC) with no DMR in the last year score half: they are unlikely to be discharging.
 */
import type { Facility, RiskLevel, RiskScore, TraceSummary, UpstreamFacility } from '../types';

export const RISK_THRESHOLDS = { high: 70, elevated: 45, watch: 20 } as const;
export const RISK_ORDER: RiskLevel[] = ['high', 'elevated', 'watch', 'low', 'unknown'];

const W = {
  currentSnc: 35,
  sncQuarter: 4, sncQuarterMax: 16,
  ncQuarter: 1.5, ncQuarterMax: 12,
  exceedanceScale: 6, exceedanceMax: 20,
  undeterminedQuarter: 2, undeterminedMax: 8,
  formalAction: 4, formalActionMax: 12,
  penalty: 3, bigPenalty: 6, bigPenaltyUsd: 100_000,
  lapsedButDischarging: 8,
  major: 8, potw: 4, cso: 4, flowScale: 2.5, flowMax: 8,
  impairingExceedance: 8, impairingPermitted: 4,
  proximity: 12,
  mainstem: 3,
} as const;
const INACTIVE_FACTOR = 0.5;
const RECENT_DMR_DAYS = 365;
const DAY_MS = 86_400_000;

export interface RiskContext {
  riverKm: number | null;
  distanceKm: number;
  onMainstem?: boolean;
}

type Factor = [points: number, reason: string];

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function dmrWithinYear(f: Facility, now: number): boolean {
  const t = f.lastDmrDate ? Date.parse(f.lastDmrDate) : NaN;
  return Number.isFinite(t) && now - t <= RECENT_DMR_DAYS * DAY_MS;
}

function complianceFactors(f: Facility): Factor[] {
  const out: Factor[] = [];
  if (f.sncStatus) out.push([W.currentSnc, `In significant noncompliance now (${f.sncStatus})`]);
  const snc = f.qtrsWithSnc ?? 0;
  if (snc > 0) out.push([Math.min(W.sncQuarterMax, snc * W.sncQuarter), `Significant noncompliance in ${snc} of the last 12 quarters`]);
  const nc = f.qtrsWithNc ?? 0;
  if (nc > 0) out.push([Math.min(W.ncQuarterMax, nc * W.ncQuarter), `Violations in ${nc} of the last 12 quarters`]);
  const e = f.effluentExceedances1yr;
  if (e > 0) {
    const what = f.exceedancePollutants1yr ? ` (${f.exceedancePollutants1yr})` : '';
    out.push([Math.min(W.exceedanceMax, W.exceedanceScale * Math.log2(1 + e)), `${plural(e, 'effluent-limit exceedance')} in the past year${what}`]);
  }
  const und = f.qtrsUndetermined ?? 0;
  if (und > 0) out.push([Math.min(W.undeterminedMax, und * W.undeterminedQuarter), `Compliance undetermined for ${plural(und, 'quarter')} (missing reports)`]);
  return out;
}

function enforcementFactors(f: Facility, now: number): Factor[] {
  const out: Factor[] = [];
  if (f.formalActions > 0) out.push([Math.min(W.formalActionMax, f.formalActions * W.formalAction), `${plural(f.formalActions, 'formal enforcement action')} in 5 years`]);
  const usd = f.penaltiesUsd ?? 0;
  if (usd > 0) out.push([usd >= W.bigPenaltyUsd ? W.bigPenalty : W.penalty, `$${usd.toLocaleString('en-US')} in penalties (5 yr)`]);
  if (f.permitActive === false && dmrWithinYear(f, now) && /expired|terminated/i.test(f.permitStatus ?? '')) {
    out.push([W.lapsedButDischarging, `Permit ${f.permitStatus?.toLowerCase()} but still filing discharge reports`]);
  }
  return out;
}

function sizeFactors(f: Facility): Factor[] {
  const out: Factor[] = [];
  if (f.major) out.push([W.major, 'Major discharger']);
  if (f.potw) out.push([W.potw, 'Sewage treatment plant']);
  if (f.cso) out.push([W.cso, 'Has combined sewer overflow outfalls']);
  if (f.designFlowMgd && f.designFlowMgd > 0) {
    out.push([Math.min(W.flowMax, W.flowScale * Math.log10(1 + 10 * f.designFlowMgd)), `Design flow ${f.designFlowMgd} million gal/day`]);
  }
  return out;
}

function receivingWaterFactors(f: Facility): Factor[] {
  if (f.impairingExceedancePollutants) return [[W.impairingExceedance, `Exceeded limits for pollutants impairing this water (${f.impairingExceedancePollutants})`]];
  if (f.impairingPollutants) return [[W.impairingPermitted, 'Discharges pollutants the receiving water is impaired by']];
  return [];
}

function positionFactors(ctx: RiskContext): Factor[] {
  const out: Factor[] = [];
  if (ctx.riverKm !== null && ctx.distanceKm > 0) {
    const closeness = Math.max(0, 1 - ctx.riverKm / ctx.distanceKm);
    if (closeness > 0) out.push([W.proximity * closeness, `${ctx.riverKm.toFixed(1)} km upstream`]);
  }
  if (ctx.onMainstem) out.push([W.mainstem, 'On the main stem']);
  return out;
}

function hasNoMonitoring(f: Facility): boolean {
  const history = (f.qtrsWithNc ?? 0) + (f.qtrsWithSnc ?? 0) + f.effluentExceedances1yr + (f.effluentExceedances3yr ?? 0) + f.formalActions;
  return !f.hasDmrs && !f.lastDmrDate && history === 0 && !f.sncStatus && !f.major && f.group !== 'individual';
}

function levelFor(score: number): RiskLevel {
  if (score >= RISK_THRESHOLDS.high) return 'high';
  if (score >= RISK_THRESHOLDS.elevated) return 'elevated';
  if (score >= RISK_THRESHOLDS.watch) return 'watch';
  return 'low';
}

export function scoreRisk(f: Facility & { missingInEcho?: boolean }, ctx: RiskContext, now = Date.now()): RiskScore {
  const factors = [...complianceFactors(f), ...enforcementFactors(f, now), ...receivingWaterFactors(f), ...sizeFactors(f), ...positionFactors(ctx)];
  let score = factors.reduce((sum, [p]) => sum + p, 0);
  const reasons = factors.filter(([p]) => p > 0).sort((a, b) => b[0] - a[0]).map(([, r]) => r);
  if (f.permitActive === false && !dmrWithinYear(f, now)) {
    score *= INACTIVE_FACTOR;
    reasons.push(`Permit ${f.permitStatus?.toLowerCase() ?? 'not in force'}; likely not discharging`);
  }
  score = Math.round(Math.min(100, score));
  if (f.missingInEcho) return { score, level: 'unknown', reasons: ['No EPA ECHO record for this permit id', ...reasons] };
  if (hasNoMonitoring(f)) return { score, level: 'unknown', reasons: ['No discharge monitoring data (general / stormwater permit)', ...reasons] };
  return { score, level: levelFor(score), reasons };
}

/** Sort: risk level (high first), then nearest to the pin, then score. */
export function compareByRisk(a: UpstreamFacility, b: UpstreamFacility): number {
  const byLevel = RISK_ORDER.indexOf(a.risk.level) - RISK_ORDER.indexOf(b.risk.level);
  if (byLevel) return byLevel;
  const ak = a.riverKm ?? Infinity;
  const bk = b.riverKm ?? Infinity;
  return ak - bk || b.risk.score - a.risk.score;
}

const hasViolation = (f: Facility) => f.compliance === 'snc' || f.compliance === 'effluent' || f.compliance === 'violation';
/** Unknown status counts as active: better to surface a violation than hide it. */
const isActive = (f: Facility) => f.permitActive !== false;

/**
 * Headline counts. withViolations, snc, highRisk and nearestViolatorKm use active permits only, so an expired permit's
 * old violations do not headline; total counts every permit and inactive counts the ones no longer in force.
 */
export function summarize(facilities: UpstreamFacility[]): TraceSummary {
  const active = facilities.filter(isActive);
  const violators = active.filter(hasViolation);
  const violatorKms = violators.map((f) => f.riverKm).filter((k): k is number => k !== null);
  return {
    total: facilities.length,
    withViolations: violators.length,
    snc: active.filter((f) => f.compliance === 'snc').length,
    effluentExceedances: active.filter((f) => f.effluentExceedances1yr > 0).length,
    majors: facilities.filter((f) => f.major).length,
    nearestViolatorKm: violatorKms.length ? Math.min(...violatorKms) : null,
    highRisk: active.filter((f) => f.risk.level === 'high').length,
    activeTotal: active.length,
    inactive: facilities.length - active.length,
  };
}
