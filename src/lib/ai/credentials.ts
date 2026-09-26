/// <reference types="node" />
/**
 * SERVER ONLY. Locates Google credentials the same way Application Default Credentials does:
 *   1. GOOGLE_SERVICE_ACCOUNT_JSON (inline JSON, for hosted deploys)
 *   2. GOOGLE_APPLICATION_CREDENTIALS (path to a JSON file)
 *   3. gcloud's well-known file written by `gcloud auth application-default login`
 * File contents are never logged or returned.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { AiConfig } from './config';
import { AiError } from './errors';
import type { AiEnv } from './types';

export interface ServiceAccountCredentials {
  type: 'service_account';
  client_email: string;
  private_key: string;
  private_key_id?: string;
  project_id?: string;
}

export interface AuthorizedUserCredentials {
  type: 'authorized_user';
  client_id: string;
  client_secret: string;
  refresh_token: string;
}

export type GoogleCredentials = ServiceAccountCredentials | AuthorizedUserCredentials;

export type CredentialSource = 'GOOGLE_SERVICE_ACCOUNT_JSON' | 'GOOGLE_APPLICATION_CREDENTIALS' | 'gcloud ADC file';

export interface LoadedCredentials {
  source: CredentialSource;
  credentials: GoogleCredentials;
  /** Stable, non-reversible id for the token cache. */
  cacheKey: string;
}

const ADC_FILE = 'application_default_credentials.json';

/** Where `gcloud auth application-default login` writes credentials on this OS. */
export function wellKnownAdcPath(env: AiEnv, platform: string = process.platform): string {
  const configDir = env.CLOUDSDK_CONFIG?.trim();
  if (configDir) return join(configDir, ADC_FILE);
  if (platform === 'win32') {
    const appData = env.APPDATA?.trim() || join(homedir(), 'AppData', 'Roaming');
    return join(appData, 'gcloud', ADC_FILE);
  }
  return join(homedir(), '.config', 'gcloud', ADC_FILE);
}

function configError(message: string, hint: string): AiError {
  return new AiError('config', message, { status: 500, hint });
}

function hasStrings(obj: Record<string, unknown>, keys: string[]): boolean {
  return keys.every((key) => typeof obj[key] === 'string' && (obj[key] as string).length > 0);
}

export function parseCredentials(raw: string, source: CredentialSource): GoogleCredentials {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw configError(`Credentials from ${source} are not valid JSON.`, 'Re-download the key file or re-run `gcloud auth application-default login`.');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw configError(`Credentials from ${source} are not a JSON object.`, 'Check the credentials file.');
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.type === 'service_account' && hasStrings(obj, ['client_email', 'private_key'])) {
    return obj as unknown as ServiceAccountCredentials;
  }
  if (obj.type === 'authorized_user' && hasStrings(obj, ['client_id', 'client_secret', 'refresh_token'])) {
    return obj as unknown as AuthorizedUserCredentials;
  }
  throw configError(
    `Credentials from ${source} have unsupported type "${String(obj.type)}" or missing fields.`,
    'Use a service-account key or `gcloud auth application-default login` credentials.',
  );
}

function fingerprint(raw: string): string {
  return createHash('sha256').update(raw).digest('hex').slice(0, 24);
}

function load(raw: string, source: CredentialSource): LoadedCredentials {
  return { source, credentials: parseCredentials(raw, source), cacheKey: fingerprint(raw) };
}

function readCredentialFile(path: string, source: CredentialSource): string {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    throw configError(`Could not read the credentials file from ${source}.`, 'Check that the path exists and is readable.');
  }
}

/** Returns null when no credentials exist at all (so the caller can try the next auth mode). */
export function loadGoogleCredentials(config: AiConfig, env: AiEnv): LoadedCredentials | null {
  if (config.inlineCredentialsJson) {
    return load(config.inlineCredentialsJson, 'GOOGLE_SERVICE_ACCOUNT_JSON');
  }
  if (config.credentialsPath) {
    return load(readCredentialFile(config.credentialsPath, 'GOOGLE_APPLICATION_CREDENTIALS'), 'GOOGLE_APPLICATION_CREDENTIALS');
  }
  const adcPath = wellKnownAdcPath(env);
  if (!existsSync(adcPath)) return null;
  return load(readCredentialFile(adcPath, 'gcloud ADC file'), 'gcloud ADC file');
}

/** Project to bill: explicit env wins; a service account falls back to its own project. */
export function resolveProject(config: AiConfig, loaded: LoadedCredentials): string | null {
  if (config.project) return config.project;
  const { credentials } = loaded;
  return credentials.type === 'service_account' ? (credentials.project_id ?? null) : null;
}
