import { StyleSheet, Text, View, type TextStyle } from 'react-native';
import { Card, T } from '@/components/ui';
import { distanceAndTravel, flowSpeed, riverMiles, travelHours } from '@/map/format';
import { C, RADIUS, RISK, SPACE } from '@/theme';
import type { UpstreamTrace } from '@/types';

/** Active vs expired/terminated permits; computed from facilities when the summary lacks them. */
function activeCounts(trace: UpstreamTrace): { active: number; inactive: number } {
  const s = trace.summary;
  const inactive = s.inactive ?? trace.facilities.filter((f) => f.permitActive === false).length;
  return { active: s.activeTotal ?? trace.facilities.length - inactive, inactive };
}

function Stat({ value, label, alert }: { value: number; label: string; alert?: boolean }) {
  const color = alert && value > 0 ? RISK.high.color : C.text;
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[T.small, styles.statLabel]}>{label}</Text>
    </View>
  );
}

/** Headline card: where the pin is and what sits upstream of it. */
export function SummaryCard({ trace }: { trace: UpstreamTrace }) {
  const { pin, summary } = trace;
  const { active, inactive } = activeCounts(trace);
  const title = pin.waterName ?? pin.huc12Name ?? 'Unnamed stream';
  const place = [pin.waterName ? pin.huc12Name : null, pin.huc8Name, pin.state].filter(Boolean).join(' · ');
  const nearestKm = summary.nearestViolatorKm;
  const nearest = distanceAndTravel(nearestKm, travelHours(nearestKm, trace.velocityMps));

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Text style={T.display} numberOfLines={2}>
          {title}
        </Text>
        {!!place && <Text style={T.small}>{place}</Text>}
      </View>
      <Text style={T.label}>Within {riverMiles(trace.distanceKm)} upstream</Text>
      <View style={styles.stats}>
        <Stat value={active} label="active dischargers" />
        <Stat value={summary.withViolations} label="with violations" alert />
        <Stat value={summary.snc} label="serious violators (SNC)" alert />
        <Stat value={summary.highRisk} label="high risk" alert />
      </View>
      {inactive > 0 && <Text style={T.tiny}>+{inactive} expired or terminated permits not counted</Text>}
      {nearestKm !== null && (
        <View style={styles.nearest}>
          <Text style={[T.body, T.num]}>
            <Text style={styles.nearestLabel}>Nearest violator: </Text>
            {nearest} travel
          </Text>
        </View>
      )}
      <Text style={T.tiny}>
        Assumes {flowSpeed(trace.velocityMps)} flow{trace.velocitySource ? ` (${trace.velocitySource})` : ''}. Travel times
        are rough estimates.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: SPACE.md },
  head: { gap: 2 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
  stat: {
    flexGrow: 1,
    flexBasis: '22%',
    minWidth: 84,
    padding: SPACE.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: C.background,
    gap: 2,
  },
  /** Short words only; never break inside a word. */
  statLabel: { fontSize: 11, lineHeight: 14, wordBreak: 'keep-all', overflowWrap: 'normal' } as TextStyle,
  statValue: { fontSize: 26, lineHeight: 30, fontWeight: '700', fontVariant: ['tabular-nums'] },
  nearest: { padding: SPACE.sm, borderRadius: RADIUS.sm, backgroundColor: RISK.elevated.soft },
  nearestLabel: { fontWeight: '700', color: RISK.elevated.color },
});
