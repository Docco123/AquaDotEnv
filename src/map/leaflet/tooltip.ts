import { RISK, fmtHours, fmtMiles } from '@/theme';
import type { UpstreamFacility } from '@/types';

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ENTITIES[c] ?? c);

function upstreamLine(f: UpstreamFacility): string {
  if (f.riverKm === null) return 'Not on the traced network';
  const travel = f.travelHours === null ? '' : ` · ~${fmtHours(f.travelHours)} travel`;
  return `${fmtMiles(f.riverKm)} upstream${travel}`;
}

/** Hover card for a facility marker: name, permit id, risk label, distance and travel time. */
export function facilityTooltip(f: UpstreamFacility): string {
  const risk = RISK[f.risk.level];
  return [
    `<div class="uw-tip-name">${escapeHtml(f.name)}</div>`,
    `<div class="uw-tip-meta">${escapeHtml(f.id)} · <span class="uw-tip-risk" style="color:${risk.color}">${risk.label}</span></div>`,
    `<div class="uw-tip-meta">${upstreamLine(f)}</div>`,
    f.permitActive === false ? `<div class="uw-tip-meta">Permit ${escapeHtml(f.permitStatus ?? 'not in force')}</div>` : '',
  ].join('');
}
