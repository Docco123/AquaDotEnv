/**
 * Turns streamed GenerateContentResponse chunks into chat events.
 * Parts with `thought: true` are thought summaries; other text parts are the answer. Usage and the finish
 * reason arrive on the last chunk(s), so `finish()` decides between `done` and a final `error`.
 */
import type { ChatStreamEvent, ChatUsage } from './chatTypes';
import type { ExplainMode } from './types';

interface ChunkPart {
  text?: unknown;
  thought?: unknown;
}

interface StreamChunk {
  candidates?: { content?: { parts?: ChunkPart[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
  modelVersion?: string;
  error?: { message?: string; status?: string };
}

const BLOCK_REASONS = new Set(['SAFETY', 'RECITATION', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'SPII', 'LANGUAGE', 'IMAGE_SAFETY']);

export const MAX_TOKENS_NOTE = '\n\n(The answer was cut off at the length limit. Ask a narrower question to get the rest.)';

export interface ChatTranslator {
  /** Events for one upstream chunk (already JSON-parsed). An `error` event here is terminal. */
  push(chunk: unknown): ChatStreamEvent[];
  /** Closing events once the upstream stream has ended: `done` (maybe after a note) or an `error`. */
  finish(): ChatStreamEvent[];
  readonly failed: boolean;
}

/** Vertex returns bare enum names (STOP); older docs show FINISH_REASON_STOP. Accept both. */
export function normalizeFinishReason(reason: string | undefined): string | undefined {
  return reason?.replace(/^FINISH_REASON_/, '');
}

function blockedMessage(reason: string): string {
  return `The model stopped because the answer was flagged (${reason}). Try rephrasing the question, or open the facility's ECHO report.`;
}

function partEvents(parts: ChunkPart[] | undefined): ChatStreamEvent[] {
  const events: ChatStreamEvent[] = [];
  for (const part of parts ?? []) {
    if (typeof part.text !== 'string' || part.text.length === 0) continue;
    events.push({ type: part.thought === true ? 'thought' : 'text', text: part.text });
  }
  return events;
}

export function createChatTranslator(fallbackModel: string, mode: ExplainMode): ChatTranslator {
  let failed = false;
  let answered = false;
  let finishReason: string | undefined;
  let modelVersion: string | undefined;
  let usage: ChatUsage = { promptTokens: 0, outputTokens: 0, thoughtTokens: 0 };

  const fail = (message: string): ChatStreamEvent[] => {
    failed = true;
    return [{ type: 'error', message }];
  };

  const record = (chunk: StreamChunk) => {
    if (chunk.modelVersion) modelVersion = chunk.modelVersion;
    const meta = chunk.usageMetadata;
    if (meta) {
      usage = {
        promptTokens: meta.promptTokenCount ?? usage.promptTokens,
        outputTokens: meta.candidatesTokenCount ?? usage.outputTokens,
        thoughtTokens: meta.thoughtsTokenCount ?? usage.thoughtTokens,
      };
    }
  };

  const push = (raw: unknown): ChatStreamEvent[] => {
    if (failed) return [];
    const chunk = (raw ?? {}) as StreamChunk;
    if (chunk.error) return fail(`The AI service reported an error: ${chunk.error.message ?? chunk.error.status ?? 'unknown error'}.`);
    const blockReason = chunk.promptFeedback?.blockReason;
    if (blockReason) return fail(`The question was blocked (${blockReason}). Try rephrasing it.`);
    record(chunk);
    const candidate = chunk.candidates?.[0];
    const events = partEvents(candidate?.content?.parts);
    if (events.some((e) => e.type === 'text')) answered = true;
    finishReason = normalizeFinishReason(candidate?.finishReason) ?? finishReason;
    // A safety stop mid-answer can leave a misleading fragment, so it ends the stream as an error.
    if (finishReason && BLOCK_REASONS.has(finishReason)) return [...events.filter((e) => e.type === 'thought'), ...fail(blockedMessage(finishReason))];
    return events;
  };

  const finish = (): ChatStreamEvent[] => {
    if (failed) return [];
    if (finishReason === 'MAX_TOKENS' && !answered) return fail('The model ran out of room before answering. Try a narrower question.');
    if (!answered) return fail(`The model returned an empty answer${finishReason ? ` (${finishReason})` : ''}. Try asking again.`);
    if (!finishReason) return fail('The answer stream ended early. Try asking again.');
    const done: ChatStreamEvent = { type: 'done', model: modelVersion ?? fallbackModel, mode, usage };
    return finishReason === 'MAX_TOKENS' ? [{ type: 'text', text: MAX_TOKENS_NOTE }, done] : [done];
  };

  return {
    push,
    finish,
    get failed() {
      return failed;
    },
  };
}
