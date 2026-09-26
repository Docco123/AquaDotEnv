import type { Violation } from '@/types/envirobill';
import type { ImpactTier, ViolationImpact } from '@/types/envirobill-impact';

/**
 * The impact tier rule, stated once, used everywhere, and printed on screen so
 * a case manager can see exactly why a case landed where it did. The thresholds
 * here are what a real customer agency would set for itself.
 */
export const IMPACT_TIER_RULE =
  'Severe: 1,000 or more households exposed, or a drinking-water intake within 8 km. ' +
  'Moderate: 250 or more households exposed, or an intake within 15 km, or 100 or more acres of farmland affected. ' +
  'Otherwise Low.';

/** Shown next to every impact figure in the app. */
export const DEMO_ESTIMATE_NOTICE =
  'Demo estimates — illustrative figures, not measured or modelled data.';

/** Derived at call time. The tier is never stored on the seed rows. */
export function impactTier(impact: ViolationImpact): ImpactTier {
  if (impact.households_exposed >= 1000 || impact.intake_distance_km <= 8) {
    return 'Severe';
  }
  if (
    impact.households_exposed >= 250 ||
    impact.intake_distance_km <= 15 ||
    impact.farmland_acres_affected >= 100
  ) {
    return 'Moderate';
  }
  return 'Low';
}

export function tierRank(tier: ImpactTier): number {
  return tier === 'Severe' ? 3 : tier === 'Moderate' ? 2 : 1;
}

export function needsWarning(tier: ImpactTier): boolean {
  return tier === 'Moderate' || tier === 'Severe';
}

/** Plain-language advice, pre-filled and fully editable before printing. */
export function defaultPrecautionText(violation: Violation, impact: ViolationImpact): string {
  return [
    `Residents and landholders near ${impact.waterway_name} (downstream of ${violation.location}) are advised to avoid contact with the water until further notice.`,
    `Do not use water drawn from ${impact.waterway_name} for drinking, cooking, bathing or livestock watering, and do not irrigate ${impact.primary_land_use.toLowerCase()} from it.`,
    `This advice applies to approximately ${impact.downstream_km_affected} km downstream of the site and will be withdrawn once follow-up sampling confirms the waterway has returned to normal condition.`,
  ].join(' ');
}
