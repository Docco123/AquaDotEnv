/**
 * Travel-time estimate. Preferred velocity: NHDPlus V2 EROM gage-adjusted mean-annual velocity (VA_MA) of the pin's
 * reach. Fallback: ~0.5 m/s (about 1.1 mph), typical of a low-gradient river at moderate flow. One velocity is applied
 * to the whole path, so times are indicative only (real velocity varies with flow and along the river).
 */
export const DEFAULT_VELOCITY_MPS = 0.5;
/** Mean-annual velocities outside this band (lakes, artificial paths, bad data) fall back to the default. */
const MIN_PLAUSIBLE_MPS = 0.1;
const MAX_PLAUSIBLE_MPS = 2.5;
const SECONDS_PER_HOUR = 3600;
const METERS_PER_KM = 1000;

export interface VelocityChoice {
  velocityMps: number;
  source: string;
}

export function chooseVelocity(meanAnnualMps: number | null): VelocityChoice {
  if (meanAnnualMps !== null && meanAnnualMps >= MIN_PLAUSIBLE_MPS && meanAnnualMps <= MAX_PLAUSIBLE_MPS) {
    return { velocityMps: meanAnnualMps, source: 'NHDPlus V2 EROM mean-annual velocity at the pin reach (EPA WATERS)' };
  }
  return { velocityMps: DEFAULT_VELOCITY_MPS, source: 'assumed ~0.5 m/s (about 1.1 mph), typical low-gradient river' };
}

export function travelHours(riverKm: number | null, velocityMps: number): number | null {
  if (riverKm === null || velocityMps <= 0) return null;
  return (riverKm * METERS_PER_KM) / velocityMps / SECONDS_PER_HOUR;
}
