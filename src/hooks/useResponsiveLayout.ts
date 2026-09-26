import { useSyncExternalStore } from 'react';
import { useWindowDimensions } from 'react-native';
import { LAYOUT } from '@/map/config';

const subscribe = () => () => {};

/** False during server render and hydration, true afterwards (avoids hydration mismatches). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/** Wide = map + side panel; narrow = map on top (45% height) with the panel below. */
export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const hydrated = useHydrated();
  const wide = !hydrated || width >= LAYOUT.wideBreakpoint;
  return { wide, narrowMapHeight: Math.round(height * LAYOUT.narrowMapRatio) };
}
