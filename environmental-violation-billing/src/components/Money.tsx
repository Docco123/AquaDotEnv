import { formatAmount } from '@/lib/currency';

/**
 * Every amount in the app renders through here, so the "demo figure" marker
 * can never be forgotten.
 */
export function Money({
  cents,
  size = 'md',
  marker = true,
}: {
  cents: number;
  size?: 'sm' | 'md' | 'lg';
  marker?: boolean;
}) {
  const sizeClass =
    size === 'lg' ? 'text-4xl font-semibold' : size === 'sm' ? 'text-base font-medium' : 'text-2xl font-semibold';

  return (
    <span className="inline-flex flex-wrap items-baseline gap-2">
      <span className={`tabular-nums text-white ${sizeClass}`}>{formatAmount(cents)}</span>
      {marker ? (
        <span className="rounded bg-amber-400/15 px-2 py-0.5 text-xs font-medium tracking-wide text-amber-300 uppercase">
          demo figure
        </span>
      ) : null}
    </span>
  );
}
