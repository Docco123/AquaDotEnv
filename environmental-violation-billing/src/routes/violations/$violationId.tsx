import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { AgeBadge } from '@/components/AgeBadge';
import { DraftWaterWarningDialog } from '@/components/DraftWaterWarningDialog';
import { GenerateNoticeDialog } from '@/components/GenerateNoticeDialog';
import { ImpactPanel } from '@/components/ImpactPanel';
import { Money } from '@/components/Money';
import { SeverityBadge } from '@/components/SeverityBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { getImpactForViolation } from '@/data/impacts';
import { noticeForViolation, useEnviroBill, warningForViolation } from '@/hooks/useEnviroBillStore';
import { impactTier, needsWarning } from '@/lib/impact';
import { formatDate } from '@/lib/dates';

export const Route = createFileRoute('/violations/$violationId')({
  component: ViolationDetailPage,
});

function ViolationDetailPage() {
  const { violationId } = Route.useParams();
  const { violations, notices, warnings } = useEnviroBill();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);

  const violation = violations.find((v) => v.id === violationId);

  if (!violation) {
    return (
      <div className="rounded-2xl bg-white/5 p-10 text-center ring-1 ring-white/10">
        <p className="text-lg text-slate-300">That violation could not be found.</p>
        <Link
          to="/violations"
          search={{ notice: 'all' }}
          className="mt-4 inline-block text-emerald-300 underline"
        >
          Back to violations
        </Link>
      </div>
    );
  }

  const notice = noticeForViolation(notices, violation.id);
  const impact = getImpactForViolation(violation.id);
  const warning = warningForViolation(warnings, violation.id);
  const tier = impact ? impactTier(impact) : null;

  return (
    <div className="space-y-10">
      <div>
        <Link
          to="/violations"
          search={{ notice: 'all' }}
          className="text-sm text-slate-400 underline underline-offset-4"
        >
          ← All violations
        </Link>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
          {violation.location}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <SeverityBadge severity={violation.severity} />
          <StatusBadge kind="violation" status={violation.status} />
          <AgeBadge iso={violation.detected_at} label="since detected" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Fact label="Violation type" value={<span className="capitalize">{violation.violation_type}</span>} />
        <Fact label="Detected" value={formatDate(violation.detected_at)} />
        <Fact label="Review status" value={<span className="capitalize">{violation.status}</span>} />
      </div>

      <section className="rounded-2xl bg-white/5 p-8 ring-1 ring-white/10">
        <h2 className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
          Detection narrative
        </h2>
        <p className="mt-4 text-xl leading-relaxed text-slate-100">{violation.description}</p>
      </section>

      {impact ? (
        <ImpactPanel
          violation={violation}
          impact={impact}
          action={
            warning ? (
              <Link
                to="/warnings/$warningId"
                params={{ warningId: warning.id }}
                className="inline-block rounded-xl bg-white/10 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/20"
              >
                Open water warning ({warning.status})
              </Link>
            ) : tier && needsWarning(tier) ? (
              <div>
                <button
                  type="button"
                  onClick={() => setWarningDialogOpen(true)}
                  className="rounded-xl bg-amber-400 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-amber-300"
                >
                  Draft water warning
                </button>
                <p className="mt-3 text-sm text-slate-400">
                  Produces a printable public advisory. Nothing is sent or published from this app.
                </p>
              </div>
            ) : null
          }
        />
      ) : null}

      {notice ? (
        <section className="rounded-2xl bg-white/5 p-8 ring-1 ring-white/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-white">Billing notice {notice.id}</h2>
            <StatusBadge kind="notice" status={notice.status} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Fact label="Amount" value={<Money cents={notice.amount} />} />
            <Fact label="Due date" value={formatDate(notice.due_date)} />
            <Fact label="Sent" value={formatDate(notice.sent_at)} />
          </div>

          {notice.reminder_sent_at ? (
            <p className="mt-6 text-base text-amber-300">
              Reminder recorded {formatDate(notice.reminder_sent_at)}.
            </p>
          ) : null}

          <Link
            to="/notices/$noticeId"
            params={{ noticeId: notice.id }}
            className="mt-8 inline-block rounded-xl bg-white/10 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/20"
          >
            Open notice
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-emerald-400/30 bg-emerald-500/5 p-8">
          <h2 className="text-2xl font-semibold text-white">No billing notice yet</h2>
          <p className="mt-2 text-base text-slate-300">
            Generate a notice from the agency's own penalty rate table. You can adjust the amount
            before it is created.
          </p>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="mt-6 rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Generate billing notice
          </button>
        </section>
      )}

      {dialogOpen ? (
        <GenerateNoticeDialog violation={violation} onClose={() => setDialogOpen(false)} />
      ) : null}

      {warningDialogOpen && impact ? (
        <DraftWaterWarningDialog
          violation={violation}
          impact={impact}
          onClose={() => setWarningDialogOpen(false)}
        />
      ) : null}
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
