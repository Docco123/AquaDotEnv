import { StyleSheet, Text, View } from 'react-native';
import { C, FONT, RADIUS, RISK, SPACE } from '@/theme';
import type { RiskLevel } from '@/types';
import { EXAMPLE_EXPLANATION } from '../content';
import { Badge } from '../ui/Badge';

const LEVELS: RiskLevel[] = ['high', 'elevated', 'watch', 'low', 'unknown'];

/** Step 3 illustration: the risk scale plus an example plain-English explanation. */
export function RiskExplainer() {
  return (
    <View style={styles.wrap}>
      <View style={styles.ladder}>
        {LEVELS.map((level) => (
          <View key={level} style={[styles.chip, { backgroundColor: RISK[level].soft }]}>
            <View style={[styles.dot, { backgroundColor: RISK[level].color }]} />
            <Text style={[styles.chipText, { color: RISK[level].color }]}>{RISK[level].label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.bubble}>
        <Badge kind="example" />
        <Text style={styles.quote}>{EXAMPLE_EXPLANATION}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACE.lg, justifyContent: 'center', flex: 1 },
  ladder: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.pill },
  dot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { fontFamily: FONT.sans, fontSize: 13, fontWeight: '600' },
  bubble: {
    gap: SPACE.md,
    padding: SPACE.xl,
    borderRadius: RADIUS.lg,
    borderTopLeftRadius: RADIUS.sm,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.line,
  },
  quote: { fontFamily: FONT.display, fontSize: 19, lineHeight: 28, color: C.text },
});
