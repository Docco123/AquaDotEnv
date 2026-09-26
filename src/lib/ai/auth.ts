/// <reference types="node" />
/**
 * SERVER ONLY. Mints OAuth2 access tokens for Vertex AI with Node built-ins:
 *  - service_account: RS256-signed JWT assertion exchanged at the token endpoint (jwt-bearer grant)
 *  - authorized_user: refresh_token grant (credentials from `gcloud auth application-default login`)
 * Tokens are cached in memory until ~1 minute before expiry. Tokens are never logged.
 */
import { createSign } from 'node:crypto';
import type { AuthorizedUserCredentials, LoadedCredentials, ServiceAccountCredentials } from './credentials';
import { AiError } from './errors';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
const JWT_LIFETIME_SEC = 3600;
const EXPIRY_MARGIN_MS = 60_000;

interface CachedToken {
  token: string;
  expiresAt: number;
}

const tokenCache = new Map<string, CachedToken>();
const inFlight = new Map<string, Promise<CachedToken>>();

export interface TokenDeps {
  fetch?: typeof fetch;
  now?: () => number;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

export function buildServiceAccountAssertion(sa: ServiceAccountCredentials, nowMs: number): string {
  const iat = Math.floor(nowMs / 1000);
  const header = { alg: 'RS256', typ: 'JWT', ...(sa.private_key_id ? { kid: sa.private_key_id } : {}) };
  const claims = { iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat, exp: iat + JWT_LIFETIME_SEC };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(sa.private_key);
  return `${unsigned}.${base64url(signature)}`;
}

function grantParams(loaded: LoadedCredentials, nowMs: number): URLSearchParams {
  const { credentials } = loaded;
  if (credentials.type === 'service_account') {
    return new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: buildServiceAccountAssertion(credentials, nowMs),
    });
  }
  const user: AuthorizedUserCredentials = credentials;
  return new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: user.client_id,
    client_secret: user.client_secret,
    refresh_token: user.refresh_token,
  });
}

function tokenError(status: number, payload: Record<string, unknown>, loaded: LoadedCredentials): AiError {
  const code = typeof payload.error === 'string' ? payload.error : `HTTP ${status}`;
  const detail = typeof payload.error_description === 'string' ? `: ${payload.error_description}` : '';
  const hint =
    loaded.credentials.type === 'authorized_user'
      ? 'Run `gcloud auth application-default login` again, then retry.'
      : 'Check that the service-account key is still active in Google Cloud IAM.';
  return new AiError('auth', `Google rejected the ${loaded.source} credentials (${code}${detail}).`, {
    status: 502,
    hint,
    upstreamStatus: status,
  });
}

async function requestToken(loaded: LoadedCredentials, signal: AbortSignal, deps: TokenDeps): Promise<CachedToken> {
  const now = deps.now ?? Date.now;
  const doFetch = deps.fetch ?? fetch;
  const res = await doFetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: grantParams(loaded, now()).toString(),
    signal,
  });
  const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || typeof payload.access_token !== 'string') throw tokenError(res.status, payload, loaded);
  const expiresInSec = typeof payload.expires_in === 'number' ? payload.expires_in : 3600;
  return { token: payload.access_token, expiresAt: now() + expiresInSec * 1000 };
}

/** Returns a cached token when it has more than a minute left, otherwise mints a new one. */
export async function getAccessToken(loaded: LoadedCredentials, signal: AbortSignal, deps: TokenDeps = {}): Promise<string> {
  const now = deps.now ?? Date.now;
  const cached = tokenCache.get(loaded.cacheKey);
  if (cached && cached.expiresAt - EXPIRY_MARGIN_MS > now()) return cached.token;

  let pending = inFlight.get(loaded.cacheKey);
  if (!pending) {
    pending = requestToken(loaded, signal, deps).finally(() => inFlight.delete(loaded.cacheKey));
    inFlight.set(loaded.cacheKey, pending);
  }
  const fresh = await pending;
  tokenCache.set(loaded.cacheKey, fresh);
  return fresh.token;
}

export function clearTokenCache(): void {
  tokenCache.clear();
}
