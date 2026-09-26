import { StyleSheet, Text, View } from 'react-native';
import { C, FONT, SPACE } from '@/theme';
import { CountUp, FadeUp } from '@/components/motion';
import { STATS, STATS_SOURCE, type StatFact } from '../content';
import { Container } from '../ui/Container';
import { Grid } from '../ui/Grid';
import { useLayout } from '../ui/layout';
import { TYPE } from '../ui/typography';

function StatItem({ stat, index }: { stat: StatFact; index: number }) {
  return (
    <FadeUp delay={index * 90} style={styles.item}>
      <View style={styles.valueRow}>
        <CountUp value={stat.value} prefix={stat.prefix} style={styles.value} />
        <Text style={styles.unit}>{stat.unit}</Text>
      </View>
      <Text style={TYPE.small}>{stat.label}</Text>
    </FadeUp>
  );
}

/** Stat strip: the Elk River spill and Ohio's notification limit, counted up on scroll. */
export function StatStrip() {
  const { isWide, isNarrow } = useLayout();
  return (
    <View style={styles.band}>
      <Container style={styles.inner}>
        <Grid columns={isWide ? 4 : isNarrow ? 1 : 2} gap={isWide ? 32 : 28}>
          {STATS.map((stat, index) => (
            <StatItem key={stat.unit} stat={stat} index={index} />
          ))}
        </Grid>
        <Text style={TYPE.mono}>Sources: {STATS_SOURCE}</Text>
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { backgroundColor: C.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line },
  inner: { paddingVertical: 48, gap: SPACE.xl },
  item: { gap: SPACE.sm, borderLeftWidth: 2, borderLeftColor: `${C.primary}33`, paddingLeft: SPACE.lg },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  value: { fontFamily: FONT.display, fontSize: 44, lineHeight: 48, fontWeight: '500', letterSpacing: -1, color: C.text },
  unit: { fontFamily: FONT.sans, fontSize: 16, fontWeight: '600', color: C.primary },
});
