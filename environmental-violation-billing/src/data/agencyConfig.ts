import type { PenaltyRate, SeverityMultiplier } from '@/types/envirobill-ui';

/**
 * THE CONFIGURATION SURFACE FOR THIS DEMO.
 *
 * Everything a real customer agency would set for itself lives in this one file:
 * the letterhead, the penalty rate table and the severity multipliers. There is
 * deliberately no settings screen — edit the values here.
 *
 * Nothing in this file is an official EPA figure. The amounts are illustrative
 * demo numbers chosen so the walkthrough reads plausibly.
 */

export const agencyConfig = {
  name: 'Riverbend County Environmental Agency',
  department: 'Water Quality Enforcement Division',
  addressLines: ['214 Mill Street, Suite 300', 'Riverbend, ST 41822'],
  contactLine: 'enforcement@riverbendcounty.example · (555) 0142-8800',
  sealPlaceholderText: 'AGENCY SEAL',
};

/** One row per violation type present in the seed data. Amounts are integer USD cents. */
export const penaltyRates: PenaltyRate[] = [
  {
    violation_type: 'illegal discharge',
    base_amount: 625000,
    note: 'Base rate for an unpermitted discharge to a surface water body.',
  },
  {
    violation_type: 'unauthorized runoff',
    base_amount: 150000,
    note: 'Base rate for stormwater leaving a site without required controls.',
  },
  {
    violation_type: 'sediment discharge',
    base_amount: 225000,
    note: 'Base rate for sediment reaching a drainage feature from an unstabilized area.',
  },
  {
    violation_type: 'unpermitted fill',
    base_amount: 237500,
    note: 'Base rate for placement of fill in a protected buffer or wetland.',
  },
  {
    violation_type: 'improper waste storage',
    base_amount: 90000,
    note: 'Base rate for waste stored outside a designated containment area.',
  },
];

/** Applied to the base rate for the violation's severity. */
export const severityMultipliers: SeverityMultiplier = {
  Low: 0.5,
  Medium: 1,
  High: 2,
};

/** Used when a violation type has no matching row above. */
export const fallbackRate: PenaltyRate = {
  violation_type: 'other',
  base_amount: 100000,
  note: 'Default base rate used when no specific rate is configured for this violation type.',
};

/**
 * THE DEMO CLOCK. Every "age" or "days" figure in the app derives from this
 * constant — never from the system clock — so the demo reads identically today,
 * next week and on stage.
 */
export const DEMO_TODAY = '2024-06-01';

/** Number of days after DEMO_TODAY that a newly generated notice falls due. */
export const DEFAULT_DUE_DAYS = 30;

/** Shown next to every amount in the app. */
export const DEMO_FIGURE_NOTICE = 'Demo figures — not official EPA penalty amounts.';
