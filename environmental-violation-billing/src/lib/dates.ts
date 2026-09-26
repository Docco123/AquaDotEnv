import { DEMO_TODAY } from '@/data/agencyConfig';

/**
 * Pure date helpers. No Date.now() anywhere — "today" is always DEMO_TODAY.
 */

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function datePart(iso: string): string {
  return iso.slice(0, 10);
}

/** "2024-05-14T06:41:00Z" -> "14 May 2024" */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = datePart(iso).split('-');
  const monthIndex = Number(m) - 1;
  const month = MONTHS[monthIndex] ?? m;
  return `${Number(d)} ${month} ${y}`;
}

function toDayNumber(iso: string): number {
  const [y, m, d] = datePart(iso).split('-').map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1) / 86400000;
}

/** Whole days from isoA to isoB (positive when isoB is later). */
export function daysBetween(isoA: string, isoB: string): number {
  return Math.round(toDayNumber(isoB) - toDayNumber(isoA));
}

/** Days between the given date and the seeded demo "today". */
export function ageInDays(iso: string): number {
  return daysBetween(iso, DEMO_TODAY);
}

/** Adds whole days to an ISO date, returning "YYYY-MM-DD". */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = datePart(iso).split('-').map(Number);
  const ms = Date.UTC(y, (m ?? 1) - 1, (d ?? 1) + days);
  const next = new Date(ms);
  const yy = next.getUTCFullYear();
  const mm = String(next.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(next.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}
