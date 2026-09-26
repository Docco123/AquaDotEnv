import { ageInDays } from '@/lib/dates';

/** Days elapsed measured against the seeded demo "today" — never the system clock. */
export function AgeBadge({ iso, label }: { iso: string; label: string }) {
  const days = ageInDays(iso);
  const tone =
    days >= 30
      ? 'bg-rose-500/15 text-rose-300 ring-rose-400/30'
      : days >= 14
        ? 'bg-amber-500/15 text-amber-300 ring-amber-400/30'
        : 'bg-white/5 text-slate-300 ring-white/10';

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${tone}`}>
      {days} {days === 1 ? 'day' : 'days'} {label}
    </span>
  );
}
