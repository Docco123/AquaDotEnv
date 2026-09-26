/**
 * SERVER ONLY. Framework-free core of POST /api/chat so it can be exercised from Node directly.
 * Validation and configuration errors are JSON (400 / 503 / 500); once the answer starts, everything
 * (including upstream failures) is reported inside the text/event-stream body.
 */
import { CHAT_DEFAULTS } from './chatConfig';
import { buildChatPrompt } from './chatPrompt';
import { createChatStream } from './chatStream';
import { selectStreamTarget, type UpstreamDeps } from './chatUpstream';
import { byteLength, validateChatRequest } from './chatValidate';
import { readAiConfig } from './config';
import { AiError } from './errors';
import type { AiEnv } from './types';

export const SSE_HEADERS: Readonly<Record<string, string>> = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
};

const TOO_LARGE = { error: 'Body is larger than 120 KB.', code: 'bad-request' } as const;

function errorResponse(error: unknown): Response {
  if (error instanceof AiError) {
    if (error.status >= 500) console.warn(`[chat] ${error.code}: ${error.message}`);
    return Response.json(error.toBody(), { status: error.status });
  }
  console.warn('[chat] unexpected error:', error instanceof Error ? error.message : String(error));
  return Response.json({ error: 'Could not start the chat.', code: 'upstream' }, { status: 500 });
}

/** Validates the parsed body, picks credentials, and returns the SSE response (or a JSON error). */
export function handleChat(body: unknown, env: AiEnv, signal: AbortSignal, deps: UpstreamDeps = {}): Response {
  try {
    const request = validateChatRequest(body);
    const config = readAiConfig(env);
    const target = selectStreamTarget(config, env, deps);
    const prompt = buildChatPrompt(request.messages, request.context);
    const stream = createChatStream({ target, model: config.model, prompt, signal, deps });
    return new Response(stream, { status: 200, headers: SSE_HEADERS });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Checks method and size, parses JSON, then delegates to handleChat. */
export async function handleChatRequest(request: Request, env: AiEnv, deps: UpstreamDeps = {}): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed. Use POST.', code: 'bad-request' }, { status: 405, headers: { Allow: 'POST' } });
  }
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > CHAT_DEFAULTS.maxBodyBytes) return Response.json(TOO_LARGE, { status: 400 });
  const raw = await request.text();
  if (byteLength(raw) > CHAT_DEFAULTS.maxBodyBytes) return Response.json(TOO_LARGE, { status: 400 });
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return Response.json({ error: 'Body must be valid JSON.', code: 'bad-request' }, { status: 400 });
  }
  return handleChat(parsed, env, request.signal, deps);
}
