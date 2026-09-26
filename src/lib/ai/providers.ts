/**
 * SERVER ONLY. Picks the backend from the environment and runs one generateContent call.
 * Priority: VERTEX_API_KEY (express mode, falls back to the Gemini API if Vertex rejects the key)
 *        -> Google credentials (service-account JSON / GOOGLE_APPLICATION_CREDENTIALS / gcloud ADC)
 *        -> GEMINI_API_KEY
 *        -> not configured (503).
 */
import { getAccessToken, type TokenDeps } from './auth';
import type { AiConfig } from './config';
import { loadGoogleCredentials, resolveProject, type LoadedCredentials } from './credentials';
import { geminiApiUrl, vertexExpressUrl, vertexProjectUrl } from './endpoints';
import { notConfiguredError } from './errors';
import type { GenerateInput, GenerateResult } from './generate';
import type { AiEnv, ExplainMode } from './types';
import { callGenerateContent, UpstreamHttpError } from './vertex';

export interface ProviderResult extends GenerateResult {
  mode: ExplainMode;
}

export interface Provider {
  mode: ExplainMode;
  generate(input: GenerateInput, signal: AbortSignal): Promise<ProviderResult>;
}

export interface ProviderDeps extends TokenDeps {
  fetch?: typeof fetch;
}

// ---------------------------------------------------------------- API-key modes

async function callGemini(apiKey: string, input: GenerateInput, signal: AbortSignal, deps: ProviderDeps): Promise<ProviderResult> {
  const result = await callGenerateContent({
    url: geminiApiUrl(input.model),
    headers: { 'x-goog-api-key': apiKey },
    input,
    signal,
    fetch: deps.fetch,
  });
  return { ...result, mode: 'gemini' };
}

/** Vertex express mode rejects Gemini-Developer keys with 400/401/403 and a key/auth message. */
export function isKeyRejection(error: unknown): boolean {
  if (!(error instanceof UpstreamHttpError)) return false;
  const { httpStatus, status, message, reasons } = error.info;
  if (![400, 401, 403].includes(httpStatus)) return false;
  const text = `${status ?? ''} ${message} ${reasons.join(' ')}`;
  return /API[_ ]?KEY|UNAUTHENTICATED|PERMISSION_DENIED|credential|express mode/i.test(text);
}

function expressProvider(apiKey: string, deps: ProviderDeps): Provider {
  return {
    mode: 'vertex-express',
    async generate(input, signal) {
      try {
        const result = await callGenerateContent({ url: vertexExpressUrl(input.model, apiKey), headers: {}, input, signal, fetch: deps.fetch });
        return { ...result, mode: 'vertex-express' };
      } catch (error) {
        if (!isKeyRejection(error)) throw error;
        // Many "Vertex keys" are really Gemini Developer API keys (AI Studio). Same body, different host.
        return callGemini(apiKey, input, signal, deps);
      }
    },
  };
}

function geminiProvider(apiKey: string, deps: ProviderDeps): Provider {
  return { mode: 'gemini', generate: (input, signal) => callGemini(apiKey, input, signal, deps) };
}

// ---------------------------------------------------------------- OAuth (ADC / service account)

function oauthProvider(loaded: LoadedCredentials, project: string, location: string, deps: ProviderDeps): Provider {
  const isUser = loaded.credentials.type === 'authorized_user';
  const mode: ExplainMode = isUser ? 'vertex-adc' : 'vertex-sa';

  const callAt = async (loc: string, input: GenerateInput, signal: AbortSignal) => {
    const token = await getAccessToken(loaded, signal, deps);
    // User credentials have no project of their own: bill/quota the configured project explicitly.
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (isUser) headers['x-goog-user-project'] = project;
    return callGenerateContent({ url: vertexProjectUrl(project, loc, input.model), headers, input, signal, fetch: deps.fetch });
  };

  return {
    mode,
    async generate(input, signal) {
      try {
        return { ...(await callAt(location, input, signal)), mode };
      } catch (error) {
        // Newer models (e.g. Gemini 3.5) are only served from the global endpoint; retry there once.
        const notInRegion = error instanceof UpstreamHttpError && error.info.httpStatus === 404 && location !== 'global';
        if (!notInRegion) throw error;
        return { ...(await callAt('global', input, signal)), mode };
      }
    },
  };
}

// ---------------------------------------------------------------- selection

const NO_PROJECT_HINT = 'Found Google credentials but no project. Set VERTEX_PROJECT in .env and restart the dev server.';

export function selectProvider(config: AiConfig, env: AiEnv, deps: ProviderDeps = {}): Provider {
  if (config.vertexApiKey) return expressProvider(config.vertexApiKey, deps);

  const loaded = loadGoogleCredentials(config, env);
  const project = loaded ? resolveProject(config, loaded) : null;
  if (loaded && project) return oauthProvider(loaded, project, config.location, deps);

  if (config.geminiApiKey) return geminiProvider(config.geminiApiKey, deps);
  throw loaded ? notConfiguredError(NO_PROJECT_HINT) : notConfiguredError();
}

