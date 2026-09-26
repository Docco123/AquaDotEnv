import type { BillingNotice, ViolationSeverity } from '@/types/envirobill';

/** A base penalty rate for a violation type. Amounts are integer USD cents. */
export interface PenaltyRate {
  violation_type: string;
  /** Integer USD cents. */
  base_amount: number;
  /** Plain-words description of what this rate is based on. */
  note: string;
}

/** Multiplier applied to the base rate, keyed by severity. */
export type SeverityMultiplier = Record<ViolationSeverity, number>;

/** Human-readable explanation of how a notice amount was arrived at. */
export interface PenaltyBasis {
  kind: 'calculated' | 'manual';
  text: string;
}

/** A billing notice plus the demo-only fields the UI layer tracks. */
export interface DemoNotice extends BillingNotice {
  penalty_basis: PenaltyBasis;
  amount_overridden: boolean;
  /** ISO date, "YYYY-MM-DD" — seeded or set from the seeded "today". */
  last_touched_on: string;
}

export type AttentionFlag = 'high_severity' | 'amount_overridden' | 'repeat_location';
