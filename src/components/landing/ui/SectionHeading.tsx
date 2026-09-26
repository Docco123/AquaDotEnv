import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { SPACE } from '@/theme';
import { FadeUp } from '@/components/motion';
import { useLayout } from './layout';
import { headingProps, TYPE } from './typography';

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  lede?: string;
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
};

/** Eyebrow + display title + optional lede, revealed on scroll. */
export function SectionHeading({ eyebrow, title, lede, align = 'left', style }: SectionHeadingProps) {
  const { isWide } = useLayout();
  const centered = align === 'center';
  return (
    <FadeUp style={[styles.wrap, centered && styles.centered, style]}>
      <Text style={TYPE.eyebrow}>{eyebrow}</Text>
      <Text {...headingProps(2)} style={[TYPE.h2, isWide && TYPE.h2Wide, centered && styles.textCenter]}>
        {title}
      </Text>
      {lede ? <Text style={[TYPE.lede, centered && styles.textCenter]}>{lede}</Text> : null}
    </FadeUp>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACE.lg, maxWidth: 720 },
  centered: { alignSelf: 'center', alignItems: 'center' },
  textCenter: { textAlign: 'center' },
});
