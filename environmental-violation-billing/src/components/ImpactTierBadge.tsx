import type { ImpactTier } from '@/types/envirobill-impact';

const styles: Record<ImpactTier, string> = {
  Low: 'bg-sky-500/15 text-sky-300 ring-sky-400/30',
  Moderate: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
  Severe: 'bg-rose-500/20 text-rose-300 ring-rose-400/40',
};

export function ImpactTierBadge({ tier }: { tier: ImpactTier }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ${styles[tier]}`}
    >
      {tier} impact
    </span>
  );
}
