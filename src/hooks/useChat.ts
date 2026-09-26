import { useEffect, useRef, useState } from 'react';
import { streamChat, type ChatStreamResult } from '@/components/chat/chatClient';
import { buildChatRequest } from '@/components/chat/request';
import type { AssistantTurn, ChatTurn } from '@/components/chat/types';
import type { UpstreamFacility, UpstreamTrace } from '@/types';

interface History {
  key: string | null;
  turns: ChatTurn[];
}

type TurnPatch = (turn: AssistantTurn) => Partial<AssistantTurn>;

const NO_TURNS: ChatTurn[] = [];

function newAssistantTurn(id: number): AssistantTurn {
  return { id, role: 'assistant', thoughts: '', text: '', thinkingMs: null, status: 'thinking', error: null, notConfigured: false, stopped: false };
}

/** Final fields for an assistant turn once its stream ends. */
function settle(turn: AssistantTurn, result: ChatStreamResult, elapsedMs: number): Partial<AssistantTurn> {
  const thinkingMs = turn.thinkingMs ?? (turn.thoughts ? elapsedMs : null);
  if (result.status === 'done') return { status: 'done', thinkingMs };
  if (result.status === 'aborted') return { status: 'done', stopped: true, thinkingMs };
  if (result.status === 'not-configured') return { status: 'error', notConfigured: true, thinkingMs };
  return { status: 'error', error: result.message, thinkingMs };
}

export function isStreamingTurn(turn: ChatTurn | undefined): boolean {
  return turn?.role === 'assistant' && (turn.status === 'thinking' || turn.status === 'answering');
}

/**
 * Conversation about the current trace (and selected facility). One stream at a time:
 * sending again, stop(), a new trace or unmount aborts the running one.
 * History is keyed by trace.generatedAt, so a new trace starts an empty conversation.
 */
export function useChat(trace: UpstreamTrace | null, facility: UpstreamFacility | null) {
  const traceKey = trace?.generatedAt ?? null;
  const [history, setHistory] = useState<History>({ key: traceKey, turns: NO_TURNS });
  const turns = history.key === traceKey ? history.turns : NO_TURNS;
  const active = useRef<AbortController | null>(null);
  const nextId = useRef(1);

  useEffect(() => {
    const ref = active;
    return () => ref.current?.abort();
  }, [traceKey]);

  const patchTurn = (id: number, patch: TurnPatch) =>
    setHistory((h) => ({
      ...h,
      turns: h.turns.map((t) => (t.id === id && t.role === 'assistant' ? { ...t, ...patch(t) } : t)),
    }));

  /** Streams an answer to `base` (which ends with the user's message) into a new assistant turn. */
  const run = (base: ChatTurn[]) => {
    if (!trace) return;
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    const id = nextId.current++;
    const startedAt = Date.now();
    setHistory({ key: traceKey, turns: [...base, newAssistantTurn(id)] });
    streamChat(buildChatRequest(base, trace, facility), controller.signal, {
      onThought: (chunk) => patchTurn(id, (t) => ({ thoughts: t.thoughts + chunk })),
      onText: (chunk) => {
        const elapsed = Date.now() - startedAt;
        patchTurn(id, (t) => ({ text: t.text + chunk, status: 'answering', thinkingMs: t.thinkingMs ?? elapsed }));
      },
    }).then((result) => {
      if (active.current === controller) active.current = null;
      const elapsed = Date.now() - startedAt;
      patchTurn(id, (t) => settle(t, result, elapsed));
    });
  };

  const send = (text: string) => {
    const content = text.trim();
    if (!content || !trace) return;
    run([...turns, { id: nextId.current++, role: 'user', content }]);
  };

  const stop = () => active.current?.abort();

  /** Re-asks the last user message after a failed answer. */
  const retry = () => {
    const last = turns[turns.length - 1];
    if (last?.role === 'assistant' && last.status === 'error') run(turns.slice(0, -1));
  };

  const reset = () => {
    active.current?.abort();
    setHistory({ key: traceKey, turns: NO_TURNS });
  };

  return { turns, streaming: isStreamingTurn(turns[turns.length - 1]), send, stop, retry, reset };
}

export type ChatModel = ReturnType<typeof useChat>;
