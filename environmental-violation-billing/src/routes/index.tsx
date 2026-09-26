import { createFileRoute, Link } from '@tanstack/react-router';
import { AgeBadge } from '@/components/AgeBadge';
import { Money } from '@/components/Money';
import { SeverityBadge } from '@/components/SeverityBadge';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { DEMO_FIGURE_NOTICE, DEMO_TODAY } from '@/data/agencyConfig';
import {
  awaitingApproval,
  awaitingDrafting,
  countsByImpactTier,
  countsBySeverity,
  countsByNoticeStatus,
  severeWithoutWarning,
  useEnviroBill,
} from '@/hooks/useEnviroBillStore';
import { ageInDays, formatDate } from '@/lib/dates';

export const Route = createFileRoute('/')({
  component: DashboardPage,
});

function DashboardPage() {
  const { violations, notices, warnings } = useEnviroBill();
  const toDraft = awaitingDrafting(violations, notices);
  const toApprove = awaitingApproval(notices);
  const noticeCounts = countsByNoticeStatus(notices);
  const severityCounts = countsBySeverity(violations);
  const impactCounts = countsByImpactTier(violations);
  const severeNoWarning = severeWithoutWarning(violations, warnings);

  const oldest = [...toDraft]
    .sort((a, b) => ageInDays(b.detected_at) - ageInDays(a.detected_at))
    .slice(0, 4);

  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-4xl font-semibold tracking-tight text-white">Backlog overview</h1>
        <p className="mt-3 max-w-3xl text-lg text-slate-400">
          Every agency has a backlog. This split shows where yours actually sits — before a notice
          is written, or before someone approves it.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Link
            to="/violations"
            search={{ notice: 'none' }}
            className="group rounded-3xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 p-8 ring-1 ring-indigo-400/30 transition hover:ring-indigo-300/60"
          >
            <p className="text-sm font-semibold tracking-widest text-indigo-300 uppercase">
              Waiting to be drafted
            </p>
            <p className="mt-4 text-7xl font-semibold tabular-nums text-white">{toDraft.length}</p>
            <p className="mt-4 text-base text-slate-300">
              Flagged violations with no billing notice yet →
            </p>
          </Link>

          <Link
            to="/review"
            className="group rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 p-8 ring-1 ring-emerald-400/30 transition hover:ring-emerald-300/60"
          >
            <p className="text-sm font-semibold tracking-widest text-emerald-300 uppercase">
              Drafted, waiting for approval
            </p>
            <p className="mt-4 text-7xl font-semibold tabular-nums text-white">{toApprove.length}</p>
            <p className="mt-4 text-base text-slate-300">Drafts sitting in the review queue →</p>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white">Notices by status</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Draft" value={noticeCounts.draft} />
          <StatCard label="Sent" value={noticeCounts.sent} />
          <StatCard label="Overdue" value={noticeCounts.overdue} tone="warn" />
          <StatCard label="Paid" value={noticeCounts.paid} tone="good" />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white">Violations by severity</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <StatCard label="High" value={severityCounts.High} tone="warn" />
          <StatCard label="Medium" value={severityCounts.Medium} />
          <StatCard label="Low" value={severityCounts.Low} />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white">Citizen and agriculture impact</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <StatCard label="Severe" value={impactCounts.Severe} tone="warn" />
          <StatCard label="Moderate" value={impactCounts.Moderate} />
          <StatCard label="Low" value={impactCounts.Low} />
        </div>

        <Link
          to="/impact"
          className={`mt-6 block rounded-3xl p-8 ring-1 transition ${
            severeNoWarning.length > 0
              ? 'bg-amber-500/10 ring-amber-400/40 hover:ring-amber-300/70'
              : 'bg-white/5 ring-white/10 hover:ring-white/20'
          }`}
        >
          <p className="text-sm font-semibold tracking-widest text-amber-300 uppercase">
            Severe, no warning drafted
          </p>
          <p className="mt-4 text-6xl font-semibold tabular-nums text-white">
            {severeNoWarning.length}
          </p>
          <p className="mt-4 text-base text-slate-300">
            The fastest safety action available from a flagged violation. →
          </p>
        </Link>

        <p className="mt-4 text-sm text-slate-500">
          Impact figures are demo estimates —{' '}
          <Link to="/impact" className="text-emerald-300 underline underline-offset-4">
            see affected areas
          </Link>
          .
        </p>
      </section>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl font-semibold text-white">Needs attention — oldest undrafted</h2>
          <p className="text-sm text-slate-500">Ages measured against {formatDate(DEMO_TODAY)}</p>
        </div>

        <div className="mt-6 divide-y divide-white/10 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
          {oldest.length === 0 ? (
            <p className="p-8 text-slate-400">Nothing is waiting to be drafted.</p>
          ) : (
            oldest.map((v) => (
              <Link
                key={v.id}
                to="/violations/$violationId"
                params={{ violationId: v.id }}
                className="flex flex-wrap items-center justify-between gap-4 p-6 transition hover:bg-white/5"
              >
                <div>
                  <p className="text-lg font-semibold text-white">{v.location}</p>
                  <p className="text-sm text-slate-400 capitalize">{v.violation_type}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <SeverityBadge severity={v.severity} />
                  <StatusBadge kind="violation" status={v.status} />
                  <AgeBadge iso={v.detected_at} label="since detected" />
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
        <p className="text-sm text-slate-400">
          Total value of unpaid notices:{' '}
          <Money
            cents={notices
              .filter((n) => n.status !== 'paid')
              .reduce((sum, n) => sum + n.amount, 0)}
            size="sm"
          />
        </p>
        <p className="mt-2 text-sm text-slate-500">{DEMO_FIGURE_NOTICE}</p>
      </section>
    </div>
  );
}
