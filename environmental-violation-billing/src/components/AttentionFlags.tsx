import type { AttentionFlag } from '@/types/envirobill-ui';

const labels: Record<AttentionFlag, string> = {
  high_severity: 'High severity',
  amount_overridden: 'Amount overridden',
  repeat_location: 'Repeat location',
};

const styles: Record<AttentionFlag, string> = {
  high_severity: 'bg-rose-500/15 text-rose-300 ring-rose-400/30',
  amount_overridden: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
  repeat_location: 'bg-violet-500/15 text-violet-300 ring-violet-400/30',
};

export function AttentionFlags({ flags }: { flags: AttentionFlag[] }) {
  if (flags.length === 0) {
    return <span className="text-sm text-slate-500">Routine</span>;
  }

  return (
    <span className="flex flex-wrap gap-2">
      {flags.map((flag) => (
        <span
          key={flag}
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${styles[flag]}`}
        >
          {labels[flag]}
        </span>
      ))}
    </span>
  );
}
