import { billingNotices } from '@/data/billingNotices';
import { violations } from '@/data/violations';
import type { BillingNotice, Violation } from '@/types/envirobill';

/**
 * The single seam between seed data and the UI. All consumers read through these
 * helpers; raw array access stays inside this file so the source can later be
 * swapped for real fetches without changing call sites.
 */

export { violations, billingNotices };

/** All violations, most recently detected first. */
export function getViolations(): Violation[] {
  return [...violations].sort((a, b) => (a.detected_at < b.detected_at ? 1 : a.detected_at > b.detected_at ? -1 : 0));
}

export function getViolationById(id: string): Violation | undefined {
  return violations.find((v) => v.id === id);
}

export function getBillingNotices(): BillingNotice[] {
  return [...billingNotices];
}

export function getNoticeById(id: string): BillingNotice | undefined {
  return billingNotices.find((n) => n.id === id);
}

export function getNoticeForViolation(violationId: string): BillingNotice | undefined {
  return billingNotices.find((n) => n.violation_id === violationId);
}
