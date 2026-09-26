/** True for fetch/AbortController cancellations, which are never shown to users. */
export function isAbortError(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { name?: unknown }).name === 'AbortError';
}

/** A short, human-readable message for any thrown value. */
export function errorMessage(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e ?? '');
  if (/failed to fetch|networkerror|load failed/i.test(raw)) {
    return 'Could not reach a public data service. Check your connection and try again.';
  }
  return raw.trim() || 'Something went wrong.';
}
