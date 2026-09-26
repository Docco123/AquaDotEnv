/** Builds the POST /api/chat body from the on-screen conversation and the current trace. */
import { buildFacilityDigest, buildTraceDigest } from '@/lib/ai/digest';
import type { UpstreamFacility, UpstreamTrace } from '@/types';
import { CHAT } from './config';
import type { ChatMessage, ChatRequest, ChatTurn } from './types';

/** Non-empty messages, consecutive same-role turns merged, trimmed to recent history, starting with the user. */
export function toMessages(turns: ChatTurn[]): ChatMessage[] {
  const messages: ChatMessage[] = [];
  for (const turn of turns) {
    const content = (turn.role === 'user' ? turn.content : turn.text).trim();
    if (!content) continue;
    const previous = messages[messages.length - 1];
    if (previous?.role === turn.role) previous.content += `\n\n${content}`;
    else messages.push({ role: turn.role, content });
  }
  const recent = messages.slice(-CHAT.maxHistoryMessages);
  return recent[0]?.role === 'assistant' ? recent.slice(1) : recent;
}

export function buildChatRequest(turns: ChatTurn[], trace: UpstreamTrace, facility: UpstreamFacility | null): ChatRequest {
  return {
    messages: toMessages(turns),
    context: { digest: buildTraceDigest(trace), facility: facility ? buildFacilityDigest(facility) : null },
  };
}
