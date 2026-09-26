import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AgeBadge } from '@/components/AgeBadge';
import { SeverityBadge } from '@/components/SeverityBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { noticeForViolation, useEnviroBill } from '@/hooks/useEnviroBillStore';
import { ageInDays, formatDate } from '@/lib/dates';
import type { ViolationSeverity, ViolationStatus } from '@/types/envirobill';

type NoticeFilter = 'all' | 'has' | 'none';

interface ViolationSearch {
  notice: NoticeFilter;
}

export const Route = createFileRoute('/violations/')({
  validateSearch: (search: Record<string, unknown>): ViolationSearch => {
    const notice = search.notice;
    return {
      notice: notice === 'has' || notice === 'none' ? notice : 'all',
    };
  },
  component: ViolationsPage,
});

const severityRank: Record<ViolationSeverity, number> = { High: 3, Medium: 2, Low: 1 };

const chipBase =
  'rounded-lg px-4 py-2 text-sm font-medium transition ring-1 ring-white/10 text-slate-300 hover:bg-white/10';
const chipActive = 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/40';

function ViolationsPage() {
  const { notice: noticeFilter } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { violations, notices } = useEnviroBill();

  const [severity, setSeverity] = useState<'All' | ViolationSeverity>('All');
  const [status, setStatus] = useState<'All' | ViolationStatus>('All');
  const [sort, setSort] = useState<'detected' | 'severity'>('detected');

  const rows = violations
    .filter((v) => (severity === 'All' ? true : v.severity === severity))
    .filter((v) => (status === 'All' ? true : v.status === status))
    .filter((v) => {
      if (noticeFilter === 'all') return true;
      const hasNotice = Boolean(noticeForViolation(notices, v.id));
      return noticeFilter === 'has' ? hasNotice : !hasNotice;
    })
    .sort((a, b) =>
      sort === 'severity'
        ? severityRank[b.severity] - severityRank[a.severity]
        : ageInDays(b.detected_at) - ageInDays(a.detected_at),
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-white">Flagged violations</h1>
        <p className="mt-3 text-lg text-slate-400">
          {rows.length} of {violations.length} shown.
        </p>
      </div>

      <div className="flex flex-wrap gap-8 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
        <FilterGroup label="Severity">
          {(['All', 'High', 'Medium', 'Low'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeverity(s)}
              className={`${chipBase} ${severity === s ? chipActive : ''}`}
            >
              {s}
            </button>
          ))}
        </FilterGroup>

        <FilterGroup label="Status">
          {(['All', 'new', 'reviewed', 'billed'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`${chipBase} capitalize ${status === s ? chipActive : ''}`}
            >
              {s}
            </button>
          ))}
        </FilterGroup>

        <FilterGroup label="Notice">
          {(
            [
              ['all', 'All'],
              ['has', 'Has notice'],
              ['none', 'No notice'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => navigate({ search: { notice: value } })}
              className={`${chipBase} ${noticeFilter === value ? chipActive : ''}`}
            >
              {label}
            </button>
          ))}
        </FilterGroup>

        <FilterGroup label="Sort by">
          {(
            [
              ['detected', 'Detected date'],
              ['severity', 'Severity'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSort(value)}
              className={`${chipBase} ${sort === value ? chipActive : ''}`}
            >
              {label}
            </button>
          ))}
        </FilterGroup>
      </div>

      <div className="divide-y divide-white/10 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
        {rows.length === 0 ? (
          <p className="p-10 text-center text-slate-400">No violations match these filters.</p>
        ) : (
          rows.map((v) => {
            const notice = noticeForViolation(notices, v.id);
            return (
              <Link
                key={v.id}
                to="/violations/$violationId"
                params={{ violationId: v.id }}
                className="grid gap-4 p-6 transition hover:bg-white/5 lg:grid-cols-[2fr_1fr_auto] lg:items-center"
              >
                <div>
                  <p className="text-xl font-semibold text-white">{v.location}</p>
                  <p className="text-base text-slate-400 capitalize">{v.violation_type}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Detected {formatDate(v.detected_at)}
                  </p>
                </div>
                <div className="text-sm text-slate-300">
                  {notice ? (
                    <span className="inline-flex items-center gap-2">
                      Notice <StatusBadge kind="notice" status={notice.status} />
                    </span>
                  ) : (
                    <span className="text-slate-500">No notice yet</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
                  <SeverityBadge severity={v.severity} />
                  <StatusBadge kind="violation" status={v.status} />
                  <AgeBadge iso={v.detected_at} label="since detected" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-widest text-slate-500 uppercase">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
