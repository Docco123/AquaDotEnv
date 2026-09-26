/**
 * SERVER ONLY. Opens a streamGenerateContent?alt=sse call using the same credential order as providers.ts:
 * VERTEX_API_KEY (express) -> Google credentials (ADC / service account) -> GEMINI_API_KEY -> 503.
 * Streaming uses the generateContent paths with :streamGenerateContent and `alt=sse`
 * (ai.google.dev/api/generate-content#method:-models.streamgeneratecontent). URLs may hold a key: never log them.
 */
import { getAccessToken, type TokenDeps } from './auth';
import type { AiConfig } from './config';
import { loadGoogleCredentials, resolveProject } from './credentials';
import { vertexHost } from './endpoints';
import { notConfiguredError } from './errors';
import type { AiEnv, ExplainMode } from './types';
import { readGoogleError, UpstreamHttpError } from './vertex';

export interface StreamTarget {
  mode: ExplainMode;
  /** Resolves the URL and auth headers for one call (mints/reuses an OAuth token when needed). */
  resolve(model: string, signal: AbortSignal): Promise<{ url: string; headers: Record<string, string> }>;
}

export interface UpstreamDeps extends TokenDeps {
  fetch?: typeof fetch;
}

const STREAM = 'streamGenerateContent?alt=sse';
const NO_PROJECT_HINT = 'Found Google credentials but no project. Set VERTEX_PROJECT in .env and restart the dev server.';

const modelSegment = (model: string) => `publishers/google/models/${encodeURIComponent(model)}:${STREAM}`;

export function selectStreamTarget(config: AiConfig, env: AiEnv, deps: UpstreamDeps = {}): StreamTarget {
  const { vertexApiKey, geminiApiKey, location } = config;
  if (vertexApiKey) {
    return {
      mode: 'vertex-express',
      resolve: async (model) => ({ url: `https://aiplatform.googleapis.com/v1/${modelSegment(model)}&key=${encodeURIComponent(vertexApiKey)}`, headers: {} }),
    };
  }
  const loaded = loadGoogleCredentials(config, env);
  const project = loaded ? resolveProject(config, loaded) : null;
  if (loaded && project) {
    const isUser = loaded.credentials.type === 'authorized_user';
    return {
      mode: isUser ? 'vertex-adc' : 'vertex-sa',
      async resolve(model, signal) {
        const token = await getAccessToken(loaded, signal, deps);
        const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
        // User credentials have no project of their own: bill/quota the configured project explicitly.
        if (isUser) headers['x-goog-user-project'] = project;
        const path = `projects/${encodeURIComponent(project)}/locations/${encodeURIComponent(location)}/${modelSegment(model)}`;
        return { url: `https://${vertexHost(location)}/v1/${path}`, headers };
      },
    };
  }
  if (geminiApiKey) {
    return {
      mode: 'gemini',
      resolve: async (model) => ({
        url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:${STREAM}`,
        headers: { 'x-goog-api-key': geminiApiKey },
      }),
    };
  }
  throw loaded ? notConfiguredError(NO_PROJECT_HINT) : notConfiguredError();
}

/** POSTs the body and returns the OK streaming response; error statuses throw UpstreamHttpError. */
export async function openStream(target: StreamTarget, model: string, body: unknown, signal: AbortSignal, deps: UpstreamDeps = {}): Promise<Response> {
  const { url, headers } = await target.resolve(model, signal);
  const doFetch = deps.fetch ?? fetch;
  const res = await doFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', ...headers },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new UpstreamHttpError(await readGoogleError(res));
  if (!res.body) throw new UpstreamHttpError({ httpStatus: 502, status: null, message: 'Empty stream body', reasons: [] });
  return res;
}
