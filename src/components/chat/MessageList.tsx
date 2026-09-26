import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { C, FONT, SPACE } from '@/theme';
import { AssistantMessage } from './AssistantMessage';
import { CHAT } from './config';
import type { ChatTurn } from './types';
import { UserMessage } from './UserMessage';

/** Within this many px of the bottom counts as "following" the stream. */
const PIN_THRESHOLD = 48;

/** Scrollable conversation; follows new content unless the user has scrolled up. */
export function MessageList({ turns, onRetry }: { turns: ChatTurn[]; onRetry(): void }) {
  const scroller = useRef<ScrollView>(null);
  const pinned = useRef(true);

  // Each new message (the user's or a new answer) re-pins to the bottom.
  useEffect(() => {
    pinned.current = true;
    scroller.current?.scrollToEnd({ animated: true });
  }, [turns.length]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    pinned.current = contentSize.height - (contentOffset.y + layoutMeasurement.height) < PIN_THRESHOLD;
  };

  const follow = () => {
    if (pinned.current) scroller.current?.scrollToEnd({ animated: false });
  };

  return (
    <ScrollView
      ref={scroller}
      style={styles.scroll}
      contentContainerStyle={[styles.content, turns.length === 0 && styles.empty]}
      onScroll={onScroll}
      scrollEventThrottle={32}
      onContentSizeChange={follow}
    >
      {turns.length === 0 && <Text style={styles.hint}>{CHAT.emptyHint}</Text>}
      {turns.map((turn, i) =>
        turn.role === 'user' ? (
          <UserMessage key={turn.id} content={turn.content} />
        ) : (
          <View key={turn.id}>
            <AssistantMessage turn={turn} onRetry={i === turns.length - 1 ? onRetry : undefined} />
          </View>
        ),
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: SPACE.lg, gap: SPACE.xl - 4 },
  empty: { flexGrow: 1, justifyContent: 'flex-end' },
  hint: { fontFamily: FONT.sans, fontSize: 13, lineHeight: 19, color: C.muted },
});
