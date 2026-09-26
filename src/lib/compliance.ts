/**
 * Compliance classification from ECHO CWA facility fields.
 *
 * Verified against live ECHO data (1,021 major permits in WV/IL/OH/PA, Sept 2026):
 *  - CWP13qtrsComplHistory is oldest-first. Chars 0-11 are the 12 official QNCR quarters, char 12 is the current
 *    (draft) quarter. For terminated permits ECHO truncates the string at the termination quarter, so short strings
 *    must be padded at the END (padding at the start misaligns every quarter).
 *  - CWPQtrsWithSNC == count of "S" in chars 0-11; CWPQtrsWithNC == min(12, count of "V"/"S" in all 13 chars).
 *  - VioLastYear == any "V"/"S" in chars 8-12 (the last 4 official quarters + the current quarter).
 *  - CWPSNCStatus is non-null exactly when char 11 or 12 is "S" (i.e. the permit is in SNC now).
 */
import type { ComplianceClass } from '../types';

export const QTR_WINDOW = 13;
/** Chars 8..12 = last 4 official quarters + current quarter: the same window ECHO uses for VioLastYear. */
const RECENT_FROM = 8;
const NOT_IN_FORCE = '-';
/** CWPVioStatus values that do not describe an open violation. */
const CLOSED_VIO_STATUS = new Set(['resolved', 'resolved - pending', 'undetermined']);

/** Always 13 chars, oldest first; quarters after a permit ended are "-". */
export function normalizeQtrHistory(raw: unknown): string {
  const s = String(raw ?? '').toUpperCase().slice(0, QTR_WINDOW);
  return s.padEnd(QTR_WINDOW, NOT_IN_FORCE);
}

export interface ComplianceInput {
  qtrHistory: string; // normalized
  sncStatus: string | null;
  vioStatus: string | null;
  effluentExceedances1yr: number;
  violationLastYear: boolean;
  hasMonitoring: boolean; // effluent charts or a DMR received
}

const recentQuarters = (h: string) => h.slice(RECENT_FROM, QTR_WINDOW);

function hasOpenVioStatus(vioStatus: string | null): boolean {
  return !!vioStatus && !CLOSED_VIO_STATUS.has(vioStatus.trim().toLowerCase());
}

/**
 * Rule (first match wins; "past year" = the last 4 official quarters + current quarter):
 *  1. snc       - in SNC now (CWPSNCStatus set) or an "S" quarter in the past year.
 *  2. effluent  - at least one effluent-limit exceedance in the last 12 months (E90Exceeds1yr > 0). Checked
 *                 independently of the history string: ECHO has permits with exceedances and a clean history.
 *  3. violation - any other violation in the past year: VioLastYear flag, a "V" quarter, or an open RNC status
 *                 (CWPVioStatus other than Resolved / Resolved - Pending / Undetermined).
 *  4. ok        - no violations and the permit reports DMRs (EffChartsFlag = Y or a DMR was received).
 *  5. nodata    - nothing to judge (typically general / stormwater permits that do not file DMRs).
 * CWPQtrsWithNC / CWPQtrsWithSNC are 3-year counts; they feed the risk score, not this 1-year class.
 */
export function classifyCompliance(c: ComplianceInput): ComplianceClass {
  const recent = recentQuarters(c.qtrHistory);
  if (c.sncStatus || recent.includes('S')) return 'snc';
  if (c.effluentExceedances1yr > 0) return 'effluent';
  if (c.violationLastYear || recent.includes('V') || hasOpenVioStatus(c.vioStatus)) return 'violation';
  return c.hasMonitoring ? 'ok' : 'nodata';
}

/** EFF = Effective, ADC = Administratively Continued: the permit currently authorizes discharge. */
export const isActivePermitStatus = (code: string | null | undefined) => code === 'EFF' || code === 'ADC';
