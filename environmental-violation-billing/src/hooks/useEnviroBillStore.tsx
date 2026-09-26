import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { DEMO_TODAY } from '@/data/agencyConfig';
import { getBillingNotices, getViolations } from '@/data/envirobill';
import { getImpactForViolation } from '@/data/impacts';
import { impactTier } from '@/lib/impact';
import { describeBasis, suggestAmount } from '@/lib/penalty';
import type {
  BillingNotice,
  BillingNoticeStatus,
  Violation,
  ViolationSeverity,
} from '@/types/envirobill';
import type { ImpactTier, WaterWarning } from '@/types/envirobill-impact';
import type { AttentionFlag, DemoNotice, PenaltyBasis } from '@/types/envirobill-ui';

/**
 * Session-scoped in-memory store. No persistence, no network, no database —
 * reloading the page restores the seeded demo exactly. That is intentional.
 */

interface StoreValue {
  violations: Violation[];
  notices: DemoNotice[];
  createNotice: (
    violationId: string,
    amount: number,
    dueDate: string,
    basis: PenaltyBasis,
  ) => string;
  approveNotices: (noticeIds: string[]) => void;
  markSent: (noticeId: string) => void;
  markPaid: (noticeId: string) => void;
  recordReminder: (noticeId: string) => void;
  updateNoticeAmount: (noticeId: string, amount: number, basis: PenaltyBasis) => void;
  warnings: WaterWarning[];
  createWarning: (violationId: string, precautionText: string) => string;
  markWarningIssued: (warningId: string) => void;
  updateWarningText: (warningId: string, precautionText: string) => void;
}

const EnviroBillContext = createContext<StoreValue | null>(null);

function upgradeNotice(notice: BillingNotice, violations: Violation[]): DemoNotice {
  const violation = violations.find((v) => v.id === notice.violation_id);
  const suggested = violation ? suggestAmount(violation) : notice.amount;
  const basis = violation
    ? describeBasis(violation, notice.amount, suggested)
    : { kind: 'manual' as const, text: 'Amount recorded without a linked violation.' };

  const lastTouched =
    notice.reminder_sent_at?.slice(0, 10) ??
    notice.sent_at?.slice(0, 10) ??
    violation?.detected_at.slice(0, 10) ??
    notice.due_date;

  return {
    ...notice,
    penalty_basis: basis,
    amount_overridden: notice.amount !== suggested,
    last_touched_on: lastTouched,
  };
}

let noticeCounter = 100;
function nextNoticeId(): string {
  noticeCounter += 1;
  return `bn-${noticeCounter}`;
}

let warningCounter = 100;
function nextWarningId(): string {
  warningCounter += 1;
  return `ww-${warningCounter}`;
}

export function EnviroBillProvider({ children }: { children: ReactNode }) {
  const seedViolations = useMemo(() => getViolations(), []);
  const [violations, setViolations] = useState<Violation[]>(seedViolations);
  const [notices, setNotices] = useState<DemoNotice[]>(() =>
    getBillingNotices().map((n) => upgradeNotice(n, seedViolations)),
  );
  // No warning exists until a case manager drafts one.
  const [warnings, setWarnings] = useState<WaterWarning[]>([]);

  const value: StoreValue = {
    violations,
    notices,
    createNotice(violationId, amount, dueDate, basis) {
      const id = nextNoticeId();
      const violation = violations.find((v) => v.id === violationId);
      const suggested = violation ? suggestAmount(violation) : amount;
      setNotices((prev) => [
        ...prev,
        {
          id,
          violation_id: violationId,
          amount,
          status: 'draft',
          due_date: dueDate,
          sent_at: null,
          reminder_sent_at: null,
          penalty_basis: basis,
          amount_overridden: amount !== suggested,
          last_touched_on: DEMO_TODAY,
        },
      ]);
      setViolations((prev) =>
        prev.map((v) => (v.id === violationId && v.status === 'new' ? { ...v, status: 'reviewed' } : v)),
      );
      return id;
    },
    approveNotices(noticeIds) {
      const ids = new Set(noticeIds);
      const approved = notices.filter((n) => ids.has(n.id) && n.status === 'draft');
      const violationIds = new Set(approved.map((n) => n.violation_id));
      setNotices((prev) =>
        prev.map((n) =>
          ids.has(n.id) && n.status === 'draft'
            ? {
                ...n,
                status: 'sent' as BillingNoticeStatus,
                sent_at: `${DEMO_TODAY}T09:00:00Z`,
                last_touched_on: DEMO_TODAY,
              }
            : n,
        ),
      );
      setViolations((prev) =>
        prev.map((v) => (violationIds.has(v.id) ? { ...v, status: 'billed' } : v)),
      );
    },
    markSent(noticeId) {
      const notice = notices.find((n) => n.id === noticeId);
      setNotices((prev) =>
        prev.map((n) =>
          n.id === noticeId
            ? { ...n, status: 'sent', sent_at: `${DEMO_TODAY}T09:00:00Z`, last_touched_on: DEMO_TODAY }
            : n,
        ),
      );
      if (notice) {
        setViolations((prev) =>
          prev.map((v) => (v.id === notice.violation_id ? { ...v, status: 'billed' } : v)),
        );
      }
    },
    markPaid(noticeId) {
      setNotices((prev) =>
        prev.map((n) =>
          n.id === noticeId ? { ...n, status: 'paid', last_touched_on: DEMO_TODAY } : n,
        ),
      );
    },
    recordReminder(noticeId) {
      // Stores a date only. No email, SMS, or message of any kind is sent anywhere.
      setNotices((prev) =>
        prev.map((n) =>
          n.id === noticeId
            ? { ...n, reminder_sent_at: `${DEMO_TODAY}T09:00:00Z`, last_touched_on: DEMO_TODAY }
            : n,
        ),
      );
    },
    updateNoticeAmount(noticeId, amount, basis) {
      setNotices((prev) =>
        prev.map((n) =>
          n.id === noticeId
            ? {
                ...n,
                amount,
                penalty_basis: basis,
                amount_overridden: basis.kind === 'manual',
                last_touched_on: DEMO_TODAY,
              }
            : n,
        ),
      );
    },
    warnings,
    createWarning(violationId, precautionText) {
      const id = nextWarningId();
      setWarnings((prev) => [
        ...prev,
        {
          id,
          violation_id: violationId,
          status: 'draft',
          created_on: DEMO_TODAY,
          issued_on: null,
          precaution_text: precautionText,
        },
      ]);
      return id;
    },
    // Records an issuance the agency made through its own channels — nothing is
    // sent, published, or broadcast from this app.
    markWarningIssued(warningId) {
      setWarnings((prev) =>
        prev.map((w) =>
          w.id === warningId ? { ...w, status: 'issued', issued_on: DEMO_TODAY } : w,
        ),
      );
    },
    updateWarningText(warningId, precautionText) {
      setWarnings((prev) =>
        prev.map((w) => (w.id === warningId ? { ...w, precaution_text: precautionText } : w)),
      );
    },
  };

  return <EnviroBillContext.Provider value={value}>{children}</EnviroBillContext.Provider>;
}

export function useEnviroBill(): StoreValue {
  const ctx = useContext(EnviroBillContext);
  if (!ctx) throw new Error('useEnviroBill must be used inside <EnviroBillProvider>');
  return ctx;
}

/* ---------- derived selectors ---------- */

/** Violations that have no billing notice yet. */
export function awaitingDrafting(violations: Violation[], notices: DemoNotice[]): Violation[] {
  const billed = new Set(notices.map((n) => n.violation_id));
  return violations.filter((v) => !billed.has(v.id));
}

/** Notices still in draft. */
export function awaitingApproval(notices: DemoNotice[]): DemoNotice[] {
  return notices.filter((n) => n.status === 'draft');
}

export function countsByNoticeStatus(notices: DemoNotice[]): Record<BillingNoticeStatus, number> {
  const counts: Record<BillingNoticeStatus, number> = { draft: 0, sent: 0, overdue: 0, paid: 0 };
  for (const n of notices) counts[n.status] += 1;
  return counts;
}

export function countsBySeverity(violations: Violation[]): Record<ViolationSeverity, number> {
  const counts: Record<ViolationSeverity, number> = { Low: 0, Medium: 0, High: 0 };
  for (const v of violations) counts[v.severity] += 1;
  return counts;
}

export function attentionFlagsFor(
  notice: DemoNotice,
  violation: Violation | undefined,
  allViolations: Violation[],
): AttentionFlag[] {
  const flags: AttentionFlag[] = [];
  if (violation?.severity === 'High') flags.push('high_severity');
  if (notice.amount_overridden) flags.push('amount_overridden');
  if (violation) {
    const sameLocation = allViolations.filter((v) => v.location === violation.location);
    if (sameLocation.length > 1) flags.push('repeat_location');
  }
  return flags;
}

export function noticeForViolation(
  notices: DemoNotice[],
  violationId: string,
): DemoNotice | undefined {
  return notices.find((n) => n.violation_id === violationId);
}

export function warningForViolation(
  warnings: WaterWarning[],
  violationId: string,
): WaterWarning | undefined {
  return warnings.find((w) => w.violation_id === violationId);
}

export function countsByImpactTier(violations: Violation[]): Record<ImpactTier, number> {
  const counts: Record<ImpactTier, number> = { Low: 0, Moderate: 0, Severe: 0 };
  for (const v of violations) {
    const impact = getImpactForViolation(v.id);
    if (!impact) continue;
    counts[impactTier(impact)] += 1;
  }
  return counts;
}

/** Severe-tier violations with no warning record of any status. */
export function severeWithoutWarning(
  violations: Violation[],
  warnings: WaterWarning[],
): Violation[] {
  return violations.filter((v) => {
    const impact = getImpactForViolation(v.id);
    if (!impact || impactTier(impact) !== 'Severe') return false;
    return !warnings.some((w) => w.violation_id === v.id);
  });
}
