import { StyleSheet, Text, View } from 'react-native';
import { Card, ExternalLink, Section, T } from '@/components/ui';
import { shortDateTime } from '@/map/format';
import { SPACE, fmtNum } from '@/theme';
import type { Gauge } from '@/types';

const MAX_GAUGES = 3;

/** Up to three USGS gauges with their latest flow. */
export function GaugesStrip({ gauges }: { gauges: Gauge[] | null | undefined }) {
  if (!gauges || gauges.length === 0) return null;
  return (
    <Section title="Stream gauges">
      <View style={styles.row}>
        {gauges.slice(0, MAX_GAUGES).map((g) => (
          <Card key={g.id} style={styles.card}>
            <Text style={[T.small, styles.name]} numberOfLines={2}>
              {g.name}
            </Text>
            {g.flowCfs === null ? (
              <Text style={T.small}>Flow unavailable</Text>
            ) : (
              <Text style={[T.title, T.num]}>{fmtNum(g.flowCfs)} cfs</Text>
            )}
            {g.flowCfs !== null && !!shortDateTime(g.flowTime) && <Text style={T.tiny}>{shortDateTime(g.flowTime)}</Text>}
            <ExternalLink label="USGS" url={g.uri} />
          </Card>
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: SPACE.sm },
  card: { flex: 1, minWidth: 0, padding: SPACE.md, gap: 4 },
  name: { minHeight: 34 },
});
