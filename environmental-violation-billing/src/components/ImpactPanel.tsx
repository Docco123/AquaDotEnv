import type { ReactNode } from 'react';
import { ImpactTierBadge } from '@/components/ImpactTierBadge';
import { DEMO_ESTIMATE_NOTICE, impactTier } from '@/lib/impact';
import type { Violation } from '@/types/envirobill';
import type { ViolationImpact } from '@/types/envirobill-impact';

/** Every figure here is a demo estimate, and says so. */
function Figure({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
      <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">{label}</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <span className="text-xl text-white">{value}</span>
        <span className="rounded bg-amber-400/15 px-2 py-0.5 text-xs font-medium tracking-wide text-amber-300 uppercase">
          demo estimate
        </span>
      </div>
    </div>
  );
}

export function ImpactPanel({
  violation,
  impact,
  action,
}: {
  violation: Violation;
  impact: ViolationImpact;
  action?: ReactNode;
}) {
  const tier = impactTier(impact);

  return (
    <section className="rounded-2xl bg-white/5 p-8 ring-1 ring-white/10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Citizen and agriculture impact</h2>
          <p className="mt-1 text-base text-slate-400">
            Affected waterway: {impact.waterway_name}
          </p>
        </div>
        <ImpactTierBadge tier={tier} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
            Citizen impact
          </h3>
          <div className="mt-4 space-y-4">
            <Figure label="Households exposed" value={impact.households_exposed.toLocaleString()} />
            <Figure
              label="Nearest drinking-water intake"
              value={`${impact.intake_name} — ${impact.intake_distance_km} km downstream`}
            />
            <Figure
              label="Downstream distance affected"
              value={`${impact.downstream_km_affected} km`}
            />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
            Agriculture impact
          </h3>
          <div className="mt-4 space-y-4">
            <Figure
              label="Farmland affected"
              value={`${impact.farmland_acres_affected.toLocaleString()} acres`}
            />
            <Figure label="Primary crop or land use" value={impact.primary_land_use} />
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm text-amber-300">{DEMO_ESTIMATE_NOTICE}</p>
      <p className="sr-only">{violation.location}</p>

      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}
