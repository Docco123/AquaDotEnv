import { RISK } from '@/theme';
import type { Facility, UpstreamFacility } from '@/types';

export interface FacilityFilterState {
  violationsOnly: boolean;
  majorsOnly: boolean;
  /** Collapse general/stormwater permits that have no monitoring data. */
  hideQuiet: boolean;
  text: string;
}

export type FacilityToggle = 'violationsOnly' | 'majorsOnly' | 'hideQuiet';

export const DEFAULT_FILTERS: FacilityFilterState = {
  violationsOnly: false,
  majorsOnly: false,
  hideQuiet: true,
  text: '',
};

export interface FilteredFacilities {
  /** Rows for the list, most important first. */
  shown: UpstreamFacility[];
  /** Active general/stormwater permits with no monitoring, collapsed into one summary row. */
  quiet: UpstreamFacility[];
  /** Expired / terminated permits (ECHO status other than EFF/ADC), collapsed into their own row. */
  inactive: UpstreamFacility[];
  /** Ids to draw on the map (shown + quiet + inactive), or null when nothing is filtered out. */
  mapIds: string[] | null;
  total: number;
}

export const hasViolation = (f: Facility) =>
  f.compliance === 'snc' || f.compliance === 'effluent' || f.compliance === 'violation' || f.effluentExceedances1yr > 0;

/** No longer in force per ECHO (expired, terminated, …). Unknown status counts as active. */
export const isInactivePermit = (f: Facility) => f.permitActive === false;

/** An active general/stormwater permit with no DMRs and nothing on its record. */
export const isQuietPermit = (f: Facility) =>
  !isInactivePermit(f) && f.group === 'general' && !f.hasDmrs && !hasViolation(f);

/** Drawn smaller and paler on the map. */
export const isBackgroundPermit = (f: Facility) => isInactivePermit(f) || isQuietPermit(f);

/** Risk level first (high → unknown), then nearest upstream; unplaced facilities last. */
export function sortByRisk(list: readonly UpstreamFacility[]): UpstreamFacility[] {
  const km = (f: UpstreamFacility) => f.riverKm ?? Number.POSITIVE_INFINITY;
  return [...list].sort((a, b) => RISK[a.risk.level].rank - RISK[b.risk.level].rank || km(a) - km(b));
}

function matchesText(f: Facility, needle: string): boolean {
  if (!needle) return true;
  const haystack = [f.name, f.id, f.city, f.receivingWater ?? ''].join(' ').toLowerCase();
  return haystack.includes(needle);
}

function passes(f: UpstreamFacility, filters: FacilityFilterState, needle: string): boolean {
  if (filters.violationsOnly && !hasViolation(f)) return false;
  if (filters.majorsOnly && !f.major) return false;
  return matchesText(f, needle);
}

export function applyFacilityFilters(all: readonly UpstreamFacility[], filters: FacilityFilterState): FilteredFacilities {
  const needle = filters.text.trim().toLowerCase();
  const matching = sortByRisk(all.filter((f) => passes(f, filters, needle)));
  const inactive = matching.filter(isInactivePermit);
  const active = matching.filter((f) => !isInactivePermit(f));
  const quiet = filters.hideQuiet ? active.filter(isQuietPermit) : [];
  const shown = filters.hideQuiet ? active.filter((f) => !isQuietPermit(f)) : active;
  const mapIds = matching.length === all.length ? null : matching.map((f) => f.id);
  return { shown, quiet, inactive, mapIds, total: all.length };
}
