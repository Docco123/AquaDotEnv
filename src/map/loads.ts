import type { LoadRow } from '@/types';

export interface LoadTotal {
  param: string;
  lbs: number;
  overLimitLbs: number;
}

/** Annual pounds per pollutant for one permit, largest first. */
export function summarizeLoads(rows: readonly LoadRow[] | null, permitId: string, limit = 10): LoadTotal[] {
  if (!rows) return [];
  const byParam = new Map<string, LoadTotal>();
  for (const r of rows) {
    if (r.permit !== permitId) continue;
    const t = byParam.get(r.param) ?? { param: r.param, lbs: 0, overLimitLbs: 0 };
    t.lbs += r.lbs;
    t.overLimitLbs += r.overLimitLbs ?? 0;
    byParam.set(r.param, t);
  }
  return [...byParam.values()].sort((a, b) => b.lbs - a.lbs).slice(0, limit);
}
