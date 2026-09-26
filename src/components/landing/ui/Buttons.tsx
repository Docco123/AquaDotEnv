import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import { C, FONT, RADIUS } from '@/theme';
import { EASE_OUT, webStyle } from '@/components/motion';
import { ArrowRightIcon } from '../art/icons';

type Variant = 'primary' | 'secondary' | 'inverse';
type Size = 'md' | 'sm';

type ButtonLookProps = {
  label: string;
  variant?: Variant;
  size?: Size;
  /** Show a trailing arrow that nudges right on hover. */
  arrow?: boolean;
};

/** react-native-web adds hover/focus to Pressable's interaction state. */
type WebPressState = PressableStateCallbackType & { hovered?: boolean; focused?: boolean };

const TEXT_COLOR: Record<Variant, string> = { primary: C.surface, secondary: C.text, inverse: C.navy };

/** Visual pill shared by link and action buttons. */
function ButtonFace({ label, variant = 'primary', size = 'md', arrow = false, state }: ButtonLookProps & { state: WebPressState }) {
  const { hovered = false, focused = false, pressed } = state;
  const color = TEXT_COLOR[variant];
  return (
    <View
      style={[
        styles.face,
        size === 'sm' ? styles.sm : styles.md,
        FACE[variant],
        hovered && styles.lift,
        hovered && HOVER[variant],
        pressed && styles.pressed,
        focused && styles.focusRing,
      ]}
    >
      <Text style={[styles.label, size === 'sm' && styles.labelSm, { color }]}>{label}</Text>
      {arrow && (
        <View style={[styles.arrow, hovered && styles.arrowHover]}>
          <ArrowRightIcon size={size === 'sm' ? 15 : 17} color={color} strokeWidth={2} />
        </View>
      )}
    </View>
  );
}

/** Pill button that navigates to an app route (renders an <a href> on web). */
export function LinkButton({ href, ...look }: ButtonLookProps & { href: Href }) {
  return (
    <Link href={href} asChild>
      <Pressable role="link">{(state) => <ButtonFace {...look} state={state} />}</Pressable>
    </Link>
  );
}

/** Pill button that runs an action (e.g. scroll to a section). */
export function ActionButton({ onPress, ...look }: ButtonLookProps & { onPress: () => void }) {
  return (
    <Pressable role="button" onPress={onPress}>
      {(state) => <ButtonFace {...look} state={state} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: webStyle({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderStyle: 'solid',
    cursor: 'pointer',
    userSelect: 'none',
    transitionProperty: 'transform, box-shadow, background-color, border-color',
    transitionDuration: '220ms',
    transitionTimingFunction: EASE_OUT,
  }),
  md: { height: 48, paddingHorizontal: 22 },
  sm: { height: 38, paddingHorizontal: 16 },
  label: { fontFamily: FONT.sans, fontSize: 15, fontWeight: '600', letterSpacing: -0.1 },
  labelSm: { fontSize: 14 },
  lift: { transform: [{ translateY: -1 }] },
  pressed: { transform: [{ translateY: 0 }, { scale: 0.98 }] },
  focusRing: webStyle({ outlineStyle: 'solid', outlineWidth: 3, outlineColor: `${C.primary}55`, outlineOffset: 2 }),
  arrow: webStyle({ transitionProperty: 'transform', transitionDuration: '220ms', transitionTimingFunction: EASE_OUT }),
  arrowHover: { transform: [{ translateX: 3 }] },
});

const FACE = StyleSheet.create({
  primary: {
    backgroundColor: C.primary,
    borderColor: C.primary,
    shadowColor: C.primary,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  secondary: { backgroundColor: `${C.surface}cc`, borderColor: C.lineStrong },
  inverse: { backgroundColor: C.inverse, borderColor: C.inverse },
});

const HOVER = StyleSheet.create({
  primary: { shadowOpacity: 0.4, shadowRadius: 22, shadowOffset: { width: 0, height: 10 } },
  secondary: { backgroundColor: C.surface, borderColor: C.faint },
  inverse: { backgroundColor: C.surface, borderColor: C.surface },
});
