export type ViolationSeverity = 'Low' | 'Medium' | 'High';

export type ViolationStatus = 'new' | 'reviewed' | 'billed';

export type BillingNoticeStatus = 'draft' | 'sent' | 'overdue' | 'paid';

export interface Violation {
  id: string;
  location: string;
  violation_type: string;
  severity: ViolationSeverity;
  /** ISO 8601 timestamp, UTC. */
  detected_at: string;
  status: ViolationStatus;
  /** Always opens with the AI-detection framing sentence. */
  description: string;
  /** Internal provenance flag — always "seeded_demo". Never rendered in the UI. */
  source: string;
}

export interface BillingNotice {
  id: string;
  /** References Violation.id */
  violation_id: string;
  /** USD cents, integer (e.g. 1250000 = $12,500.00). */
  amount: number;
  status: BillingNoticeStatus;
  /** ISO date only, "YYYY-MM-DD". */
  due_date: string;
  /** ISO 8601 timestamp or null. */
  sent_at: string | null;
  /** ISO 8601 timestamp or null. */
  reminder_sent_at: string | null;
}
