import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import { errorMessage, isAbortError } from '@/map/errors';

interface Entry<T> {
  key: string;
  data: T | null;
  error: string | null;
}

export interface AsyncResource<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  retry(): void;
}

/**
 * Loads data for `key` (null = nothing to load). Changing the key aborts the
 * old request; results are stored against their key, so stale data never shows.
 */
export function useAsyncResource<T>(key: string | null, load: (signal: AbortSignal) => Promise<T>): AsyncResource<T> {
  const [attempt, setAttempt] = useState(0);
  const [entry, setEntry] = useState<Entry<T> | null>(null);
  const requestKey = key === null ? null : `${key}#${attempt}`;
  const runLoad = useEffectEvent(load);

  useEffect(() => {
    if (requestKey === null) return;
    const controller = new AbortController();
    runLoad(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setEntry({ key: requestKey, data, error: null });
      },
      (e: unknown) => {
        if (!controller.signal.aborted && !isAbortError(e)) setEntry({ key: requestKey, data: null, error: errorMessage(e) });
      },
    );
    return () => controller.abort();
  }, [requestKey]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);
  const current = entry && entry.key === requestKey ? entry : null;
  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: requestKey !== null && current === null,
    retry,
  };
}
