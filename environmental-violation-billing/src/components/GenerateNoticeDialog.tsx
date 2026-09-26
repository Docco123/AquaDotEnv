import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { DEFAULT_DUE_DAYS, DEMO_FIGURE_NOTICE, DEMO_TODAY, severityMultipliers } from '@/data/agencyConfig';
import { useEnviroBill } from '@/hooks/useEnviroBillStore';
import { formatAmount } from '@/lib/currency';
import { addDays, formatDate } from '@/lib/dates';
import { describeBasis, rateForType, suggestAmount } from '@/lib/penalty';
import type { Violation } from '@/types/envirobill';

function centsToDollarInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

function dollarInputToCents(value: string): number {
  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ''));
  if (Number.isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function GenerateNoticeDialog({
  violation,
  onClose,
}: {
  violation: Violation;
  onClose: () => void;
}) {
  const { createNotice } = useEnviroBill();
  const navigate = useNavigate();

  const rate = rateForType(violation.violation_type);
  const multiplier = severityMultipliers[violation.severity];
  const suggested = suggestAmount(violation);

  const [amountInput, setAmountInput] = useState(centsToDollarInput(suggested));
  const [dueDate, setDueDate] = useState(addDays(DEMO_TODAY, DEFAULT_DUE_DAYS));

  const amountCents = dollarInputToCents(amountInput);
  const basis = describeBasis(violation, amountCents, suggested);

  function handleSave() {
    const id = createNotice(violation.id, amountCents, dueDate, basis);
    onClose();
    navigate({ to: '/notices/$noticeId', params: { noticeId: id } });
  }

  return (
    <div className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/80 p-6 backdrop-blur">
      <div className="my-8 w-full max-w-2xl rounded-3xl bg-slate-900 p-8 ring-1 ring-white/15">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-3xl font-semibold text-white">Generate billing notice</h2>
            <p className="mt-1 text-base text-slate-400">{violation.location}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 ring-1 ring-white/15 transition hover:bg-white/10"
          >
            Cancel
          </button>
        </div>

        <dl className="mt-8 space-y-4 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
          <Row label="Base rate">
            <span className="text-white">{formatAmount(rate.base_amount)}</span>
            <p className="mt-1 text-sm text-slate-400">{rate.note}</p>
          </Row>
          <Row label="Severity multiplier">
            <span className="text-white">
              x {multiplier} ({violation.severity})
            </span>
          </Row>
          <Row label="Suggested amount">
            <span className="text-2xl font-semibold text-emerald-300">
              {formatAmount(suggested)}
            </span>
          </Row>
        </dl>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold tracking-widest text-slate-400 uppercase">
              Amount (USD)
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="mt-2 w-full rounded-xl bg-slate-950 px-4 py-3 text-2xl text-white tabular-nums ring-1 ring-white/15 outline-none focus:ring-emerald-400/60"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold tracking-widest text-slate-400 uppercase">
              Due date
            </span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-2 w-full rounded-xl bg-slate-950 px-4 py-3 text-xl text-white ring-1 ring-white/15 outline-none focus:ring-emerald-400/60"
            />
            <span className="mt-2 block text-sm text-slate-500">{formatDate(dueDate)}</span>
          </label>
        </div>

        <div className="mt-8 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
          <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
            Penalty basis recorded on this notice
          </p>
          <p className="mt-2 text-base text-slate-200">{basis.text}</p>
          <p className="mt-3 text-sm text-amber-300">{DEMO_FIGURE_NOTICE}</p>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          The rate table and severity multipliers are editable in{' '}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-slate-300">
            src/data/agencyConfig.ts
          </code>{' '}
          — this is what a real customer agency would configure for itself.
        </p>

        <div className="mt-8 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-6 py-3 text-base font-semibold text-slate-300 ring-1 ring-white/15 transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Create draft notice
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
      <dt className="text-sm font-semibold tracking-widest text-slate-500 uppercase">{label}</dt>
      <dd className="text-right text-base sm:max-w-md">{children}</dd>
    </div>
  );
}
