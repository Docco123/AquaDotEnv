/**
 * Explainer configuration: tunables and environment-variable resolution.
 * Env names are documented in .env.example and README ("AI explainer (Vertex AI)").
 */
import { AiError } from './errors';
import type { AiEnv } from './types';

export const AI_DEFAULTS = {
  /** Current GA fast/budget Gemini model (Vertex model list, Sept 2026). Override with VERTEX_MODEL. */
  model: 'gemini-3.5-flash-lite',
  /** Gemini 3.5 models are served from the global endpoint (and the us/eu multi-regions). */
  location: 'global',
  temperature: 0.3,
  /** Budget for the visible answer (~220 words needs ~350 tokens). */
  maxOutputTokens: 900,
  /** Extra room when a model is asked to think at LOW level, since thoughts count toward the limit. */
  thinkingHeadroomTokens: 1024,
  timeoutMs: 40_000,
  maxBodyBytes: 120 * 1024,
} as const;

export interface AiConfig {
  model: string;
  project: string | null;
  location: string;
  vertexApiKey: string | null;
  geminiApiKey: string | null;
  /** Service-account JSON pasted into an env var (hosted deploys). */
  inlineCredentialsJson: string | null;
  /** Path from GOOGLE_APPLICATION_CREDENTIALS. */
  credentialsPath: string | null;
}

const MODEL_ID = /^[a-z0-9][a-z0-9.\-]*$/i;
const LOCATION_ID = /^[a-z0-9-]+$/;
const PROJECT_ID = /^[a-z0-9][a-z0-9.:\-]*$/;

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function firstSet(env: AiEnv, names: string[]): string | null {
  for (const name of names) {
    const value = clean(env[name]);
    if (value) return value;
  }
  return null;
}

function checked(value: string, pattern: RegExp, name: string): string {
  if (!pattern.test(value)) {
    throw new AiError('config', `${name} has an invalid value.`, { status: 500, hint: `Fix ${name} in .env.` });
  }
  return value;
}

export function readAiConfig(env: AiEnv): AiConfig {
  const project = firstSet(env, ['VERTEX_PROJECT', 'GOOGLE_CLOUD_PROJECT']);
  const location = firstSet(env, ['VERTEX_LOCATION', 'GOOGLE_CLOUD_LOCATION']) ?? AI_DEFAULTS.location;
  const model = clean(env.VERTEX_MODEL) ?? AI_DEFAULTS.model;
  return {
    model: checked(model, MODEL_ID, 'VERTEX_MODEL'),
    project: project ? checked(project, PROJECT_ID, 'VERTEX_PROJECT') : null,
    location: checked(location.toLowerCase(), LOCATION_ID, 'VERTEX_LOCATION'),
    vertexApiKey: clean(env.VERTEX_API_KEY),
    geminiApiKey: clean(env.GEMINI_API_KEY),
    inlineCredentialsJson: clean(env.GOOGLE_SERVICE_ACCOUNT_JSON),
    credentialsPath: clean(env.GOOGLE_APPLICATION_CREDENTIALS),
  };
}
