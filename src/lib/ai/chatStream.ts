/**
 * SERVER ONLY. Runs one streamed chat answer and exposes it as an SSE ReadableStream:
 * `data: <ChatStreamEvent JSON>\n\n` per event, always ending with `data: [DONE]\n\n` (unless the client left).
 */
import { buildChatBody, chatThinkingConfig } from './chatBody';
import { createChatTranslator } from './chatChunks';
import { CHAT_DEFAULTS } from './chatConfig';
import type { ChatPrompt } from './chatPrompt';
import type { ChatStreamEvent } from './chatTypes';
import { openStream, type StreamTarget, type UpstreamDeps } from './chatUpstream';
import { AiError } from './errors';
import { readSseData } from './sseReader';
import { UpstreamHttpError } from './vertex';

export interface ChatStreamInput {
  target: StreamTarget;
  model: string;
  prompt: ChatPrompt;
  /** The client's request signal: aborts the upstream call when the browser disconnects. */
  signal: AbortSignal;
  deps?: UpstreamDeps;
}

interface Signals {
  combined: AbortSignal;
  timeout: AbortSignal;
  client: AbortSignal;
  cancel: AbortController;
}

const encoder = new TextEncoder();
const frame = (payload: string) => encoder.encode(`data: ${payload}\n\n`);

/** Sends thinking config first; if the model rejects it (400), retries once without it. */
async function openWithThinkingFallback(input: ChatStreamInput, signal: AbortSignal) {
  const thinking = chatThinkingConfig(input.model);
  const open = (withThinking: boolean) =>
    openStream(input.target, input.model, buildChatBody(input.prompt, withThinking ? thinking : null), signal, input.deps);
  try {
    return await open(true);
  } catch (error) {
    const rejected = thinking && error instanceof UpstreamHttpError && error.info.httpStatus === 400;
    if (!rejected) throw error;
    console.warn(`[chat] thinkingConfig rejected (${error.info.message.slice(0, 120)}); retrying without it`);
    return open(false);
  }
}

function describeError(error: unknown, signals: Signals): string {
  if (signals.timeout.aborted) return `The AI took longer than ${CHAT_DEFAULTS.timeoutMs / 1000} seconds. Try asking again.`;
  if (error instanceof AiError) return [error.message, error.hint].filter(Boolean).join(' ');
  return 'Could not reach the AI service. Try again in a moment.';
}

async function* chatEvents(input: ChatStreamInput, signals: Signals): AsyncGenerator<ChatStreamEvent> {
  try {
    const response = await openWithThinkingFallback(input, signals.combined);
    const translator = createChatTranslator(input.model, input.target.mode);
    for await (const data of readSseData(response.body as ReadableStream<Uint8Array>)) {
      let chunk: unknown;
      try {
        chunk = JSON.parse(data);
      } catch {
        continue; // Keep-alive or malformed line: nothing to forward.
      }
      yield* translator.push(chunk);
      if (translator.failed) return;
    }
    yield* translator.finish();
  } catch (error) {
    if (signals.client.aborted || signals.cancel.signal.aborted) return;
    const message = describeError(error, signals);
    const cause = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.warn(`[chat] ${message.slice(0, 200)} (${cause.slice(0, 200)})`);
    yield { type: 'error', message };
  }
}

export function createChatStream(input: ChatStreamInput): ReadableStream<Uint8Array> {
  const cancel = new AbortController();
  const timeout = AbortSignal.timeout(CHAT_DEFAULTS.timeoutMs);
  const signals: Signals = { combined: AbortSignal.any([input.signal, cancel.signal, timeout]), timeout, client: input.signal, cancel };
  const events = chatEvents(input, signals);
  const clientGone = () => input.signal.aborted || cancel.signal.aborted;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const next = await events.next();
      if (clientGone()) return;
      if (!next.done) {
        controller.enqueue(frame(JSON.stringify(next.value)));
        return;
      }
      controller.enqueue(frame('[DONE]'));
      controller.close();
    },
    cancel() {
      cancel.abort();
    },
  });
}
