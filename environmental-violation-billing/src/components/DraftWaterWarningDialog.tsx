import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ImpactTierBadge } from '@/components/ImpactTierBadge';
import { DEMO_TODAY } from '@/data/agencyConfig';
import { useEnviroBill } from '@/hooks/useEnviroBillStore';
import { DEMO_ESTIMATE_NOTICE, defaultPrecautionText, impactTier } from '@/lib/impact';
import { formatDate } from '@/lib/dates';
import type { Violation } from '@/types/envirobill';
import type { ViolationImpact } from '@/types/envirobill-impact';

export function DraftWaterWarningDialog({
  violation,
  impact,
  onClose,
}: {
  violation: Violation;
  impact: ViolationImpact;
  onClose: () => void;
}) {
  const { createWarning } = useEnviroBill();
  const navigate = useNavigate();
  const tier = impactTier(impact);

  const [text, setText] = useState(() => defaultPrecautionText(violation, impact));

  function handleSave() {
    const id = createWarning(violation.id, text);
    onClose();
    navigate({ to: '/warnings/$warningId', params: { warningId: id } });
  }

  return (
    <div className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/80 p-6 backdrop-blur">
      <div className="my-8 w-full max-w-2xl rounded-3xl bg-slate-900 p-8 ring-1 ring-white/15">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-3xl font-semibold text-white">Draft water warning</h2>
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

        <div className="mt-8 space-y-3 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-semibold tracking-widest text-slate-500 uppercase">
              Affected waterway
            </span>
            <span className="text-white">{impact.waterway_name}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-semibold tracking-widest text-slate-500 uppercase">
              Impact tier
            </span>
            <ImpactTierBadge tier={tier} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-semibold tracking-widest text-slate-500 uppercase">
              Affected area
            </span>
            <span className="text-right text-white">
              {impact.downstream_km_affected} km downstream · approx.{' '}
              {impact.households_exposed.toLocaleString()} households
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-semibold tracking-widest text-slate-500 uppercase">
              Issue date
            </span>
            <span className="text-white">{formatDate(DEMO_TODAY)}</span>
          </div>
          <p className="pt-2 text-sm text-amber-300">{DEMO_ESTIMATE_NOTICE}</p>
        </div>

        <label className="mt-8 block">
          <span className="text-sm font-semibold tracking-widest text-slate-400 uppercase">
            Precaution wording
          </span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            className="mt-2 w-full rounded-xl bg-slate-950 px-4 py-3 text-base leading-relaxed text-white ring-1 ring-white/15 outline-none focus:ring-emerald-400/60"
          />
        </label>

        <p className="mt-6 text-sm text-slate-400">
          This produces a printable document only. Nothing is sent, published, or broadcast from
          this app — issuing a warning through the agency's own channels remains a manual step.
        </p>

        <div className="mt-6 flex justify-end gap-4">
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
            className="rounded-xl bg-amber-400 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-amber-300"
          >
            Create draft warning
          </button>
        </div>
      </div>
    </div>
  );
}
