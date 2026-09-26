/** Events streamed by POST /api/chat as `data: <json>\n\n` blocks, ending with `data: [DONE]`. */
export type ChatStreamEvent =
  | { type: 'thought'; text: string }
  | { type: 'text'; text: string }
  | { type: 'done'; model?: string; mode?: string; usage?: unknown }
  | { type: 'error'; message: string };

const DONE = '[DONE]';

function parseBlock(block: string): ChatStreamEvent | typeof DONE | null {
  const data = block
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).replace(/^ /, ''))
    .join('\n');
  if (!data) return null;
  if (data === DONE) return DONE;
  try {
    const event = JSON.parse(data) as ChatStreamEvent;
    return event && typeof event.type === 'string' ? event : null;
  } catch {
    return null;
  }
}

export interface SseParser {
  /** Feed a decoded chunk; complete events are dispatched immediately. */
  push(chunk: string): void;
  /** Dispatch whatever is left in the buffer (a final block without a trailing blank line). */
  flush(): void;
}

/** Incremental server-sent-events parser: `onEvent` per event, `onDone` on the `[DONE]` sentinel. */
export function createSseParser(onEvent: (event: ChatStreamEvent) => void, onDone: () => void): SseParser {
  let buffer = '';
  const dispatch = (block: string) => {
    const parsed = parseBlock(block);
    if (parsed === DONE) onDone();
    else if (parsed) onEvent(parsed);
  };
  return {
    push(chunk) {
      buffer += chunk;
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() ?? '';
      blocks.forEach(dispatch);
    },
    flush() {
      const rest = buffer;
      buffer = '';
      if (rest.trim()) dispatch(rest);
    },
  };
}
