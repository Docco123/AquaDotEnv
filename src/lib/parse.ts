/** Parsers for the loosely-typed strings EPA/USGS services return. */

/** "12,908,903" / "$6,524" / "11%" / "--" / null -> number | null */
export const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '' || v === '--') return null;
  const n = Number(String(v).replace(/[,$%\s]/g, ''));
  return Number.isFinite(n) ? n : null;
};

/** ECHO list columns use "|" or " | " separators. */
export const splitList = (v: unknown): string[] =>
  v ? String(v).split('|').map((s) => s.trim()).filter(Boolean) : [];

export const joinList = (v: unknown): string | null => {
  const items = splitList(v);
  return items.length ? items.join(', ') : null;
};

/** "02/15/2022" (MM/DD/YYYY) -> "2022-02-15" */
export function usDateToIso(v: unknown): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(v ?? ''));
  return m ? `${m[3]}-${m[1]}-${m[2]}` : null;
}

const MONTHS: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
};
/** Oracle RR century rule: two-digit years 00-49 are 20xx, 50-99 are 19xx. */
const RR_PIVOT = 50;

/** "30-SEP-25" (Oracle DD-MON-RR) -> "2025-09-30" */
export function oracleDateToIso(v: unknown): string | null {
  const m = /^(\d{1,2})-([A-Z]{3})-(\d{2}|\d{4})$/i.exec(String(v ?? ''));
  if (!m || !MONTHS[m[2].toUpperCase()]) return null;
  const yy = m[3];
  const year = yy.length === 4 ? yy : `${Number(yy) < RR_PIVOT ? '20' : '19'}${yy}`;
  return `${year}-${MONTHS[m[2].toUpperCase()]}-${m[1].padStart(2, '0')}`;
}
