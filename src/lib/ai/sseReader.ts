/**
 * Minimal server-sent-events reader for upstream responses: yields the `data:` payload of each event.
 * Google's `alt=sse` streams send one GenerateContentResponse JSON per event.
 */

const EVENT_BOUNDARY = /\r?\n\r?\n/;

function eventData(block: string): string | null {
  const data = block
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).replace(/^ /, ''));
  return data.length ? data.join('\n') : null;
}

/** Reads the whole body; cancels it if the consumer stops early (break / return / throw). */
export async function* readSseData(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const blocks = buffer.split(EVENT_BOUNDARY);
      buffer = done ? '' : (blocks.pop() ?? '');
      for (const block of blocks) {
        const data = eventData(block);
        if (data !== null) yield data;
      }
      if (done) return;
    }
  } finally {
    reader.cancel().catch(() => undefined);
  }
}
