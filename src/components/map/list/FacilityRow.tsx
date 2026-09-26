import { Pressable, StyleSheet, Text, View } from 'react-native';
import { T } from '@/components/ui';
import { distanceAndTravel } from '@/map/format';
import { C, SPACE } from '@/theme';
import type { PermitGroup, UpstreamFacility } from '@/types';
import { RiskTag } from '../RiskDot';

const GROUP_SHORT: Record<PermitGroup, string> = {
  major: 'Major',
  individual: 'Individual',
  general: 'General',
  pretreatment: 'Pretreatment',
};

interface Props {
  facility: UpstreamFacility;
  onPress(id: string): void;
  dimmed?: boolean;
}

export function FacilityRow({ facility: f, onPress, dimmed }: Props) {
  return (
    <Pressable
      onPress={() => onPress(f.id)}
      accessibilityRole="button"
      accessibilityLabel={`${f.name}, ${f.risk.level} risk`}
      style={({ pressed }) => [styles.row, dimmed && styles.dimmed, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <RiskTag level={f.risk.level} />
        <Text style={[T.small, T.num]}>{distanceAndTravel(f.riverKm, f.travelHours)}</Text>
      </View>
      <Text style={[T.body, styles.name]} numberOfLines={1}>
        {f.name}
      </Text>
      <Text style={T.mono} numberOfLines={1}>
        {f.id} · {GROUP_SHORT[f.group]}
      </Text>
      {!!f.risk.reasons[0] && (
        <Text style={T.small} numberOfLines={2}>
          {f.risk.reasons[0]}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 3,
    paddingVertical: SPACE.md,
    paddingHorizontal: SPACE.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.sm },
  name: { fontWeight: '600' },
  dimmed: { opacity: 0.65 },
  pressed: { backgroundColor: C.surfaceAlt },
});
