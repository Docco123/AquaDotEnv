/**
 * SERVER ONLY. One HTTP call to a generateContent endpoint, with Google error bodies mapped to AiError.
 * URLs may contain an API key, so they are never logged or echoed back.
 */
import { AiError } from './errors';
import { buildGenerateBody, parseGenerateResponse, type GenerateInput, type GenerateResult } from './generate';

export interface GenerateCall {
  url: string;
  headers: Record<string, string>;
  input: GenerateInput;
  signal: AbortSignal;
  fetch?: typeof fetch;
}

/** Google's JSON error envelope: { error: { code, message, status, details } }. */
export interface GoogleErrorInfo {
  httpStatus: number;
  status: string | null;
  message: string;
  reasons: string[];
}

export class UpstreamHttpError extends AiError {
  readonly info: GoogleErrorInfo;

  constructor(info: GoogleErrorInfo) {
    const { code, status, hint } = classify(info);
    super(code, `Google returned ${info.httpStatus}${info.status ? ` ${info.status}` : ''}: ${info.message}`, {
      status,
      hint,
      upstreamStatus: info.httpStatus,
      upstreamCode: info.status ?? undefined,
    });
    this.info = info;
  }
}

function classify(info: GoogleErrorInfo): Pick<AiError, 'code' | 'status' | 'hint'> {
  const text = `${info.message} ${info.reasons.join(' ')}`;
  if (info.httpStatus === 429) {
    return { code: 'rate-limited', status: 429, hint: 'Vertex AI quota reached. Wait a minute and try again.' };
  }
  if (/SERVICE_DISABLED|has not been used|is disabled/i.test(text)) {
    return { code: 'auth', status: 502, hint: 'Enable the Vertex AI API (aiplatform.googleapis.com) for this project in the Google Cloud console.' };
  }
  if (/BILLING/i.test(text)) {
    return { code: 'auth', status: 502, hint: 'Link a billing account to the Google Cloud project used for Vertex AI.' };
  }
  if (info.httpStatus === 401 || info.httpStatus === 403) {
    return { code: 'auth', status: 502, hint: 'The account needs the Vertex AI User role (roles/aiplatform.user) on this project.' };
  }
  if (info.httpStatus === 404) {
    return { code: 'upstream', status: 502, hint: 'Check VERTEX_MODEL and VERTEX_LOCATION: this model may not be served in that region.' };
  }
  return { code: 'upstream', status: 502, hint: 'Try Regenerate in a moment.' };
}

export async function readGoogleError(res: Response): Promise<GoogleErrorInfo> {
  const raw = await res.text().catch(() => '');
  let message = raw.slice(0, 300) || res.statusText || 'Unknown error';
  let status: string | null = null;
  const reasons: string[] = [];
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string; status?: string; details?: { reason?: string }[] } };
    const err = Array.isArray(parsed) ? parsed[0]?.error : parsed.error;
    if (err?.message) message = err.message;
    if (err?.status) status = err.status;
    for (const detail of err?.details ?? []) if (detail?.reason) reasons.push(detail.reason);
  } catch {
    // Non-JSON error body: keep the truncated text.
  }
  return { httpStatus: res.status, status, message, reasons };
}

export async function callGenerateContent(call: GenerateCall): Promise<GenerateResult> {
  const doFetch = call.fetch ?? fetch;
  const res = await doFetch(call.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...call.headers },
    body: JSON.stringify(buildGenerateBody(call.input)),
    signal: call.signal,
  });
  if (!res.ok) throw new UpstreamHttpError(await readGoogleError(res));
  return parseGenerateResponse(await res.json());
}
