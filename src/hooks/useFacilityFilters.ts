import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_FILTERS, applyFacilityFilters, type FacilityToggle } from '@/map/facilityFilters';
import type { UpstreamFacility } from '@/types';

const NONE: UpstreamFacility[] = [];

/** Filter state for the "Who's upstream" list, plus the derived rows and map ids. */
export function useFacilityFilters(facilities: UpstreamFacility[] | null) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showQuiet, setShowQuiet] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const list = facilities ?? NONE;
  const result = useMemo(() => applyFacilityFilters(list, filters), [list, filters]);

  const toggle = useCallback((key: FacilityToggle) => setFilters((f) => ({ ...f, [key]: !f[key] })), []);
  const setText = useCallback((text: string) => setFilters((f) => ({ ...f, text })), []);
  const toggleQuiet = useCallback(() => setShowQuiet((v) => !v), []);
  const toggleInactive = useCallback(() => setShowInactive((v) => !v), []);

  return { filters, toggle, setText, showQuiet, toggleQuiet, showInactive, toggleInactive, ...result };
}

export type FacilityFiltersModel = ReturnType<typeof useFacilityFilters>;
