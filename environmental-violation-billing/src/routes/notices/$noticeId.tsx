import { createFileRoute, Link } from '@tanstack/react-router';
import { AgeBadge } from '@/components/AgeBadge';
import { AttentionFlags } from '@/components/AttentionFlags';
import { Money } from '@/components/Money';
import { PrintableNotice } from '@/components/PrintableNotice';
import { StatusBadge } from '@/components/StatusBadge';
import { DEMO_FIGURE_NOTICE } from '@/data/agencyConfig';
import { attentionFlagsFor, useEnviroBill } from '@/hooks/useEnviroBillStore';
import { formatDate } from '@/lib/dates';

export const Route = createFileRoute('/notices/$noticeId')({
  component: NoticeDetailPage,
});

function NoticeDetailPage() {
  const { noticeId } = Route.useParams();
  const { violations, notices, markSent, markPaid, recordReminder } = useEnviroBill();

  const notice = notices.find((n) => n.id === noticeId);

  if (!notice) {
    return (
      <div className="rounded-2xl bg-white/5 p-10 text-center ring-1 ring-white/10">
        <p className="text-lg text-slate-300">That notice could not be found.</p>
        <Link to="/notices" className="mt-4 inline-block text-emerald-300 underline">
          Back to notices
        </Link>
      </div>
    );
  }

  const violation = violations.find((v) => v.id === notice.violation_id);
  const flags = attentionFlagsFor(notice, violation, violations);

  return (
    <div className="space-y-10">
      <div className="no-print">
        <Link to="/notices" className="text-sm text-slate-400 underline underline-offset-4">
          ← All notices
        </Link>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
          Notice {notice.id}
        </h1>
        <p className="mt-2 text-lg text-slate-400">{violation?.location ?? 'Unknown site'}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <StatusBadge kind="notice" status={notice.status} />
          <AttentionFlags flags={flags} />
          <AgeBadge iso={notice.last_touched_on} label="since last action" />
        </div>
      </div>

      <section className="no-print grid gap-6 lg:grid-cols-3">
        <Fact label="Amount" value={<Money cents={notice.amount} />} />
        <Fact label="Due date" value={formatDate(notice.due_date)} />
        <Fact label="Sent" value={formatDate(notice.sent_at)} />
      </section>

      <section className="no-print rounded-2xl bg-white/5 p-8 ring-1 ring-white/10">
        <h2 className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
          Penalty basis
        </h2>
        <p className="mt-3 text-lg text-slate-100">{notice.penalty_basis.text}</p>
        <p className="mt-3 text-sm text-amber-300">{DEMO_FIGURE_NOTICE}</p>
      </section>

      <section className="no-print rounded-2xl bg-white/5 p-8 ring-1 ring-white/10">
        <h2 className="text-2xl font-semibold text-white">Record an action taken offline</h2>
        <p className="mt-2 text-base text-slate-400">
          These controls record what a case manager has already done by post, phone or in person.
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          {notice.status === 'draft' ? (
            <button
              type="button"
              onClick={() => markSent(notice.id)}
              className="rounded-xl bg-sky-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              Mark as sent
            </button>
          ) : null}

          {notice.status !== 'paid' ? (
            <button
              type="button"
              onClick={() => markPaid(notice.id)}
              className="rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Mark as paid
            </button>
          ) : (
            <p className="text-base text-emerald-300">Payment recorded — nothing further to do.</p>
          )}
        </div>

        {notice.status === 'overdue' ? (
          <div className="mt-8 rounded-2xl bg-amber-500/5 p-6 ring-1 ring-amber-400/30">
            {notice.reminder_sent_at ? (
              <p className="text-2xl font-semibold text-amber-300">
                Reminder sent {formatDate(notice.reminder_sent_at)}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => recordReminder(notice.id)}
                className="rounded-xl bg-amber-400 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                Record reminder sent
              </button>
            )}
            <p className="mt-3 text-sm text-slate-300">
              Recording a reminder stores the date only — no email or message is sent.
            </p>
          </div>
        ) : null}
      </section>

      <section>
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Printable notice</h2>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-white/10 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/20"
          >
            Print / Save as PDF
          </button>
        </div>
        <PrintableNotice notice={notice} violation={violation} />
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
      <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">{label}</p>
      <div className="mt-2 text-xl text-white">{value}</div>
    </div>
  );
}
