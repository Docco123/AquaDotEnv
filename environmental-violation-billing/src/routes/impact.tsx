import { createFileRoute, Link } from '@tanstack/react-router';
import { AffectedAreasDiagram } from '@/components/AffectedAreasDiagram';
import { ImpactTierBadge } from '@/components/ImpactTierBadge';
import { getImpactForViolation } from '@/data/impacts';
import { useEnviroBill, warningForViolation } from '@/hooks/useEnviroBillStore';
import { DEMO_ESTIMATE_NOTICE, IMPACT_TIER_RULE, impactTier, needsWarning, tierRank } from '@/lib/impact';

export const Route = createFileRoute('/impact')({
  component: ImpactPage,
});

function ImpactPage() {
  const { violations, warnings } = useEnviroBill();

  const rows = violations
    .map((violation) => {
      const impact = getImpactForViolation(violation.id);
      if (!impact) return null;
      return { violation, impact, tier: impactTier(impact) };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort(
      (a, b) =>
        tierRank(b.tier) - tierRank(a.tier) ||
        b.impact.households_exposed - a.impact.households_exposed,
    );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-white">Affected areas</h1>
        <p className="mt-3 max-w-3xl text-lg text-slate-400">
          Estimated citizen and agriculture exposure for each flagged violation, and how the
          seeded sites relate to the two downstream drinking-water intakes.
        </p>
      </div>

      <AffectedAreasDiagram />
      <p className="text-sm text-amber-300">{DEMO_ESTIMATE_NOTICE}</p>

      <section>
        <h2 className="text-2xl font-semibold text-white">Exposure by site</h2>
        <p className="mt-2 text-sm text-amber-300">{DEMO_ESTIMATE_NOTICE}</p>

        <div className="mt-6 divide-y divide-white/10 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
          {rows.map(({ violation, impact, tier }) => {
            const warning = warningForViolation(warnings, violation.id);
            return (
              <div
                key={violation.id}
                className="grid gap-4 p-6 lg:grid-cols-[2fr_2fr_auto] lg:items-center"
              >
                <div>
                  <Link
                    to="/violations/$violationId"
                    params={{ violationId: violation.id }}
                    className="text-xl font-semibold text-white underline-offset-4 hover:underline"
                  >
                    {violation.location}
                  </Link>
                  <p className="text-base text-slate-400">{impact.waterway_name}</p>
                </div>

                <div className="text-base text-slate-300">
                  <p>
                    {impact.households_exposed.toLocaleString()} households ·{' '}
                    {impact.farmland_acres_affected.toLocaleString()} acres farmland
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {impact.intake_name} — {impact.intake_distance_km} km downstream
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  <ImpactTierBadge tier={tier} />
                  {needsWarning(tier) ? (
                    warning ? (
                      <Link
                        to="/warnings/$warningId"
                        params={{ warningId: warning.id }}
                        className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                      >
                        Water warning {warning.status}
                      </Link>
                    ) : (
                      <Link
                        to="/violations/$violationId"
                        params={{ violationId: violation.id }}
                        className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
                      >
                        Draft water warning
                      </Link>
                    )
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl bg-white/5 p-8 ring-1 ring-white/10">
        <h2 className="text-2xl font-semibold text-white">How the impact tier is decided</h2>
        <p className="mt-4 text-lg leading-relaxed text-slate-200">{IMPACT_TIER_RULE}</p>
        <p className="mt-4 text-sm text-slate-500">
          These thresholds are editable in{' '}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-slate-300">src/lib/impact.ts</code>{' '}
          — they are what a real customer agency would set for itself.
        </p>
      </section>
    </div>
  );
}
