import type { BillingNoticeStatus, ViolationStatus } from '@/types/envirobill';

const violationStyles: Record<ViolationStatus, string> = {
  new: 'bg-indigo-500/15 text-indigo-300 ring-indigo-400/30',
  reviewed: 'bg-cyan-500/15 text-cyan-300 ring-cyan-400/30',
  billed: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
};

const noticeStyles: Record<BillingNoticeStatus, string> = {
  draft: 'bg-slate-500/20 text-slate-200 ring-slate-400/30',
  sent: 'bg-sky-500/15 text-sky-300 ring-sky-400/30',
  overdue: 'bg-rose-500/20 text-rose-300 ring-rose-400/40',
  paid: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
};

type Props =
  | { kind: 'violation'; status: ViolationStatus }
  | { kind: 'notice'; status: BillingNoticeStatus };

export function StatusBadge(props: Props) {
  const className =
    props.kind === 'violation' ? violationStyles[props.status] : noticeStyles[props.status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold capitalize ring-1 ${className}`}
    >
      {props.status}
    </span>
  );
}
