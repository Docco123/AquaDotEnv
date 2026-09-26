import { StyleSheet, Text, View } from 'react-native';
import { T } from '@/components/ui';
import { RISK } from '@/theme';
import type { RiskLevel } from '@/types';

export function RiskDot({ level, size = 10 }: { level: RiskLevel; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: RISK[level].color }} />;
}

/** Dot + colored risk label ("High risk", "Watch", …). */
export function RiskTag({ level }: { level: RiskLevel }) {
  return (
    <View style={styles.tag}>
      <RiskDot level={level} />
      <Text style={[T.label, { color: RISK[level].color }]}>{RISK[level].label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
