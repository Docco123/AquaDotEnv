import { StyleSheet, Text, View } from 'react-native';
import { C, FONT, RADIUS } from '@/theme';
import { PulseDot } from '@/components/motion';

type BadgeKind = 'live' | 'coming' | 'example';

const LABEL: Record<BadgeKind, string> = { live: 'Live', coming: 'Coming', example: 'Example' };
const TONE: Record<BadgeKind, string> = { live: C.secondary, coming: C.faint, example: C.accent };

/** Status pill: "Live" (pulsing teal), "Coming" (muted), or "Example" (illustrative content). */
export function Badge({ kind }: { kind: BadgeKind }) {
  const tone = TONE[kind];
  return (
    <View style={[styles.badge, { backgroundColor: `${tone}14`, borderColor: `${tone}40` }]}>
      {kind === 'live' ? <PulseDot color={tone} size={6} /> : <View style={[styles.dot, { backgroundColor: tone }]} />}
      <Text style={[styles.text, { color: kind === 'coming' ? C.muted : tone }]}>{LABEL[kind]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontFamily: FONT.mono, fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
});
