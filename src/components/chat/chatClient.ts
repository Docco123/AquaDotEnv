/** Browser-side call to POST /api/chat: streams the SSE answer into callbacks. */
import { CHAT } from './config';
import { createSseParser } from './sse';
import type { ChatRequest } from './types';

export interface ChatStreamHandlers {
  onThought(chunk: string): void;
  onText(chunk: string): void;
}

export type ChatStreamResult =
  | { status: 'done' }
  | { status: 'aborted' }
  | { status: 'not-configured'; hint: string }
  | { status: 'error'; message: string };

const ABORTED: ChatStreamResult = { status: 'aborted' };

async function readFailure(res: Response): Promise<ChatStreamResult> {
  const payload = (await res.json().catch(() => null)) as { error?: string; hint?: string } | null;
  if (res.status === 503) return { status: 'not-configured', hint: payload?.hint ?? '' };
  return { status: 'error', message: payload?.error ?? `Chat failed (HTTP ${res.status}).` };
}

async function readStream(body: ReadableStream<Uint8Array>, handlers: ChatStreamHandlers): Promise<ChatStreamResult> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let outcome: ChatStreamResult | null = null;
  let finished = false;
  const parser = createSseParser(
    (event) => {
      if (event.type === 'thought') handlers.onThought(event.text ?? '');
      else if (event.type === 'text') handlers.onText(event.text ?? '');
      else if (event.type === 'done') outcome ??= { status: 'done' };
      else if (event.type === 'error') outcome = { status: 'error', message: event.message || 'The answer failed.' };
    },
    () => {
      finished = true;
    },
  );
  while (!finished) {
    const { value, done } = await reader.read();
    if (done) break;
    parser.push(decoder.decode(value, { stream: true }));
  }
  parser.push(decoder.decode());
  parser.flush();
  if (finished) reader.cancel().catch(() => undefined);
  return outcome ?? (finished ? { status: 'done' } : { status: 'error', message: 'The answer was cut off.' });
}

export async function streamChat(body: ChatRequest, signal: AbortSignal, handlers: ChatStreamHandlers): Promise<ChatStreamResult> {
  let res: Response;
  try {
    res = await fetch(CHAT.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    return signal.aborted ? ABORTED : { status: 'error', message: 'Could not reach the chat service.' };
  }
  if (!res.ok) return readFailure(res);
  if (!res.body) return { status: 'error', message: 'The chat service sent an empty response.' };
  try {
    return await readStream(res.body, handlers);
  } catch {
    return signal.aborted ? ABORTED : { status: 'error', message: 'The connection dropped before the answer finished.' };
  }
}
