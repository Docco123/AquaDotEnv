import { SHADOW } from '@/theme';

/** "#0b6bcb" + 0.2 → "rgba(11, 107, 203, 0.2)". Keeps translucent colors derived from theme tokens. */
export function alpha(hex: string, opacity: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.slice(0, 6);
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${opacity})`;
}

type ShadowToken = (typeof SHADOW)[keyof typeof SHADOW];

/** CSS box-shadow string from a theme SHADOW token (react-native-web prefers boxShadow). */
export function boxShadow(token: ShadowToken): string {
  const { width, height } = token.shadowOffset;
  return `${width}px ${height}px ${token.shadowRadius}px ${alpha(token.shadowColor, token.shadowOpacity)}`;
}

export const ELEVATION = {
  card: { boxShadow: boxShadow(SHADOW.card) },
  float: { boxShadow: boxShadow(SHADOW.float) },
} as const;
