/**
 * Design tokens. Palette follows the Realtime Colors convention
 * (text / background / primary / secondary / accent) plus semantic risk colors.
 * Every screen and component reads from here; never hardcode colors elsewhere.
 */
import type { ComplianceClass, Facility, PermitGroup, RiskLevel } from './types';

export const C = {
  // Realtime Colors roles
  text: '#0b1720',
  background: '#f6f9fb',
  primary: '#0b6bcb', // river blue
  secondary: '#0ea5a3', // teal
  accent: '#ff6b3d', // coral: alerts, CTAs

  // Surfaces & lines
  surface: '#ffffff',
  surfaceAlt: '#eef3f7',
  line: '#dfe7ee',
  lineStrong: '#c4d1db',
  muted: '#546675',
  faint: '#8a9aa7',
  inverse: '#f6f9fb',
  ink: '#0b1720', // legacy alias for text
  card: '#ffffff', // legacy alias for surface
  bg: '#f6f9fb', // legacy alias for background
  accentSoft: '#e6f2fc',

  // Dark hero / map chrome
  navy: '#07172a',
  navy2: '#0d2440',

  // Gradients (Radiant-style hero blobs, gradient text)
  gradient: ['#0ea5a3', '#0b6bcb', '#6d4ce3'] as const,
  gradientWarm: ['#ff6b3d', '#ff3d81'] as const,
} as const;

export const FONT = {
  sans: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  display: '"Fraunces", "Iowan Old Style", Georgia, serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
} as const;

export const RADIUS = { sm: 8, md: 12, lg: 18, xl: 28, pill: 999 } as const;
export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 40, section: 96 } as const;
export const SHADOW = {
  card: { shadowColor: '#0b1720', shadowOpacity: 0.06, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  float: { shadowColor: '#0b1720', shadowOpacity: 0.14, shadowRadius: 32, shadowOffset: { width: 0, height: 16 } },
} as const;

/** Risk levels for an upstream discharger (see src/lib/risk.ts). */
export const RISK: Record<RiskLevel, { color: string; soft: string; label: string; rank: number }> = {
  high: { color: '#c81e1e', soft: '#fdecec', label: 'High risk', rank: 0 },
  elevated: { color: '#e8590c', soft: '#fff0e6', label: 'Elevated', rank: 1 },
  watch: { color: '#c99700', soft: '#fff8dd', label: 'Watch', rank: 2 },
  low: { color: '#1c7ed6', soft: '#e6f2fc', label: 'Low', rank: 3 },
  unknown: { color: '#8a969f', soft: '#eef1f4', label: 'No monitoring', rank: 4 },
};

export const COMPLIANCE: Record<ComplianceClass, { color: string; label: string; short: string; rank: number }> = {
  snc: { color: '#c81e1e', label: 'Significant noncompliance', short: 'SNC', rank: 0 },
  effluent: { color: '#e8590c', label: 'Effluent limit exceeded', short: 'Exceedance', rank: 1 },
  violation: { color: '#c99700', label: 'Other violation (reporting, schedule)', short: 'Violation', rank: 2 },
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

export const fmtMiles = (km: number | null) => (km === null ? '—' : `${(km * 0.621371).toFixed(km * 0.621371 < 10 ? 1 : 0)} mi`);

export const fmtHours = (h: number | null) => {
  if (h === null) return '—';
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(h < 10 ? 1 : 0)} h`;
  return `${(h / 24).toFixed(1)} days`;
};
