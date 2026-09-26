import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { revealStyle, type RevealOptions } from './reveal';
import { useInView } from './useInView';
import { useReducedMotion } from './useReducedMotion';

type FadeUpProps = RevealOptions & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** In-view reveal: fades children up (and out of a light blur) the first time they scroll into view. */
export function FadeUp({ children, style, ...reveal }: FadeUpProps) {
  const [ref, inView] = useInView<View>();
  const reduced = useReducedMotion();
  return (
    <View ref={ref} style={[style, revealStyle(inView, reduced, reveal)]}>
      {children}
    </View>
  );
}
