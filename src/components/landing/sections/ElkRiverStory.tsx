import { StyleSheet, Text, View } from 'react-native';
import { C, FONT, RADIUS, SHADOW, SPACE } from '@/theme';
import { Blob, FadeUp } from '@/components/motion';
import { ELK_RIVER } from '../content';
import { headingProps } from '../ui/typography';

/** Dark story card: the 2014 Elk River leak and how narrow notification law is. */
export function ElkRiverStory() {
  return (
    <FadeUp delay={150} style={styles.card}>
      <Blob colors={C.gradientWarm} size={320} opacity={0.22} style={{ top: -140, right: -120 }} />
      <Text style={styles.eyebrow}>{ELK_RIVER.eyebrow}</Text>
      <Text {...headingProps(3)} style={styles.lead}>
        {ELK_RIVER.lead}
      </Text>
      <Text style={styles.impact}>{ELK_RIVER.impact}</Text>
      <View style={styles.divider} />
      <Text style={styles.lawTitle}>{ELK_RIVER.lawTitle}</Text>
      <Text style={styles.body}>{ELK_RIVER.law}</Text>
      <Text style={styles.kicker}>{ELK_RIVER.kicker}</Text>
    </FadeUp>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    gap: SPACE.lg,
    padding: 32,
    borderRadius: RADIUS.xl,
    backgroundColor: C.navy,
    ...SHADOW.float,
  },
  eyebrow: { fontFamily: FONT.mono, fontSize: 12, fontWeight: '600', letterSpacing: 1.4, textTransform: 'uppercase', color: C.accent },
  lead: { fontFamily: FONT.display, fontSize: 26, lineHeight: 34, fontWeight: '500', letterSpacing: -0.4, color: C.inverse },
  impact: { fontFamily: FONT.sans, fontSize: 17, lineHeight: 27, color: `${C.inverse}cc` },
  divider: { height: 1, backgroundColor: `${C.inverse}22`, marginVertical: SPACE.xs },
  lawTitle: { fontFamily: FONT.sans, fontSize: 15, fontWeight: '700', color: C.inverse },
  body: { fontFamily: FONT.sans, fontSize: 15, lineHeight: 25, color: `${C.inverse}b3` },
  kicker: { fontFamily: FONT.display, fontSize: 22, lineHeight: 28, fontWeight: '500', color: C.accent, marginTop: SPACE.xs },
});
