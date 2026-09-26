import { StyleSheet, type TextProps } from 'react-native';
import { C, FONT } from '@/theme';

/** Semantic heading props for react-native-web (renders <h1>…<h3>). */
export function headingProps(level: 1 | 2 | 3): TextProps {
  return { role: 'heading', 'aria-level': level } as TextProps;
}

export const TYPE = StyleSheet.create({
  eyebrow: {
    fontFamily: FONT.mono,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: C.primary,
  },
  h2: {
    fontFamily: FONT.display,
    fontWeight: '500',
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.8,
    color: C.text,
  },
  h2Wide: { fontSize: 48, lineHeight: 54, letterSpacing: -1.4 },
  h3: {
    fontFamily: FONT.display,
    fontWeight: '500',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: C.text,
  },
  lede: { fontFamily: FONT.sans, fontSize: 18, lineHeight: 29, color: C.muted },
  body: { fontFamily: FONT.sans, fontSize: 16, lineHeight: 26, color: C.muted },
  small: { fontFamily: FONT.sans, fontSize: 14, lineHeight: 22, color: C.muted },
  mono: { fontFamily: FONT.mono, fontSize: 12, letterSpacing: 0.4, color: C.faint },
});
