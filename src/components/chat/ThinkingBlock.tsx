import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PulseDot } from '@/components/motion';
import { C, FONT, SPACE } from '@/theme';
import { CHAT_LAYOUT } from './config';

interface Props {
  thoughts: string;
  /** True until the first answer token (or the end of the stream). */
  thinking: boolean;
  thinkingMs: number | null;
}

function label(thinking: boolean, thinkingMs: number | null): string {
  if (thinking) return 'Thinking…';
  return `Thought for ${Math.max(1, Math.round((thinkingMs ?? 0) / 1000))}s`;
}

/** Collapsible reasoning: open and auto-scrolling while thinking, collapsed once the answer starts. */
export function ThinkingBlock({ thoughts, thinking, thinkingMs }: Props) {
  const phase = thinking ? 'thinking' : 'after';
  // A manual toggle only applies to the phase it was made in, so the block auto-collapses when the answer starts.
  const [toggle, setToggle] = useState<{ phase: string; open: boolean } | null>(null);
  const open = toggle?.phase === phase ? toggle.open : thinking;
  const scroller = useRef<ScrollView>(null);

  return (
    <View style={styles.root}>
      <Pressable
        onPress={() => setToggle({ phase, open: !open })}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.header}
        hitSlop={6}
      >
        {thinking && <PulseDot color={C.primary} size={6} />}
        <Text style={styles.label}>{label(thinking, thinkingMs)}</Text>
        <Text style={styles.chevron}>{open ? '▾' : '▸'}</Text>
      </Pressable>
      {open && thinking && (
        <ScrollView
          ref={scroller}
          style={styles.window}
          onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: false })}
        >
          <Text style={styles.thoughts}>{thoughts}</Text>
        </ScrollView>
      )}
      {open && !thinking && (
        <View style={styles.full}>
          <Text style={styles.thoughts} selectable>
            {thoughts}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: SPACE.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, alignSelf: 'flex-start' },
  label: { fontFamily: FONT.sans, fontSize: 13, fontWeight: '500', color: C.muted },
  chevron: { fontFamily: FONT.sans, fontSize: 14, lineHeight: 16, color: C.faint },
  window: { maxHeight: CHAT_LAYOUT.thinkingMaxHeight, borderLeftWidth: 2, borderLeftColor: C.line, paddingLeft: SPACE.md },
  full: { borderLeftWidth: 2, borderLeftColor: C.line, paddingLeft: SPACE.md },
  thoughts: { fontFamily: FONT.mono, fontSize: 12, lineHeight: 18, color: C.muted },
});
