import { StyleSheet, Text, View } from 'react-native';
import { C, FONT, SPACE } from '@/theme';
import { FadeUp } from '@/components/motion';
import { PROBLEM } from '../content';
import { Section } from '../ui/Section';
import { SectionHeading } from '../ui/SectionHeading';
import { useLayout } from '../ui/layout';
import { SECTION_IDS } from '../ui/scroll';
import { TYPE } from '../ui/typography';
import { ElkRiverStory } from './ElkRiverStory';
import { WhyUnsolved } from './WhyUnsolved';

/** Pull quote carrying the one-way-road analogy. */
function RoadAnalogy() {
  return (
    <FadeUp delay={200} style={styles.quote}>
      <Text style={styles.quoteLead}>{PROBLEM.analogyLead}</Text>
      <Text style={TYPE.body}>{PROBLEM.analogyRest}</Text>
    </FadeUp>
  );
}

/** Problem: nobody downstream is told what's upstream (analogy, Elk River story, why it's unsolved). */
export function ProblemSection() {
  const { isWide } = useLayout();
  return (
    <Section id={SECTION_IDS.problem}>
      <View style={[styles.columns, isWide && styles.columnsWide]}>
        <View style={[styles.left, isWide && styles.flex]}>
          <SectionHeading eyebrow={PROBLEM.eyebrow} title={PROBLEM.title} />
          <FadeUp delay={100} style={styles.paragraphs}>
            {PROBLEM.paragraphs.map((p) => (
              <Text key={p} style={TYPE.lede}>
                {p}
              </Text>
            ))}
          </FadeUp>
          <RoadAnalogy />
        </View>
        <View style={isWide && styles.flex}>
          <ElkRiverStory />
        </View>
      </View>
      <WhyUnsolved />
    </Section>
  );
}

const styles = StyleSheet.create({
  columns: { gap: 40 },
  columnsWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 64 },
  flex: { flex: 1 },
  left: { gap: SPACE.xl },
  paragraphs: { gap: SPACE.lg },
  quote: { gap: SPACE.sm, borderLeftWidth: 3, borderLeftColor: C.secondary, paddingLeft: SPACE.xl, marginTop: SPACE.sm },
  quoteLead: { fontFamily: FONT.display, fontSize: 26, lineHeight: 32, fontWeight: '500', letterSpacing: -0.4, color: C.text },
});
