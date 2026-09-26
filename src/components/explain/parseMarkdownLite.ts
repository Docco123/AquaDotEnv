/** Tiny parser for the explainer's markdown-lite: `## ` headings, `- ` bullets, `**bold**` spans. */

export interface Span {
  text: string;
  bold: boolean;
}

export type Block =
  | { type: 'heading'; spans: Span[] }
  | { type: 'bullet'; spans: Span[] }
  | { type: 'paragraph'; spans: Span[] };

export function parseSpans(line: string): Span[] {
  return line
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) =>
      part.startsWith('**') && part.endsWith('**') && part.length > 4
        ? { text: part.slice(2, -2), bold: true }
        : { text: part.replace(/\*\*/g, ''), bold: false },
    );
}

export function parseMarkdownLite(source: string): Block[] {
  const blocks: Block[] = [];
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    const bullet = /^(?:[-*•]|\d+[.)])\s+(.*)$/.exec(line);
    if (heading) blocks.push({ type: 'heading', spans: parseSpans(heading[1].replace(/\*\*/g, '')) });
    else if (bullet) blocks.push({ type: 'bullet', spans: parseSpans(bullet[1]) });
    else blocks.push({ type: 'paragraph', spans: parseSpans(line) });
  }
  return blocks;
}
