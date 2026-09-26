/** Browser-side call to POST /api/explain with an in-memory cache so toggling back doesn't re-bill. */
import type { ExplainErrorBody, ExplainRequest, ExplainResponse } from '@/lib/ai/types';

export type ExplainOutcome =
  | { status: 'ok'; data: ExplainResponse }
  | { status: 'not-configured'; hint: string }
  | { status: 'error'; message: string };

const cache = new Map<string, ExplainResponse>();

export function cachedExplanation(key: string): ExplainResponse | undefined {
  return cache.get(key);
}

export async function requestExplanation(key: string, body: ExplainRequest, signal: AbortSignal): Promise<ExplainOutcome> {
  let res: Response;
  try {
    res = await fetch('/api/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    return { status: 'error', message: 'Could not reach the summary service.' };
  }
  const payload = (await res.json().catch(() => null)) as ExplainResponse | ExplainErrorBody | null;
  if (res.status === 503) {
    return { status: 'not-configured', hint: (payload as ExplainErrorBody | null)?.hint ?? '' };
  }
  if (!res.ok || !payload || !('text' in payload)) {
    const err = payload as ExplainErrorBody | null;
    return { status: 'error', message: err?.error ?? `Summary failed (HTTP ${res.status}).` };
  }
  cache.set(key, payload);
  return { status: 'ok', data: payload };
}
