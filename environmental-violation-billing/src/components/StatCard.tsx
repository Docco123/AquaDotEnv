import type { ReactNode } from 'react';

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'default' | 'warn' | 'good';
}) {
  const ring =
    tone === 'warn'
      ? 'ring-amber-400/30 bg-amber-500/5'
      : tone === 'good'
        ? 'ring-emerald-400/30 bg-emerald-500/5'
        : 'ring-white/10 bg-white/5';

  return (
    <div className={`rounded-2xl p-6 ring-1 ${ring}`}>
      <p className="text-sm font-medium tracking-wide text-slate-400 uppercase">{label}</p>
      <p className="mt-3 text-4xl font-semibold tabular-nums text-white">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-400">{hint}</p> : null}
    </div>
  );
}
