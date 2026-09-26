import { fallbackRate, penaltyRates, severityMultipliers } from '@/data/agencyConfig';
import { formatAmount } from '@/lib/currency';
import type { Violation } from '@/types/envirobill';
import type { PenaltyBasis, PenaltyRate } from '@/types/envirobill-ui';

/** The configured rate for a violation type, or the fallback rate. */
export function rateForType(violationType: string): PenaltyRate {
  return penaltyRates.find((r) => r.violation_type === violationType) ?? fallbackRate;
}

/** Suggested penalty in integer USD cents: base rate x severity multiplier. */
export function suggestAmount(violation: Violation): number {
  const rate = rateForType(violation.violation_type);
  const multiplier = severityMultipliers[violation.severity];
  return Math.round(rate.base_amount * multiplier);
}

/** Explains how a final amount relates to the suggested amount. */
export function describeBasis(
  violation: Violation,
  finalAmount: number,
  suggested: number,
): PenaltyBasis {
  const rate = rateForType(violation.violation_type);
  const multiplier = severityMultipliers[violation.severity];

  if (finalAmount === suggested) {
    return {
      kind: 'calculated',
      text: `${rate.violation_type} base rate ${formatAmount(rate.base_amount)} x ${multiplier} (${violation.severity} severity) = ${formatAmount(suggested)}.`,
    };
  }

  return {
    kind: 'manual',
    text: `Amount set manually to ${formatAmount(finalAmount)}. The configured calculation suggested ${formatAmount(suggested)} (${rate.violation_type} base rate ${formatAmount(rate.base_amount)} x ${multiplier} for ${violation.severity} severity).`,
  };
}
