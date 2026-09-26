import { useMemo } from 'react';
import { fetchEffluent, fetchLoads } from '@/api';
import { summarizeLoads } from '@/map/loads';
import { useAsyncResource } from './useAsyncResource';

/** Loading Tool data is annual; the last full calendar year is the most complete. */
export const LOADS_YEAR = new Date().getFullYear() - 1;

/** DMR values for one permit over the last 12 months. */
export function useEffluent(permitId: string) {
  return useAsyncResource(permitId, (signal) => fetchEffluent(permitId, signal));
}

/** Annual pollutant loads for one permit, from its HUC-8's Loading Tool rows (fetched lazily). */
export function useFacilityLoads(huc8: string | null, permitId: string) {
  const res = useAsyncResource(huc8 ? `${huc8}:${LOADS_YEAR}` : null, (signal) =>
    fetchLoads(huc8 ?? '', LOADS_YEAR, signal),
  );
  const totals = useMemo(() => summarizeLoads(res.data, permitId), [res.data, permitId]);
  return { ...res, totals, year: LOADS_YEAR };
}
