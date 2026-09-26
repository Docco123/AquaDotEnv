/**
 * Request/response contract for POST /api/explain.
 * Client-safe: type-only, no runtime code, no Node imports.
 */
import type { FacilityDigest, TraceDigest } from './digest';

export type ExplainKind = 'trace' | 'facility';

/** Which backend produced the text. */
export type ExplainMode = 'vertex-express' | 'vertex-adc' | 'vertex-sa' | 'gemini';

export interface ExplainRequest {
  kind: ExplainKind;
  digest: TraceDigest;
  facility?: FacilityDigest;
}

export interface ExplainUsage {
  promptTokens?: number;
  outputTokens?: number;
  thoughtsTokens?: number;
  totalTokens?: number;
}

export interface ExplainResponse {
  text: string;
  model: string;
  mode: ExplainMode;
  usage?: ExplainUsage;
  /** True when the model hit the output-token limit and the text may end mid-sentence. */
  truncated?: boolean;
}

export type ExplainErrorCode =
  | 'not-configured'
  | 'bad-request'
  | 'config'
  | 'auth'
  | 'rate-limited'
  | 'blocked'
  | 'empty'
  | 'timeout'
  | 'upstream';

export interface ExplainErrorBody {
  error: string;
  code?: ExplainErrorCode;
  hint?: string;
}

/** Environment variables as seen by the server (process.env or a test fixture). */
export type AiEnv = Readonly<Record<string, string | undefined>>;
