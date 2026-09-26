import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SPACE } from '@/theme';
import { webStyle } from '@/components/motion';
import { Container } from './Container';
import { useLayout } from './layout';

type SectionProps = {
  children: ReactNode;
  /** DOM id used as an in-page scroll target. */
  id?: string;
  style?: StyleProp<ViewStyle>;
};

/** Vertical page band with consistent rhythm; content sits in a Container. */
export function Section({ children, id, style }: SectionProps) {
  const { isWide } = useLayout();
  return (
    <View id={id} style={[styles.band, { paddingVertical: isWide ? SPACE.section : 64 }, style]}>
      <Container>{children}</Container>
    </View>
  );
}

const styles = StyleSheet.create({
  band: webStyle({ position: 'relative', scrollMarginTop: 72 }),
});
