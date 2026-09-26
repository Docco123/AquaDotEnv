import { StyleSheet, Text, View } from 'react-native';
import { C, FONT, RADIUS, SPACE } from '@/theme';
import { Blob, FadeUp, GradientText, webStyle } from '@/components/motion';
import { LinkButton } from '../ui/Buttons';
import { Container } from '../ui/Container';
import { useLayout } from '../ui/layout';
import { headingProps } from '../ui/typography';

/** Closing dark band with the primary call to action. */
export function FinalCta() {
  const { isWide } = useLayout();
  return (
    <Container style={styles.outer}>
      <FadeUp style={[styles.band, styles.bandGradient, isWide && styles.bandWide]}>
        <Blob colors={C.gradient} size={520} opacity={0.35} style={{ top: -220, right: -160 }} />
        <Blob colors={C.gradientWarm} size={260} opacity={0.18} duration={16000} style={{ bottom: -140, left: -60 }} />
        <Text {...headingProps(2)} style={[styles.title, isWide && styles.titleWide]}>
          Drop a pin. See what’s <GradientText colors={[C.secondary, C.accentSoft]}>upstream.</GradientText>
        </Text>
        <Text style={styles.sub}>
          Every permitted discharger above your water, with its public EPA compliance record, traced on the USGS flow network.
        </Text>
        <View style={styles.ctas}>
          <LinkButton href="/map" label="Open the map" variant="inverse" arrow />
        </View>
      </FadeUp>
    </Container>
  );
}

const styles = StyleSheet.create({
  outer: { paddingVertical: SPACE.section / 2 },
  band: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: RADIUS.xl,
    paddingVertical: 56,
    paddingHorizontal: 28,
    gap: SPACE.xl,
    alignItems: 'center',
    backgroundColor: C.navy,
  },
  bandGradient: webStyle({ backgroundImage: `linear-gradient(160deg, ${C.navy}, ${C.navy2})` }),
  bandWide: { paddingVertical: 88, paddingHorizontal: 64 },
  title: {
    fontFamily: FONT.display,
    fontWeight: '500',
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -1,
    color: C.inverse,
    textAlign: 'center',
  },
  titleWide: { fontSize: 56, lineHeight: 62, letterSpacing: -1.8 },
  sub: { fontFamily: FONT.sans, fontSize: 17, lineHeight: 28, color: `${C.inverse}b3`, textAlign: 'center', maxWidth: 560 },
  ctas: { flexDirection: 'row', marginTop: SPACE.sm },
});
