import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ImpactTierBadge } from '@/components/ImpactTierBadge';
import { PrintableWarning } from '@/components/PrintableWarning';
import { getImpactForViolation } from '@/data/impacts';
import { useEnviroBill } from '@/hooks/useEnviroBillStore';
import { impactTier } from '@/lib/impact';
import { formatDate } from '@/lib/dates';

export const Route = createFileRoute('/warnings/$warningId')({
  component: WarningDetailPage,
});

function WarningDetailPage() {
  const { warningId } = Route.useParams();
  const { violations, warnings, markWarningIssued, updateWarningText } = useEnviroBill();

  const warning = warnings.find((w) => w.id === warningId);
  const [draftText, setDraftText] = useState(warning?.precaution_text ?? '');

  if (!warning) {
    return (
      <div className="rounded-2xl bg-white/5 p-10 text-center ring-1 ring-white/10">
        <p className="text-lg text-slate-300">That warning could not be found.</p>
        <Link to="/warnings" className="mt-4 inline-block text-emerald-300 underline">
          Back to warnings
        </Link>
      </div>
    );
  }

  const violation = violations.find((v) => v.id === warning.violation_id);
  const impact = getImpactForViolation(warning.violation_id);

  return (
    <div className="space-y-10">
      <div className="no-print">
        <Link to="/warnings" className="text-sm text-slate-400 underline underline-offset-4">
          ← All warnings
        </Link>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
          Advisory {warning.id}
        </h1>
        <p className="mt-2 text-lg text-slate-400">{violation?.location ?? 'Unknown site'}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {impact ? <ImpactTierBadge tier={impactTier(impact)} /> : null}
          <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-slate-200 capitalize ring-1 ring-white/15">
            {warning.status}
          </span>
          <span className="text-sm text-slate-500">Created {formatDate(warning.created_on)}</span>
          {warning.issued_on ? (
            <span className="text-sm text-emerald-300">Issued {formatDate(warning.issued_on)}</span>
          ) : null}
        </div>
      </div>

      <section className="no-print rounded-2xl bg-white/5 p-8 ring-1 ring-white/10">
        <h2 className="text-2xl font-semibold text-white">Precaution wording</h2>
        <textarea
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          rows={7}
          className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-3 text-base leading-relaxed text-white ring-1 ring-white/15 outline-none focus:ring-emerald-400/60"
        />
        <div className="mt-4 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => updateWarningText(warning.id, draftText)}
            className="rounded-xl bg-white/10 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/20"
          >
            Save wording
          </button>

          {warning.status === 'issued' ? (
            <p className="self-center text-base text-emerald-300">
              Issued {formatDate(warning.issued_on)}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => markWarningIssued(warning.id)}
              className="rounded-xl bg-amber-400 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              Mark as issued
            </button>
          )}
        </div>
        <p className="mt-4 text-sm text-slate-400">
          Marking a warning issued records an action the agency took through its own channels. This
          app sends, publishes and broadcasts nothing.
        </p>
      </section>

      <section>
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Printable advisory</h2>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-white/10 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/20"
          >
            Print / Save as PDF
          </button>
        </div>
        <PrintableWarning warning={warning} violation={violation} impact={impact} />
      </section>
    </div>
  );
}
