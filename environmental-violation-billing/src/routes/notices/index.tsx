import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AgeBadge } from '@/components/AgeBadge';
import { EmptyState } from '@/components/EmptyState';
import { Money } from '@/components/Money';
import { StatusBadge } from '@/components/StatusBadge';
import { useEnviroBill } from '@/hooks/useEnviroBillStore';
import { formatDate } from '@/lib/dates';
import type { BillingNoticeStatus } from '@/types/envirobill';

export const Route = createFileRoute('/notices/')({
  component: NoticesPage,
});

const chipBase =
  'rounded-lg px-4 py-2 text-sm font-medium transition ring-1 ring-white/10 text-slate-300 hover:bg-white/10';
const chipActive = 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/40';

function NoticesPage() {
  const { violations, notices } = useEnviroBill();
  const [filter, setFilter] = useState<'all' | BillingNoticeStatus>('all');

  const rows = notices.filter((n) => (filter === 'all' ? true : n.status === filter));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-white">Billing notices</h1>
        <p className="mt-3 text-lg text-slate-400">
          Payment is handled traditionally — a case manager marks a notice paid once payment
          clears offline.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
        {(['all', 'draft', 'sent', 'overdue', 'paid'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`${chipBase} capitalize ${filter === f ? chipActive : ''}`}
          >
            {f}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No notices with this status" />
      ) : (
        <div className="divide-y divide-white/10 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
          {rows.map((n) => {
            const violation = violations.find((v) => v.id === n.violation_id);
            return (
              <Link
                key={n.id}
                to="/notices/$noticeId"
                params={{ noticeId: n.id }}
                className="grid gap-4 p-6 transition hover:bg-white/5 lg:grid-cols-[2fr_1fr_auto] lg:items-center"
              >
                <div>
                  <p className="text-xl font-semibold text-white">
                    {violation?.location ?? 'Unknown site'}
                  </p>
                  <p className="text-base text-slate-400 capitalize">
                    {violation?.violation_type ?? '—'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Notice {n.id}</p>
                </div>
                <div>
                  <Money cents={n.amount} size="sm" />
                  <p className="mt-1 text-sm text-slate-400">Due {formatDate(n.due_date)}</p>
                  {n.reminder_sent_at ? (
                    <p className="mt-1 text-sm text-amber-300">
                      Reminder recorded {formatDate(n.reminder_sent_at)}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  <StatusBadge kind="notice" status={n.status} />
                  <AgeBadge iso={n.last_touched_on} label="since last action" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
