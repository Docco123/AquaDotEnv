import { useWindowDimensions } from 'react-native';
import { useHydrated } from '@/components/motion';

export const CONTAINER_MAX = 1120;
export const GUTTER = 20;
/** At or above this width the page uses multi-column layouts. */
export const WIDE_MIN = 860;
/** Below this width even 2-up grids collapse to one column. */
export const NARROW_MAX = 560;
/** Assumed width for SSR + the hydration render (mobile-first, so no overflow before JS runs). */
const SSR_WIDTH = 375;

export type Layout = { width: number; isWide: boolean; isNarrow: boolean };

/** Responsive breakpoints from useWindowDimensions, hydration-safe (server and first client render agree). */
export function useLayout(): Layout {
  const { width } = useWindowDimensions();
  const hydrated = useHydrated();
  const w = hydrated && width > 0 ? width : SSR_WIDTH;
  return { width: w, isWide: w >= WIDE_MIN, isNarrow: w < NARROW_MAX };
}
