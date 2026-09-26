import { StyleSheet, Text, View } from 'react-native';
import { C, FONT, SPACE } from '@/theme';
import { parseMarkdownLite, type Span } from './parseMarkdownLite';

function Spans({ spans }: { spans: Span[] }) {
  return (
    <>
      {spans.map((span, i) => (
        <Text key={i} style={span.bold ? styles.bold : undefined}>
          {span.text}
        </Text>
      ))}
    </>
  );
}

/** Renders the model's markdown-lite answer as native Text (no HTML injection). */
export function MarkdownLite({ source }: { source: string }) {
  const blocks = parseMarkdownLite(source);
  return (
    <View style={styles.root}>
      {blocks.map((block, i) => {
        if (block.type === 'heading') {
          return (
            <Text key={i} style={[styles.heading, i === 0 && styles.firstHeading]} accessibilityRole="header">
              <Spans spans={block.spans} />
            </Text>
          );
        }
        if (block.type === 'bullet') {
          return (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={[styles.body, styles.bulletText]}>
                <Spans spans={block.spans} />
              </Text>
            </View>
          );
        }
        return (
          <Text key={i} style={styles.body}>
            <Spans spans={block.spans} />
          </Text>
        );
      })}
    </View>
  );
}

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
