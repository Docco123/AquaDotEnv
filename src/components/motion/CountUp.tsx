import { useEffect, useState } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';
import { useInView } from './useInView';
import { useReducedMotion } from './useReducedMotion';

type CountUpProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  /** ms for the full count (ignored with reduced motion). */
  duration?: number;
  format?: (n: number) => string;
  style?: StyleProp<TextStyle>;
};

/** Locale-stable integer formatting (same output on server and client). */
export const formatInteger = (n: number) => Math.round(n).toLocaleString('en-US');

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Tweens 0 → target with requestAnimationFrame once `active` turns true. */
function useCountTween(target: number, active: boolean, duration: number): number {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = duration > 0 ? Math.min(1, (now - start) / duration) : 1;
      setCurrent(target * easeOutCubic(t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, duration]);
  return current;
}

/** Animated number: counts up from 0 when scrolled into view; screen readers get the final value. */
export function CountUp({ value, prefix = '', suffix = '', duration = 1800, format = formatInteger, style }: CountUpProps) {
  const [ref, inView] = useInView<Text>();
  const reduced = useReducedMotion();
  const current = useCountTween(value, inView, reduced ? 0 : duration);
  return (
    <Text ref={ref} style={[{ fontVariant: ['tabular-nums'] }, style]} aria-label={`${prefix}${format(value)}${suffix}`}>
      {prefix}
      {format(current)}
      {suffix}
    </Text>
  );
}
