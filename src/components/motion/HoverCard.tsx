import { useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type PointerEvent, type StyleProp, type ViewStyle } from 'react-native';
import { C, SHADOW } from '@/theme';
import { EASE_OUT, webStyle } from './webStyle';

type HoverCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Cursor-following radial highlight (motion-primitives "spotlight"). */
  spotlight?: boolean;
  spotlightColor?: string;
};

/** Card that lifts 2px with a deeper shadow on (mouse) hover, optionally with a spotlight glow. */
export function HoverCard({ children, style, spotlight = true, spotlightColor = `${C.primary}14` }: HoverCardProps) {
  const ref = useRef<View>(null);
  const [hovered, setHovered] = useState(false);

  const isMouse = (e: PointerEvent) => e.nativeEvent.pointerType === 'mouse';
  const trackSpotlight = (e: PointerEvent) => {
    const node = ref.current as unknown as HTMLElement | null;
    if (!spotlight || !node || !isMouse(e)) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty('--spot-x', `${e.nativeEvent.clientX - rect.left}px`);
    node.style.setProperty('--spot-y', `${e.nativeEvent.clientY - rect.top}px`);
  };

  return (
    <View
      ref={ref}
      onPointerEnter={(e) => isMouse(e) && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onPointerMove={trackSpotlight}
      style={[styles.card, style, hovered && styles.lifted]}
    >
      {spotlight && (
        <View
          aria-hidden
          style={[
            styles.spotlight,
            { opacity: hovered ? 1 : 0 },
            webStyle({
              backgroundImage: `radial-gradient(360px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${spotlightColor}, transparent 70%)`,
            }),
          ]}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: webStyle({
    position: 'relative',
    overflow: 'hidden',
    transitionProperty: 'transform, box-shadow, border-color',
    transitionDuration: '300ms',
    transitionTimingFunction: EASE_OUT,
  }),
  lifted: {
    transform: [{ translateY: -2 }],
    ...SHADOW.float,
  },
  spotlight: webStyle({
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    transitionProperty: 'opacity',
    transitionDuration: '300ms',
  }),
});
