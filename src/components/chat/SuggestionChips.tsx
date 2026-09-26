import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C, FONT, RADIUS, SPACE } from '@/theme';
import { CHAT } from './config';

function Suggestion({ label, onPress }: { label: string; onPress(): void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      style={[styles.chip, hovered && styles.chipHover]}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

/** Starter questions shown while the conversation is empty. */
export function SuggestionChips({ onPick }: { onPick(text: string): void }) {
  return (
    <View style={styles.row}>
      {CHAT.suggestions.map((s) => (
        <Suggestion key={s} label={s} onPress={() => onPick(s)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm, paddingHorizontal: SPACE.lg, paddingBottom: SPACE.md },
  chip: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACE.md,
    paddingVertical: 6,
    backgroundColor: C.surface,
  },
  chipHover: { backgroundColor: C.surfaceAlt },
  text: { fontFamily: FONT.sans, fontSize: 13, color: C.text },
});
