import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** False during SSR and the hydration render, true afterwards: gate client-only values to avoid mismatches. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
