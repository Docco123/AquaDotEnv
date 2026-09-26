import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage, isAbortError } from '@/map/errors';
import { geocodePlace, type GeoResult } from '@/map/geo/geocoder';

export type GeocodeState =
  | { status: 'idle' }
  | { status: 'searching' }
  | { status: 'done'; results: GeoResult[] }
  | { status: 'error'; message: string };

/** Place search on submit (Nominatim allows ~1 request/s, so no search-as-you-type). */
export function useGeocode() {
  const [state, setState] = useState<GeocodeState>({ status: 'idle' });
  const active = useRef<AbortController | null>(null);

  const search = useCallback((query: string) => {
    active.current?.abort();
    const q = query.trim();
    if (!q) return setState({ status: 'idle' });
    const controller = new AbortController();
    active.current = controller;
    setState({ status: 'searching' });
    geocodePlace(q, controller.signal).then(
      (results) => {
        if (!controller.signal.aborted) setState({ status: 'done', results });
      },
      (e: unknown) => {
        if (!controller.signal.aborted && !isAbortError(e)) setState({ status: 'error', message: errorMessage(e) });
      },
    );
  }, []);

  const clear = useCallback(() => {
    active.current?.abort();
    setState({ status: 'idle' });
  }, []);

  useEffect(() => {
    const ref = active;
    return () => ref.current?.abort();
  }, []);

  return { state, search, clear };
}
