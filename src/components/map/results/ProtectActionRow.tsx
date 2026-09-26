import { StyleSheet, Text, View } from 'react-native';
import { alpha, ExternalLink, T } from '@/components/ui';
import type { ActionPriority, ProtectiveAction } from '@/lib/protect';
import { C, FONT, RADIUS, RISK, SPACE } from '@/theme';

const PRIORITY: Record<ActionPriority, { label: string; color: string }> = {
  now: { label: 'Now', color: C.accent },
  soon: { label: 'Soon', color: RISK.watch.color },
  routine: { label: 'Routine', color: C.muted },
};

function PriorityPill({ priority }: { priority: ActionPriority }) {
  const { label, color } = PRIORITY[priority];
  return (
    <View style={[styles.pill, { backgroundColor: alpha(color, 0.12) }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

/** One protective action: priority, title, what to do, and the data fact behind it. Compact rows clamp long text. */
export function ProtectActionRow({ action, compact, first }: { action: ProtectiveAction; compact: boolean; first: boolean }) {
  const lines = (n: number) => (compact ? n : undefined);
  return (
    <View style={[styles.row, !first && styles.divider]}>
      <View style={styles.head}>
        <PriorityPill priority={action.priority} />
        <Text style={styles.title} numberOfLines={lines(2)}>
          {action.title}
        </Text>
      </View>
      <Text style={styles.detail} numberOfLines={lines(2)}>
        {action.detail}
      </Text>
      <Text style={styles.why} numberOfLines={lines(1)}>
        Why: {action.why}
      </Text>
      {!compact && action.link && <ExternalLink label={action.link.label} url={action.link.url} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 3, paddingVertical: SPACE.sm },
  divider: { borderTopWidth: 1, borderTopColor: C.line },
  head: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  pill: { borderRadius: RADIUS.pill, paddingHorizontal: 7, paddingVertical: 2 },
  pillText: { fontFamily: FONT.sans, fontSize: 10, lineHeight: 13, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  title: { ...T.body, fontWeight: '700', flexShrink: 1 },
  detail: { fontFamily: FONT.sans, fontSize: 13, lineHeight: 18, color: C.text },
  why: { ...T.tiny, color: C.muted },
});
