import { StyleSheet, Text } from 'react-native';
import { C, FONT, RADIUS, SHADOW, SPACE } from '@/theme';
import { FadeUp, HoverCard } from '@/components/motion';
import { WHY_UNSOLVED, type GapItem } from '../content';
import { Grid } from '../ui/Grid';
import { useLayout } from '../ui/layout';
import { headingProps, TYPE } from '../ui/typography';

function GapCard({ item, index }: { item: GapItem; index: number }) {
  const tone = item.highlight ? C.accent : C.primary;
  return (
    <FadeUp delay={index * 100}>
      <HoverCard style={[styles.card, item.highlight && styles.cardHighlight]} spotlightColor={`${tone}14`}>
        <Text style={[styles.tag, { color: tone }]}>{item.tag}</Text>
        <Text {...headingProps(3)} style={styles.title}>
          {item.title}
        </Text>
        <Text style={TYPE.small}>{item.body}</Text>
      </HoverCard>
    </FadeUp>
  );
}

/** "Why hasn't this been solved?": existing tools and the gap they leave. */
export function WhyUnsolved() {
  const { isWide } = useLayout();
  return (
    <FadeUp style={styles.wrap}>
      <Text style={TYPE.eyebrow}>Why it’s unsolved</Text>
      <Text {...headingProps(3)} style={[TYPE.h3, isWide && styles.headWide]}>
        {WHY_UNSOLVED.title}
      </Text>
      <Grid columns={isWide ? 3 : 1} style={styles.grid}>
        {WHY_UNSOLVED.items.map((item, index) => (
          <GapCard key={item.tag} item={item} index={index} />
        ))}
      </Grid>
    </FadeUp>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACE.md, marginTop: 72 },
  headWide: { fontSize: 28, lineHeight: 34 },
  grid: { marginTop: SPACE.md },
  card: {
    height: '100%',
    gap: SPACE.sm,
    padding: SPACE.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.surface,
    ...SHADOW.card,
  },
  cardHighlight: { borderColor: `${C.accent}55` },
  tag: { fontFamily: FONT.mono, fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { fontFamily: FONT.sans, fontSize: 17, fontWeight: '700', color: C.text },
});
