import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from './useReducedMotion';
import { webStyle } from './webStyle';

type PulseDotProps = { color: string; size?: number };

/** Small status dot with a soft radar ring (e.g. "live"). */
export function PulseDot({ color, size = 8 }: PulseDotProps) {
  const reduced = useReducedMotion();
  const dot = { width: size, height: size, borderRadius: size / 2, backgroundColor: color };
  return (
    <View aria-hidden style={[styles.wrap, { width: size, height: size }]}>
      {!reduced && <View style={[StyleSheet.absoluteFill, dot, styles.ring]} />}
      <View style={dot} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  ring: webStyle({
    animationDuration: '2000ms',
    animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
    animationIterationCount: 'infinite',
    animationKeyframes: {
      '0%': { transform: 'scale(1)', opacity: 0.6 },
      '80%, 100%': { transform: 'scale(2.8)', opacity: 0 },
    },
  }),
});
