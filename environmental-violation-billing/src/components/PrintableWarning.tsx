import { agencyConfig } from '@/data/agencyConfig';
import { DEMO_ESTIMATE_NOTICE } from '@/lib/impact';
import { formatDate } from '@/lib/dates';
import type { Violation } from '@/types/envirobill';
import type { ViolationImpact, WaterWarning } from '@/types/envirobill-impact';

/**
 * The formatted public advisory. Printable only — nothing is sent, published or
 * broadcast from this app.
 */
export function PrintableWarning({
  warning,
  violation,
  impact,
}: {
  warning: WaterWarning;
  violation: Violation | undefined;
  impact: ViolationImpact | undefined;
}) {
  return (
    <div className="printable-warning rounded-2xl bg-white p-12 text-slate-900 shadow-2xl">
      <header className="flex items-start justify-between gap-8 border-b-2 border-slate-900 pb-6">
        <div>
          <p className="text-2xl font-bold tracking-tight">{agencyConfig.name}</p>
          <p className="text-base font-medium text-slate-700">{agencyConfig.department}</p>
          {agencyConfig.addressLines.map((line) => (
            <p key={line} className="text-sm text-slate-600">
              {line}
            </p>
          ))}
          <p className="mt-1 text-sm text-slate-600">{agencyConfig.contactLine}</p>
        </div>
        <div className="flex size-24 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-400 text-center text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
          {agencyConfig.sealPlaceholderText}
        </div>
      </header>

      <h1 className="mt-8 text-center text-2xl font-bold tracking-widest uppercase">
        Public Water Advisory
      </h1>

      <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-3 text-base">
        <Line label="Advisory number" value={warning.id} />
        <Line label="Date of issue" value={formatDate(warning.issued_on ?? warning.created_on)} />
        <Line label="Affected waterway" value={impact?.waterway_name ?? '—'} />
        <Line label="Site" value={violation?.location ?? '—'} />
      </dl>

      <section className="mt-8">
        <h2 className="text-sm font-bold tracking-widest uppercase">Area affected</h2>
        <p className="mt-2 text-base leading-relaxed">
          {impact
            ? `Approximately ${impact.downstream_km_affected} km of ${impact.waterway_name} downstream of the site. The nearest downstream drinking-water intake is ${impact.intake_name}, ${impact.intake_distance_km} km downstream. An estimated ${impact.households_exposed.toLocaleString()} households lie within the affected area.`
            : '—'}
        </p>
      </section>

      <section className="mt-8 border-y-2 border-slate-900 py-6">
        <h2 className="text-sm font-bold tracking-widest uppercase">Precautions</h2>
        <p className="mt-2 text-base leading-relaxed">{warning.precaution_text}</p>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-bold tracking-widest uppercase">For information</h2>
        <p className="mt-2 text-base leading-relaxed">{agencyConfig.contactLine}</p>
      </section>

      <section className="mt-12 flex items-end justify-between gap-12">
        <div className="w-64">
          <div className="border-b border-slate-900" />
          <p className="mt-2 text-sm text-slate-600">Authorised officer</p>
        </div>
        <div className="w-48">
          <div className="border-b border-slate-900" />
          <p className="mt-2 text-sm text-slate-600">Date</p>
        </div>
      </section>

      <p className="mt-10 border-t border-slate-300 pt-4 text-xs text-slate-500">
        {DEMO_ESTIMATE_NOTICE} This document was produced by a demonstration system and is not a
        legal or public-health instrument.
      </p>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold tracking-widest text-slate-500 uppercase">{label}</dt>
      <dd className="text-base">{value}</dd>
    </div>
  );
}
