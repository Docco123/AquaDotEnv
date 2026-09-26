import { StyleSheet, Text, View } from 'react-native';
import { MarkdownLite } from '@/components/explain/MarkdownLite';
import { parseMarkdownLite, type Block, type Span } from '@/components/explain/parseMarkdownLite';
import { C, FONT, SPACE } from '@/theme';
import { StreamCursor } from './StreamCursor';

/** Everything before the last non-empty line, and that line. */
function splitTail(source: string): { head: string; tail: string } {
  const trimmed = source.replace(/\s+$/, '');
  const cut = trimmed.lastIndexOf('\n');
  return { head: trimmed.slice(0, cut + 1), tail: trimmed.slice(cut + 1) };
}

function Spans({ spans }: { spans: Span[] }) {
  return spans.map((span, i) => (
    <Text key={i} style={span.bold ? styles.bold : undefined}>
      {span.text}
    </Text>
  ));
}

/** The in-progress last line, styled like MarkdownLite, with the caret inline at its end. */
function Tail({ block, first }: { block: Block | undefined; first: boolean }) {
  if (!block) return <Text style={styles.body}><StreamCursor /></Text>;
  if (block.type === 'bullet') {
    return (
      <View style={styles.bulletRow}>
        <Text style={styles.bulletDot}>•</Text>
        <Text style={[styles.body, styles.bulletText]}>
          <Spans spans={block.spans} />
          <StreamCursor />
        </Text>
      </View>
    );
  }
  const style = block.type === 'heading' ? [styles.heading, first && styles.firstHeading] : styles.body;
  return (
    <Text style={style}>
      <Spans spans={block.spans} />
      <StreamCursor />
    </Text>
  );
}

/** MarkdownLite answer; while streaming, the last line is rendered here so the caret sits at its end. */
export function StreamingMarkdown({ source, streaming }: { source: string; streaming: boolean }) {
  if (!streaming) return <MarkdownLite source={source} />;
  const { head, tail } = splitTail(source);
  const hasHead = head.trim().length > 0;
  return (
    <View style={styles.root}>
      {hasHead && <MarkdownLite source={head} />}
      <Tail block={parseMarkdownLite(tail)[0]} first={!hasHead} />
    </View>
  );
}

// Mirrors MarkdownLite's styles so the finished answer doesn't shift when streaming ends.
const styles = StyleSheet.create({
  root: { gap: SPACE.xs },
  heading: { fontFamily: FONT.sans, fontSize: 14, fontWeight: '700', color: C.text, marginTop: SPACE.md },
  firstHeading: { marginTop: 0 },
  body: { fontFamily: FONT.sans, fontSize: 14, lineHeight: 21, color: C.text },
  bold: { fontWeight: '700' },
  bulletRow: { flexDirection: 'row', gap: SPACE.sm, paddingLeft: SPACE.xs },
  bulletDot: { fontFamily: FONT.sans, fontSize: 14, lineHeight: 21, color: C.primary },
  bulletText: { flex: 1 },
});
