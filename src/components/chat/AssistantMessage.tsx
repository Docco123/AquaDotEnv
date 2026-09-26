import { Pressable, StyleSheet, Text, View } from 'react-native';
import { isStreamingTurn } from '@/hooks/useChat';
import { C, FONT, RADIUS, SPACE } from '@/theme';
import { CHAT } from './config';
import { StreamingMarkdown } from './StreamingMarkdown';
import { ThinkingBlock } from './ThinkingBlock';
import type { AssistantTurn } from './types';

function ErrorLine({ message, onRetry }: { message: string; onRetry?(): void }) {
  return (
    <View style={styles.errorRow} accessibilityRole="alert">
      <Text style={styles.muted}>{message}</Text>
      {onRetry && (
        <Pressable onPress={onRetry} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.link}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

/** One assistant turn: optional thinking block, the (streaming) answer, and any error. */
export function AssistantMessage({ turn, onRetry }: { turn: AssistantTurn; onRetry?(): void }) {
  const streaming = isStreamingTurn(turn);
  const showAnswer = !!turn.text || (streaming && (turn.status === 'answering' || !turn.thoughts));

  if (turn.notConfigured) {
    return (
      <View style={styles.quiet}>
        <Text style={styles.quietText}>{CHAT.notConfigured}</Text>
      </View>
    );
  }

  return (
    <View style={styles.turn}>
      {!!turn.thoughts && <ThinkingBlock thoughts={turn.thoughts} thinking={turn.status === 'thinking'} thinkingMs={turn.thinkingMs} />}
      {showAnswer && <StreamingMarkdown source={turn.text} streaming={streaming} />}
      {turn.stopped && !turn.text && <Text style={styles.muted}>Stopped.</Text>}
      {turn.status === 'error' && <ErrorLine message={turn.error ?? 'Something went wrong.'} onRetry={onRetry} />}
    </View>
  );
}

const styles = StyleSheet.create({
  turn: { gap: SPACE.sm },
  errorRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: SPACE.md },
  muted: { fontFamily: FONT.sans, fontSize: 13, color: C.muted, flexShrink: 1 },
  link: { fontFamily: FONT.sans, fontSize: 13, fontWeight: '600', color: C.primary },
  quiet: { backgroundColor: C.surfaceAlt, borderRadius: RADIUS.md, paddingHorizontal: SPACE.lg, paddingVertical: SPACE.md },
  quietText: { fontFamily: FONT.sans, fontSize: 13, color: C.muted },
});
