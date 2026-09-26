import type { ExplainErrorBody, ExplainErrorCode } from './types';

interface AiErrorOptions {
  status: number;
  hint?: string;
  /** HTTP status returned by Google, when the error came from an upstream call. */
  upstreamStatus?: number;
  /** Google's canonical error status, e.g. PERMISSION_DENIED. */
  upstreamCode?: string;
}

/** Every failure in src/lib/ai is raised as an AiError so the handler can map it to one JSON shape. */
export class AiError extends Error {
  readonly code: ExplainErrorCode;
  readonly status: number;
  readonly hint?: string;
  readonly upstreamStatus?: number;
  readonly upstreamCode?: string;

  constructor(code: ExplainErrorCode, message: string, options: AiErrorOptions) {
    super(message);
    this.name = 'AiError';
    this.code = code;
    this.status = options.status;
    this.hint = options.hint;
    this.upstreamStatus = options.upstreamStatus;
    this.upstreamCode = options.upstreamCode;
  }

  toBody(): ExplainErrorBody {
    return { error: this.message, code: this.code, ...(this.hint ? { hint: this.hint } : {}) };
  }
}

export const NOT_CONFIGURED_HINT = 'Set VERTEX_API_KEY (or a service account) in .env and restart the dev server.';

export function notConfiguredError(hint: string = NOT_CONFIGURED_HINT): AiError {
  return new AiError('not-configured', 'AI not configured', { status: 503, hint });
}

export function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
}
