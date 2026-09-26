import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { C, FONT, RADIUS, SPACE } from '@/theme';
import { T } from './typography';

/** Toggle chip for filters. */
export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress(): void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export interface SegmentOption<V extends string | number> {
  value: V;
  label: string;
}

/** Compact segmented control (one option selected). */
export function Segmented<V extends string | number>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: readonly SegmentOption<V>[];
  value: V;
  onChange(v: V): void;
  accessibilityLabel: string;
}) {
  return (
    <View style={styles.segments} accessibilityLabel={accessibilityLabel} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={[styles.segment, on && styles.segmentOn]}
          >
            <Text style={[styles.segmentText, on && styles.segmentTextOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ActionLink({ label, onPress }: { label: string; onPress(): void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={6}>
      <Text style={T.link}>{label}</Text>
    </Pressable>
  );
}

export function ExternalLink({ label, url }: { label: string; url: string }) {
  return (
    <Pressable onPress={() => Linking.openURL(url)} accessibilityRole="link" hitSlop={6}>
      <Text style={T.link}>{label} ↗</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACE.md,
    paddingVertical: 5,
    backgroundColor: C.surface,
  },
  chipActive: { backgroundColor: C.text, borderColor: C.text },
  chipText: { fontFamily: FONT.sans, fontSize: 12, fontWeight: '500', color: C.text },
  chipTextActive: { color: C.inverse },
  segments: {
    flexDirection: 'row',
    backgroundColor: C.surfaceAlt,
    borderRadius: RADIUS.sm,
    padding: 2,
    gap: 2,
  },
  segment: { paddingHorizontal: SPACE.sm + 2, paddingVertical: 5, borderRadius: RADIUS.sm - 2 },
  segmentOn: { backgroundColor: C.surface },
  segmentText: { fontFamily: FONT.sans, fontSize: 12, fontWeight: '600', color: C.muted, fontVariant: ['tabular-nums'] },
  segmentTextOn: { color: C.text },
});
