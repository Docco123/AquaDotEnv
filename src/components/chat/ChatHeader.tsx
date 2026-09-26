import { Pressable, StyleSheet, Text, View } from 'react-native';
import { isActivePermit } from '@/lib/ai/digest';
import { C, FONT, SPACE } from '@/theme';
import type { UpstreamFacility, UpstreamTrace } from '@/types';
import { CHAT } from './config';
import { CloseIcon } from './icons';

/** "About: Charles River · 42 active permits · <facility>" */
export function chatSubtitle(trace: UpstreamTrace, facility: UpstreamFacility | null): string {
  const place = trace.pin.waterName ?? trace.pin.huc12Name ?? 'this stream';
  const active = trace.summary.activeTotal ?? trace.facilities.filter(isActivePermit).length;
  const permits = `${active} active permit${active === 1 ? '' : 's'}`;
  return `About: ${place} · ${permits}${facility ? ` · ${facility.name}` : ''}`;
}

interface Props {
  trace: UpstreamTrace;
  facility: UpstreamFacility | null;
  onClose(): void;
}

export function ChatHeader({ trace, facility, onClose }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.titles}>
        <Text style={styles.title} accessibilityRole="header">
          {CHAT.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {chatSubtitle(trace, facility)}
        </Text>
      </View>
      <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close chat" hitSlop={8} style={styles.close}>
        <CloseIcon size={16} color={C.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.md,
    paddingLeft: SPACE.lg,
    paddingRight: SPACE.md,
    paddingVertical: SPACE.md,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  titles: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontFamily: FONT.sans, fontSize: 14, fontWeight: '600', color: C.text },
  subtitle: { fontFamily: FONT.sans, fontSize: 12, color: C.muted },
  close: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
});
