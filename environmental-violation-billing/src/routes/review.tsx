import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AgeBadge } from '@/components/AgeBadge';
import { AttentionFlags } from '@/components/AttentionFlags';
import { EmptyState } from '@/components/EmptyState';
import { Money } from '@/components/Money';
import { attentionFlagsFor, awaitingApproval, useEnviroBill } from '@/hooks/useEnviroBillStore';
import { formatDate } from '@/lib/dates';

export const Route = createFileRoute('/review')({
  component: ReviewQueuePage,
});

function ReviewQueuePage() {
  const { violations, notices, approveNotices } = useEnviroBill();
  const [selected, setSelected] = useState<string[]>([]);

  const drafts = awaitingApproval(notices).map((notice) => {
    const violation = violations.find((v) => v.id === notice.violation_id);
    return { notice, violation, flags: attentionFlagsFor(notice, violation, violations) };
  });

  const flagged = drafts.filter((d) => d.flags.length > 0);
  const routine = drafts.filter((d) => d.flags.length === 0);

  const selectedTotal = drafts
    .filter((d) => selected.includes(d.notice.id))
    .reduce((sum, d) => sum + d.notice.amount, 0);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function selectAllRoutine() {
    setSelected(routine.map((d) => d.notice.id));
  }

  function approve() {
    approveNotices(selected);
    setSelected([]);
  }

  if (drafts.length === 0) {
    return (
      <EmptyState
        title="Nothing waiting for approval"
        description="Every drafted notice has been approved and marked sent."
        action={
          <Link
            to="/violations"
            search={{ notice: 'none' }}
            className="rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Draft a notice
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-8 pb-32">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Review queue</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-400">
            {drafts.length} drafted {drafts.length === 1 ? 'notice' : 'notices'} awaiting approval.
            Flagged rows get a careful look; routine ones can clear in a single pass.
          </p>
        </div>
        <button
          type="button"
          onClick={selectAllRoutine}
          disabled={routine.length === 0}
          className="rounded-xl bg-white/10 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Select all routine ({routine.length})
        </button>
      </div>

      {flagged.length > 0 ? (
        <Section title="Needs a careful look" tone="warn">
          {flagged.map((d) => (
            <DraftRow
              key={d.notice.id}
              id={d.notice.id}
              checked={selected.includes(d.notice.id)}
              onToggle={() => toggle(d.notice.id)}
              location={d.violation?.location ?? 'Unknown site'}
              type={d.violation?.violation_type ?? '—'}
              amount={d.notice.amount}
              dueDate={d.notice.due_date}
              touched={d.notice.last_touched_on}
              flags={d.flags}
            />
          ))}
        </Section>
      ) : null}

      {routine.length > 0 ? (
        <Section title="Routine" tone="default">
          {routine.map((d) => (
            <DraftRow
              key={d.notice.id}
              id={d.notice.id}
              checked={selected.includes(d.notice.id)}
              onToggle={() => toggle(d.notice.id)}
              location={d.violation?.location ?? 'Unknown site'}
              type={d.violation?.violation_type ?? '—'}
              amount={d.notice.amount}
              dueDate={d.notice.due_date}
              touched={d.notice.last_touched_on}
              flags={d.flags}
            />
          ))}
        </Section>
      ) : null}

      <div className="no-print fixed inset-x-0 bottom-0 border-t border-white/10 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-8 py-5">
          <p className="text-lg text-slate-200">
            <span className="font-semibold text-white">{selected.length} selected</span>
            {selected.length > 0 ? (
              <>
                {' '}
                · total <Money cents={selectedTotal} size="sm" />
              </>
            ) : null}
          </p>
          <button
            type="button"
            onClick={approve}
            disabled={selected.length === 0}
            className="rounded-xl bg-emerald-500 px-8 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Approve &amp; mark sent
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone: 'warn' | 'default';
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className={`text-sm font-semibold tracking-widest uppercase ${
          tone === 'warn' ? 'text-amber-300' : 'text-slate-500'
        }`}
      >
        {title}
      </h2>
      <div className="mt-4 divide-y divide-white/10 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
        {children}
      </div>
    </section>
  );
}

function DraftRow({
  id,
  checked,
  onToggle,
  location,
  type,
  amount,
  dueDate,
  touched,
  flags,
}: {
  id: string;
  checked: boolean;
  onToggle: () => void;
  location: string;
  type: string;
  amount: number;
  dueDate: string;
  touched: string;
  flags: ReturnType<typeof attentionFlagsFor>;
}) {
  return (
    <label className="grid cursor-pointer gap-4 p-6 transition hover:bg-white/5 lg:grid-cols-[auto_2fr_1fr_1fr] lg:items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="size-6 accent-emerald-500"
      />
      <div>
        <p className="text-xl font-semibold text-white">{location}</p>
        <p className="text-base text-slate-400 capitalize">{type}</p>
        <p className="mt-1 text-sm text-slate-500">Notice {id}</p>
      </div>
      <div>
        <Money cents={amount} size="sm" />
        <p className="mt-1 text-sm text-slate-400">Due {formatDate(dueDate)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
        <AttentionFlags flags={flags} />
        <AgeBadge iso={touched} label="since drafted" />
      </div>
    </label>
  );
}
