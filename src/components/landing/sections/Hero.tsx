import { StyleSheet, Text, View } from 'react-native';
import { C, FONT, RADIUS, SHADOW, SPACE } from '@/theme';
import { Blob, FadeUp, GradientText, PulseDot, RevealWords, webStyle, webTextStyle } from '@/components/motion';
import { RiverNetwork } from '../art/RiverNetwork';
import { LIVE_SOURCES, PITCH } from '../content';
import { ActionButton, LinkButton } from '../ui/Buttons';
import { Container } from '../ui/Container';
import { useLayout } from '../ui/layout';
import { scrollToSection, SECTION_IDS } from '../ui/scroll';
import { headingProps } from '../ui/typography';

/** Hero: eyebrow, gradient-accented display headline, pitch, CTAs, and the animated river network. */
export function Hero() {
  const { isWide } = useLayout();
  return (
    <View style={styles.hero}>
      <View aria-hidden style={[StyleSheet.absoluteFill, styles.dotGrid]} />
      <Blob colors={[C.gradient[0], C.gradient[1]]} size={560} opacity={0.26} style={{ top: -200, left: -180 }} />
      <Blob colors={[C.gradient[1], C.gradient[2]]} size={620} opacity={0.2} duration={26000} style={{ top: -80, right: -260 }} />
      <Blob colors={C.gradientWarm} size={300} opacity={0.14} duration={18000} delay={2000} style={{ bottom: 40, right: 120 }} />
      <Container style={[styles.row, isWide && styles.rowWide]}>
        <View style={[styles.copy, isWide && styles.copyWide]}>
          <FadeUp style={styles.eyebrowPill}>
            <PulseDot color={C.secondary} size={7} />
            <Text style={styles.eyebrow}>Public data, delivered downstream</Text>
          </FadeUp>
          <RevealWords
            {...headingProps(1)}
            delay={120}
            style={[styles.headline, isWide && styles.headlineWide]}
            words={['Know', 'what’s', 'flowing', <GradientText key="accent">toward you.</GradientText>]}
          />
          <FadeUp delay={450}>
            <Text style={[styles.sub, isWide && styles.subWide]}>{PITCH}</Text>
          </FadeUp>
          <FadeUp delay={600} style={styles.ctas}>
            <LinkButton href="/map" label="Open the map" arrow />
            <ActionButton variant="secondary" label="See how it works" onPress={() => scrollToSection(SECTION_IDS.how)} />
          </FadeUp>
          <FadeUp delay={750} style={styles.sources}>
            <Text style={styles.sourcesLabel}>Queried live from</Text>
            {LIVE_SOURCES.map((source) => (
              <Text key={source} style={styles.sourceChip}>
                {source}
              </Text>
            ))}
          </FadeUp>
        </View>
        <FadeUp delay={200} distance={24} style={[styles.art, isWide && styles.artWide]}>
          <RiverNetwork />
        </FadeUp>
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { position: 'relative', overflow: 'hidden', paddingTop: 56, paddingBottom: 88 },
  dotGrid: webStyle({
    backgroundImage: `radial-gradient(${C.lineStrong} 1px, transparent 1px)`,
    backgroundSize: '22px 22px',
    maskImage: 'linear-gradient(to bottom, black, transparent 75%)',
    WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 75%)',
    opacity: 0.55,
    pointerEvents: 'none',
  }),
  row: { gap: 48 },
  rowWide: { flexDirection: 'row', alignItems: 'center', gap: 56 },
  copy: { gap: SPACE.xl },
  copyWide: { flex: 1.15 },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: `${C.surface}b3`,
  },
  eyebrow: { fontFamily: FONT.mono, fontSize: 12, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', color: C.text },
  headline: webTextStyle({
    fontFamily: FONT.display,
    fontWeight: 500,
    fontSize: 48,
    lineHeight: '1.04',
    letterSpacing: -1.4,
    color: C.text,
  }),
  headlineWide: webTextStyle({ fontSize: 80, letterSpacing: -2.6 }),
  sub: { fontFamily: FONT.sans, fontSize: 18, lineHeight: 29, color: C.muted, maxWidth: 540 },
  subWide: { fontSize: 20, lineHeight: 32 },
  ctas: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.md, marginTop: SPACE.sm },
  sources: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: SPACE.sm, marginTop: SPACE.md },
  sourcesLabel: { fontFamily: FONT.mono, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.faint, marginRight: 4 },
  sourceChip: {
    fontFamily: FONT.sans,
    fontSize: 13,
    fontWeight: '500',
    color: C.muted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: C.surfaceAlt,
  },
  art: {
    width: '100%',
    aspectRatio: 480 / 420,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: `${C.surface}cc`,
    overflow: 'hidden',
    ...SHADOW.float,
  },
  artWide: { flex: 1, width: undefined },
});
