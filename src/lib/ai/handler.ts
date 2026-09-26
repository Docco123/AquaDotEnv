/**
 * SERVER ONLY. Framework-free core of POST /api/explain so it can be exercised from Node directly.
 */
import { AI_DEFAULTS, readAiConfig } from './config';
import { AiError, isTimeoutError } from './errors';
import { buildPrompt } from './prompt';
import { selectProvider, type ProviderDeps } from './providers';
import type { AiEnv, ExplainErrorBody, ExplainRequest, ExplainResponse } from './types';

export interface ExplainResult {
  status: number;
  body: ExplainResponse | ExplainErrorBody;
}

function badRequest(message: string): AiError {
  return new AiError('bad-request', message, { status: 400 });
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

export function validateExplainRequest(body: unknown): ExplainRequest {
  if (!isObject(body)) throw badRequest('Body must be a JSON object.');
  if (body.kind !== 'trace' && body.kind !== 'facility') throw badRequest('kind must be "trace" or "facility".');
  if (!isObject(body.digest) || !isObject(body.digest.summary)) throw badRequest('digest must be a trace digest.');
  if (body.kind === 'facility' && !isObject(body.facility)) throw badRequest('facility is required when kind is "facility".');
  if (new TextEncoder().encode(JSON.stringify(body)).length > AI_DEFAULTS.maxBodyBytes) throw badRequest('Body is larger than 120 KB.');
  return body as unknown as ExplainRequest;
}

function toErrorResult(error: unknown): ExplainResult {
  if (error instanceof AiError) {
    if (error.status >= 500) console.warn(`[explain] ${error.code}: ${error.message}`);
    return { status: error.status, body: error.toBody() };
  }
  if (isTimeoutError(error)) {
    return { status: 504, body: { error: 'The AI took too long to answer.', code: 'timeout', hint: 'Try Regenerate.' } };
  }
  console.warn('[explain] unexpected error:', error instanceof Error ? error.message : String(error));
  return { status: 502, body: { error: 'Could not reach the AI service.', code: 'upstream', hint: 'Try Regenerate in a moment.' } };
}

export async function handleExplain(body: unknown, env: AiEnv, deps: ProviderDeps = {}): Promise<ExplainResult> {
  try {
    const request = validateExplainRequest(body);
    const config = readAiConfig(env);
    const provider = selectProvider(config, env, deps);
    const { systemInstruction, userText } = buildPrompt(request);
    const signal = AbortSignal.timeout(AI_DEFAULTS.timeoutMs);
    const result = await provider.generate({ model: config.model, systemInstruction, userText }, signal);
    const response: ExplainResponse = {
      text: result.text,
      model: result.modelVersion ?? config.model,
      mode: result.mode,
      ...(result.usage ? { usage: result.usage } : {}),
      ...(result.truncated ? { truncated: true } : {}),
    };
    return { status: 200, body: response };
  } catch (error) {
    return toErrorResult(error);
  }
}

/** Reads and size-checks the raw body, then delegates to handleExplain. */
export async function handleExplainRequest(request: Request, env: AiEnv, deps: ProviderDeps = {}): Promise<Response> {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > AI_DEFAULTS.maxBodyBytes) return Response.json({ error: 'Body is larger than 120 KB.', code: 'bad-request' }, { status: 400 });
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > AI_DEFAULTS.maxBodyBytes) {
    return Response.json({ error: 'Body is larger than 120 KB.', code: 'bad-request' }, { status: 400 });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return Response.json({ error: 'Body must be valid JSON.', code: 'bad-request' }, { status: 400 });
  }
  const result = await handleExplain(parsed, env, deps);
  return Response.json(result.body, { status: result.status });
}
