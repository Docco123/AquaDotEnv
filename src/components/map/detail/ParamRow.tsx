import { Pressable, StyleSheet, Text, View } from 'react-native';
import { T } from '@/components/ui';
import { C, COMPLIANCE, RADIUS, SPACE, fmtNum } from '@/theme';
import type { DmrParameter, DmrValue } from '@/types';

const valueText = (v: DmrValue) => (v.value !== null ? `${fmtNum(v.value)} ${v.unit ?? ''}`.trim() : (v.nodi ?? '—'));

function ValueLine({ v }: { v: DmrValue }) {
  const color = v.violation ? COMPLIANCE.effluent.color : C.text;
  return (
    <View style={styles.valueLine}>
      <Text style={[T.small, T.num, styles.period]}>{v.period.slice(0, 7)}</Text>
      <Text style={[T.small, styles.stat]} numberOfLines={1}>
        {v.stat}
      </Text>
      <Text style={[T.small, T.num, styles.value, { color }, v.violation && styles.bold]}>
        {valueText(v)}
        {v.limit !== null ? ` / limit ${fmtNum(v.limit)}` : ''}
        {v.exceedPct ? ` (+${v.exceedPct}%)` : ''}
      </Text>
    </View>
  );
}

/** One monitored parameter; tap to see every reported value. */
export function ParamRow({ p, open, onToggle }: { p: DmrParameter; open: boolean; onToggle(): void }) {
  const l = p.latest;
  return (
    <View style={styles.row}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.head}>
        <View style={styles.headText}>
          <Text style={[T.body, styles.bold]}>{p.name}</Text>
          <Text style={T.tiny}>
            Outfall {p.outfall} · {p.location}
          </Text>
          {l && (
            <Text style={[T.small, T.num]}>
              Latest {l.period.slice(0, 7)}: {valueText(l)} ({l.stat})
              {l.limit !== null ? ` · limit ${fmtNum(l.limit)} ${l.limitUnit ?? ''}` : ''}
            </Text>
          )}
        </View>
        {p.exceedances > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{p.exceedances} over</Text>
          </View>
        )}
      </Pressable>
      {open && (
        <View style={styles.values}>
          {p.values.map((v, i) => (
            <ValueLine key={`${v.period}-${v.stat}-${i}`} v={v} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.sm, paddingVertical: SPACE.sm },
  headText: { flex: 1, gap: 2 },
  bold: { fontWeight: '600' },
  badge: { backgroundColor: COMPLIANCE.effluent.color, borderRadius: RADIUS.pill, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { color: C.surface, fontSize: 11, fontWeight: '700' },
  values: { paddingBottom: SPACE.sm, gap: 2 },
  valueLine: { flexDirection: 'row', gap: 6 },
  period: { width: 58 },
  stat: { width: 84 },
  value: { flex: 1 },
});
