import type { CSSProperties } from 'react';
import type { TextStyle, ViewStyle } from 'react-native';

/** react-native-web extension: keyframes are compiled to a CSS @keyframes rule (StyleSheet.create only). */
export type Keyframes = Record<string, CSSProperties>;

export type WebCSS = CSSProperties & {
  animationKeyframes?: Keyframes | Keyframes[];
};

/** Typed escape hatch for web-only CSS that react-native-web passes through but RN's types don't know. */
export function webStyle(css: WebCSS): ViewStyle {
  return css as unknown as ViewStyle;
}

/** Same as webStyle, typed for <Text>. */
export function webTextStyle(css: WebCSS): TextStyle {
  return css as unknown as TextStyle;
}

/** Shared easing: a soft "expo out" curve used by every reveal. */
export const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
