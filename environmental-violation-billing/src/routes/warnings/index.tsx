import { createFileRoute, Link } from '@tanstack/react-router';
import { EmptyState } from '@/components/EmptyState';
import { ImpactTierBadge } from '@/components/ImpactTierBadge';
import { getImpactForViolation } from '@/data/impacts';
import { useEnviroBill } from '@/hooks/useEnviroBillStore';
import { impactTier } from '@/lib/impact';
import { formatDate } from '@/lib/dates';

export const Route = createFileRoute('/warnings/')({
  component: WarningsPage,
});

function WarningsPage() {
  const { violations, warnings } = useEnviroBill();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-white">Water warnings</h1>
        <p className="mt-3 max-w-3xl text-lg text-slate-400">
          Warnings are printed and distributed by the agency itself. Nothing is sent, published or
          broadcast from this app.
        </p>
      </div>

      {warnings.length === 0 ? (
        <EmptyState
          title="No water warnings drafted yet"
          description="Draft one from a Moderate or Severe impact case."
          action={
            <Link
              to="/impact"
              className="rounded-xl bg-amber-400 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Go to affected areas
            </Link>
          }
        />
      ) : (
        <div className="divide-y divide-white/10 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
          {warnings.map((w) => {
            const violation = violations.find((v) => v.id === w.violation_id);
            const impact = getImpactForViolation(w.violation_id);
            return (
              <Link
                key={w.id}
                to="/warnings/$warningId"
                params={{ warningId: w.id }}
                className="grid gap-4 p-6 transition hover:bg-white/5 lg:grid-cols-[2fr_1fr_auto] lg:items-center"
              >
                <div>
                  <p className="text-xl font-semibold text-white">
                    {violation?.location ?? 'Unknown site'}
                  </p>
                  <p className="text-base text-slate-400">{impact?.waterway_name ?? '—'}</p>
                  <p className="mt-1 text-sm text-slate-500">Advisory {w.id}</p>
                </div>
                <div className="text-sm text-slate-300">
                  <p>Created {formatDate(w.created_on)}</p>
                  <p className="mt-1">
                    {w.issued_on ? `Issued ${formatDate(w.issued_on)}` : 'Not yet issued'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  {impact ? <ImpactTierBadge tier={impactTier(impact)} /> : null}
                  <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-slate-200 capitalize ring-1 ring-white/15">
                    {w.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
