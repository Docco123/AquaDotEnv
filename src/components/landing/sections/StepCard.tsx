import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { C, FONT, RADIUS, SHADOW, SPACE } from '@/theme';
import { FadeUp, HoverCard, webStyle } from '@/components/motion';
import type { Step } from '../content';
import { headingProps, TYPE } from '../ui/typography';

type StepCardProps = {
  step: Step;
  index: number;
  /** Illustration area shown above (or beside, when `horizontal`) the text. */
  art: ReactNode;
  horizontal?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** One bento tile of "How it works": illustration + numbered title + body. */
export function StepCard({ step, index, art, horizontal = false, style }: StepCardProps) {
  return (
    <FadeUp delay={index * 110} style={style}>
      <HoverCard style={[styles.card, horizontal && styles.horizontal]}>
        <View style={[styles.text, horizontal && styles.flex]}>
          <Text style={styles.number}>{step.number}</Text>
          <Text {...headingProps(3)} style={TYPE.h3}>
            {step.title}
          </Text>
          <Text style={TYPE.body}>{step.body}</Text>
        </View>
        <View style={[styles.art, horizontal && styles.flex]}>{art}</View>
      </HoverCard>
    </FadeUp>
  );
}

/** Tinted tile with a centered icon, used as a lightweight step illustration. */
export function IconArt({ children }: { children: ReactNode }) {
  return (
    <View style={[styles.iconArt, styles.tint]}>
      <View style={styles.iconBubble}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: '100%',
    flexDirection: 'column-reverse',
    gap: SPACE.xl,
    padding: SPACE.xl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.surface,
    ...SHADOW.card,
  },
  horizontal: { flexDirection: 'row', alignItems: 'center', gap: 40 },
  flex: { flex: 1 },
  text: { gap: SPACE.sm },
  number: { fontFamily: FONT.mono, fontSize: 12, fontWeight: '600', letterSpacing: 1.2, color: C.primary },
  art: { minHeight: 160 },
  iconArt: { flex: 1, minHeight: 160, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  tint: webStyle({
    backgroundImage: `radial-gradient(circle at 50% 60%, ${C.primary}1f, transparent 65%), radial-gradient(${C.lineStrong} 1px, transparent 1px)`,
    backgroundSize: 'auto, 18px 18px',
    backgroundColor: C.surfaceAlt,
  }),
  iconBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    ...SHADOW.float,
  },
});
