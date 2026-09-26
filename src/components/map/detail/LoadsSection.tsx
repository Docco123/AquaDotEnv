import { StyleSheet, Text, View } from 'react-native';
import { Card, ErrorNote, Loading, Section, T } from '@/components/ui';
import { useFacilityLoads } from '@/hooks/useFacilityData';
import { C, RADIUS, RISK, SPACE, fmtLbs } from '@/theme';

/** "What it discharges": annual pounds per pollutant from EPA's Loading Tool. */
export function LoadsSection({ huc8, permitId }: { huc8: string | null; permitId: string }) {
  const { totals, year, loading, error, retry, data } = useFacilityLoads(huc8, permitId);
  if (!huc8) return null;
  const max = totals[0]?.lbs ?? 1;

  return (
    <Section title={`What it discharges · ${year}`}>
      <Card style={styles.card}>
        {loading && <Loading label="Loading annual loads…" />}
        {error && <ErrorNote message={`Couldn't load annual loads: ${error}`} onRetry={retry} />}
        {data && totals.length === 0 && (
          <Text style={T.small}>No DMR-based loads were calculated for this permit in {year}.</Text>
        )}
        {totals.map((t) => (
          <View key={t.param} style={styles.row}>
            <View style={styles.line}>
              <Text style={[T.small, styles.param]} numberOfLines={1}>
                {t.param}
              </Text>
              <Text style={[T.small, T.num, styles.lbs]}>{fmtLbs(t.lbs)}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.max(2, (t.lbs / max) * 100)}%` }]} />
            </View>
            {t.overLimitLbs > 0 && (
              <Text style={[T.tiny, { color: RISK.high.color }]}>{fmtLbs(t.overLimitLbs)} over the permit limit</Text>
            )}
          </View>
        ))}
      </Card>
    </Section>
  );
}

const styles = StyleSheet.create({
  card: { gap: SPACE.sm },
  row: { gap: 3 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACE.sm },
  param: { flex: 1, color: C.text },
  lbs: { color: C.text },
  track: { height: 6, borderRadius: RADIUS.pill, backgroundColor: C.surfaceAlt, overflow: 'hidden' },
  fill: { height: 6, borderRadius: RADIUS.pill, backgroundColor: C.primary },
});
