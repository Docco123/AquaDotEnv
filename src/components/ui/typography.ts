import { StyleSheet } from 'react-native';
import { C, FONT } from '@/theme';

/** Shared text styles. RN-web does not inherit the body font, so every style sets fontFamily. */
export const T = StyleSheet.create({
  display: { fontFamily: FONT.display, fontSize: 22, lineHeight: 28, fontWeight: '600', color: C.text },
  title: { fontFamily: FONT.sans, fontSize: 15, lineHeight: 20, fontWeight: '700', color: C.text },
  body: { fontFamily: FONT.sans, fontSize: 14, lineHeight: 20, color: C.text },
  label: {
    fontFamily: FONT.sans,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: C.muted,
  },
  small: { fontFamily: FONT.sans, fontSize: 12, lineHeight: 17, color: C.muted },
  tiny: { fontFamily: FONT.sans, fontSize: 11, lineHeight: 15, color: C.faint },
  link: { fontFamily: FONT.sans, fontSize: 13, fontWeight: '600', color: C.primary },
  mono: { fontFamily: FONT.mono, fontSize: 11, color: C.muted },
  num: { fontVariant: ['tabular-nums'] },
});
