import type { ComplianceClass, Facility, PermitGroup } from './types';

export const C = {
  bg: '#f6f8fa',
  card: '#ffffff',
  ink: '#16222b',
  muted: '#5c6b77',
  line: '#dde3e8',
  accent: '#0b7285',
  accentSoft: '#e3f4f7',
};

export const COMPLIANCE: Record<ComplianceClass, { color: string; label: string; short: string; rank: number }> = {
  snc: { color: '#a61e1e', label: 'Significant noncompliance', short: 'SNC', rank: 0 },
  effluent: { color: '#e8590c', label: 'Effluent limit exceeded', short: 'Exceedance', rank: 1 },
  violation: { color: '#e0a100', label: 'Other violation (reporting, schedule)', short: 'Violation', rank: 2 },
  ok: { color: '#1c7ed6', label: 'No violations, reports DMRs', short: 'Compliant', rank: 3 },
  nodata: { color: '#8a969f', label: 'No DMR monitoring (general / stormwater)', short: 'No DMRs', rank: 4 },
};

export const GROUPS: Record<PermitGroup, string> = {
  major: 'Major',
  individual: 'Individual (minor)',
  general: 'General / stormwater',
  pretreatment: 'Industrial users → sewer',
};

/** Marker radius: scaled by design flow where known, otherwise by permit class. */
export function markerRadius(f: Facility): number {
  if (f.designFlowMgd && f.designFlowMgd > 0) {
    return Math.min(18, 4 + 3.2 * Math.log10(1 + f.designFlowMgd * 10));
  }
  return f.major ? 7 : f.group === 'individual' ? 5 : 3.5;
}

export const fmtLbs = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M lb` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k lb` : `${Math.round(n)} lb`;

export const fmtNum = (n: number | null) =>
  n === null ? '—' : Math.abs(n) >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : String(+n.toPrecision(4));
