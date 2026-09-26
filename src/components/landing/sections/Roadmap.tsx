import { StyleSheet, Text, View } from 'react-native';
import { C, FONT, SPACE } from '@/theme';
import { FadeUp, PulseDot } from '@/components/motion';
import { ROADMAP, type Milestone } from '../content';
import { Section } from '../ui/Section';
import { SectionHeading } from '../ui/SectionHeading';
import { useLayout } from '../ui/layout';
import { headingProps, TYPE } from '../ui/typography';

function Node({ current }: { current?: boolean }) {
  return current ? (
    <View style={[styles.node, styles.nodeCurrent]}>
      <PulseDot color={C.accent} size={8} />
    </View>
  ) : (
    <View style={styles.node} />
  );
}

function MilestoneItem({ item, index, wide }: { item: Milestone; index: number; wide: boolean }) {
  return (
    <FadeUp delay={index * 100} style={[styles.item, wide ? styles.itemWide : styles.itemStacked]}>
      <Node current={item.current} />
      <View style={styles.itemText}>
        <Text style={[styles.when, item.current && { color: C.accent }]}>{item.when}</Text>
        <Text {...headingProps(3)} style={styles.title}>
          {item.title}
        </Text>
        <Text style={TYPE.small}>{item.body}</Text>
      </View>
    </FadeUp>
  );
}

/** Roadmap timeline: horizontal on wide screens, vertical when stacked. */
export function Roadmap() {
  const { isWide } = useLayout();
  return (
    <Section>
      <SectionHeading eyebrow="Roadmap" title="From one basin to every river." style={{ marginBottom: 56 }} />
      <View style={[styles.track, isWide ? styles.trackWide : styles.trackStacked]}>
        <View aria-hidden style={[styles.rail, isWide ? styles.railWide : styles.railStacked]} />
        {ROADMAP.map((item, index) => (
          <MilestoneItem key={item.when} item={item} index={index} wide={isWide} />
        ))}
      </View>
    </Section>
  );
}

const NODE = 18;

const styles = StyleSheet.create({
  track: { position: 'relative' },
  trackWide: { flexDirection: 'row', gap: SPACE.xl },
  trackStacked: { gap: 32 },
  rail: { position: 'absolute', backgroundColor: C.lineStrong },
  railWide: { top: NODE / 2, left: 0, right: 0, height: 1 },
  railStacked: { top: 4, bottom: 4, left: NODE / 2, width: 1 },
  item: { gap: SPACE.lg },
  itemWide: { flex: 1 },
  itemStacked: { flexDirection: 'row' },
  itemText: { flex: 1, gap: 6 },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: 2,
    borderColor: C.lineStrong,
    backgroundColor: C.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCurrent: { borderColor: C.accent },
  when: { fontFamily: FONT.mono, fontSize: 12, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', color: C.primary },
  title: { fontFamily: FONT.display, fontSize: 20, lineHeight: 26, fontWeight: '500', color: C.text },
});
