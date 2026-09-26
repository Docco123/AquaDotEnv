import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from './useReducedMotion';
import { webStyle } from './webStyle';

type BlobProps = {
  colors: readonly string[];
  /** Width in px; height is 80% of it for a soft ellipse. */
  size: number;
  opacity?: number;
  /** CSS blur radius in px. */
  blur?: number;
  /** ms for one full drift loop. */
  duration?: number;
  delay?: number;
  /** Position it (top/left/right/bottom) from the parent. */
  style?: StyleProp<ViewStyle>;
};

/** Decorative blurred gradient ellipse that drifts slowly; absolutely positioned, ignores pointer input. */
export function Blob({ colors, size, opacity = 0.3, blur = 80, duration = 22000, delay = 0, style }: BlobProps) {
  const reduced = useReducedMotion();
  const paint = webStyle({
    backgroundImage: `linear-gradient(135deg, ${colors.join(', ')})`,
    filter: `blur(${blur}px)`,
    animationDuration: `${duration}ms`,
    animationDelay: `${delay}ms`,
  });
  return (
    <View
      aria-hidden
      style={[styles.base, { width: size, height: size * 0.8, opacity }, paint, !reduced && styles.drift, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
    borderRadius: 9999,
    pointerEvents: 'none',
  },
  drift: webStyle({
    willChange: 'transform',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    animationDirection: 'alternate',
    animationKeyframes: {
      '0%': { transform: 'translate3d(0, 0, 0) scale(1)' },
      '50%': { transform: 'translate3d(4%, -6%, 0) scale(1.06)' },
      '100%': { transform: 'translate3d(-5%, 4%, 0) scale(0.96)' },
    },
  }),
});
