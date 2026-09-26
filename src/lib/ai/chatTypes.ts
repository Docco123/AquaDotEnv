/**
 * Request/stream contract for POST /api/chat.
 * Client-safe: type-only, no runtime code, no Node imports.
 */
import type { FacilityDigest, TraceDigest } from './digest';
import type { ExplainMode } from './types';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatContext {
  digest: TraceDigest;
  facility?: FacilityDigest | null;
}

export interface ChatRequest {
  /** 1-30 turns, oldest first; the last one is the user's new question. */
  messages: ChatMessage[];
  context: ChatContext;
}

export interface ChatUsage {
  promptTokens: number;
  outputTokens: number;
  thoughtTokens: number;
}

/**
 * One server-sent event: the body is a series of `data: <json>\n\n` frames, then `data: [DONE]\n\n`.
 * `thought` and `text` carry incremental deltas; an `error` is the last event before [DONE].
 */
export type ChatStreamEvent =
  | { type: 'thought'; text: string }
  | { type: 'text'; text: string }
  | { type: 'done'; model: string; mode: ExplainMode; usage: ChatUsage }
  | { type: 'error'; message: string };
