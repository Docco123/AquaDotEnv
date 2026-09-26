/**
 * Shared JSON fetcher: in-memory cache, per-request timeout, one retry on network failure,
 * and unwrapping of the error shapes used by ECHO (`Results.Error.ErrorMessage`) and ArcGIS (`error.message`).
 */
import { HTTP_CACHE_MAX, RETRY_DELAY_MS } from './config';
import { combineSignals, sleep } from '../lib/async';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly source: string,
    readonly status?: number,
  ) {
    super(`${source}: ${message}`);
    this.name = 'ApiError';
  }
}

export interface RequestOptions {
  signal?: AbortSignal;
  timeoutMs: number;
  /** Human-readable source name used in error messages, e.g. "EPA ECHO". */
  source: string;
  /** Memoise the response by URL. Never enable for ECHO QueryID pages: QueryIDs are recycled. */
  cache?: boolean;
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const cache = new Map<string, Promise<unknown>>();

export const qs = (params: Record<string, string | number>) =>
  Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

function parseBody(text: string, source: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const html = text.trimStart().startsWith('<');
    throw new ApiError(html ? 'returned a web page instead of data (service may be down)' : 'returned invalid JSON', source);
  }
}

function unwrapServiceError(json: any, source: string): void {
  const echoError = json?.Results?.Error?.ErrorMessage;
  if (echoError) throw new ApiError(String(echoError), source);
  const arcgisError = json?.error?.message;
  if (arcgisError) throw new ApiError(String(arcgisError), source, Number(json.error.code) || undefined);
}

async function fetchOnce(url: string, opts: RequestOptions): Promise<unknown> {
  const signal = combineSignals(opts.signal, opts.timeoutMs);
  const res = await fetch(url, { signal });
  const text = await res.text();
  if (!res.ok) throw new ApiError(`HTTP ${res.status}`, opts.source, res.status);
  const json = parseBody(text, opts.source);
  unwrapServiceError(json, opts.source);
  return json;
}

function isRetryable(err: unknown, callerSignal?: AbortSignal): boolean {
  if (callerSignal?.aborted) return false;
  if (err instanceof ApiError) return err.status !== undefined && RETRYABLE_STATUS.has(err.status);
  const name = (err as Error)?.name;
  return name === 'TypeError' || name === 'TimeoutError' || name === 'AbortError';
}

async function fetchWithRetry(url: string, opts: RequestOptions): Promise<unknown> {
  try {
    return await fetchOnce(url, opts);
  } catch (err) {
    if (!isRetryable(err, opts.signal)) throw toApiError(err, opts);
    await sleep(RETRY_DELAY_MS, opts.signal);
    try {
      return await fetchOnce(url, opts);
    } catch (err2) {
      throw toApiError(err2, opts);
    }
  }
}

function toApiError(err: unknown, opts: RequestOptions): Error {
  if (err instanceof ApiError) return err;
  if (opts.signal?.aborted) return err as Error; // caller cancelled: propagate the AbortError untouched
  const name = (err as Error)?.name;
  if (name === 'TimeoutError' || name === 'AbortError') return new ApiError(`timed out after ${opts.timeoutMs / 1000} s`, opts.source);
  return new ApiError(`network error (${(err as Error)?.message ?? err})`, opts.source);
}

function remember(url: string, p: Promise<unknown>): void {
  if (cache.size >= HTTP_CACHE_MAX) cache.delete(cache.keys().next().value as string);
  cache.set(url, p);
  p.catch(() => cache.delete(url));
}

/** GET a JSON document. Throws ApiError with a friendly, source-prefixed message. */
export async function getJson<T = any>(url: string, opts: RequestOptions): Promise<T> {
  if (!opts.cache) return (await fetchWithRetry(url, opts)) as T;
  let p = cache.get(url);
  if (!p) {
    // The shared request is not tied to any one caller's signal; each caller can still abort its own wait.
    p = fetchWithRetry(url, { ...opts, signal: undefined });
    remember(url, p);
  }
  return (await raceAbort(p, opts.signal)) as T;
}

function raceAbort<T>(p: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return p;
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener('abort', onAbort, { once: true });
    p.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}
