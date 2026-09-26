/** Chat request contract (POST /api/chat) and the on-screen conversation model. Type-only. */
import type { FacilityDigest, TraceDigest } from '@/lib/ai/digest';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  context: { digest: TraceDigest; facility: FacilityDigest | null };
}

/** thinking = waiting or reasoning, answering = answer text streaming, then done | error. */
export type AssistantStatus = 'thinking' | 'answering' | 'done' | 'error';

export interface UserTurn {
  id: number;
  role: 'user';
  content: string;
}

export interface AssistantTurn {
  id: number;
  role: 'assistant';
  /** Streamed reasoning text; empty when the model sent none. */
  thoughts: string;
  text: string;
  /** Time from send to the first answer token (or to the end, if none came). */
  thinkingMs: number | null;
  status: AssistantStatus;
  error: string | null;
  /** The server has no AI credentials (HTTP 503). */
  notConfigured: boolean;
  /** The user stopped the stream (or sent another message) before it finished. */
  stopped: boolean;
}

export type ChatTurn = UserTurn | AssistantTurn;

export interface ChatLauncherProps {
  open: boolean;
  onPress(): void;
}
