import { fmtHours, fmtMiles } from '@/theme';

const MPH_PER_MPS = 2.236936;
const MILES_PER_KM = 0.621371;

export const kmToMiles = (km: number) => km * MILES_PER_KM;

/** "31 river miles" style label for a navigation distance. */
export const riverMiles = (km: number) => `${Math.round(kmToMiles(km))} river miles`;

/** "~1.1 mph" from a velocity in m/s. */
export const flowSpeed = (mps: number) => `~${(mps * MPH_PER_MPS).toFixed(1)} mph`;

/** Travel time in hours for water to cover `km` at `mps`, or null when unknown. */
export function travelHours(km: number | null, mps: number): number | null {
  if (km === null || !(mps > 0)) return null;
  return (km * 1000) / mps / 3600;
}

/** "3.2 mi · ~4.1 h" — distance and travel time, whichever are known. */
export function distanceAndTravel(km: number | null, hours: number | null): string {
  if (km === null) return 'Off the traced network';
  return hours === null ? fmtMiles(km) : `${fmtMiles(km)} · ~${fmtHours(hours)}`;
}

/** "Mar 3, 2:15 PM" for an ISO timestamp, or null when missing/invalid. */
export function shortDateTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export const formatLatLng = (lat: number, lng: number) => `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
