import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { C, COMPLIANCE } from '../theme';
import type { ComplianceClass } from '../types';

export function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Chip({ label, active, onPress, color }: { label: string; active: boolean; onPress(): void; color?: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.chip, active && { backgroundColor: color ?? C.accent, borderColor: color ?? C.accent }]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
    >
      <Text style={[s.chipText, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function Dot({ cls, size = 10 }: { cls: ComplianceClass; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: COMPLIANCE[cls].color }} />;
}

export function Stat({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export function Loading({ label }: { label: string }) {
  return (
    <View style={s.loading}>
      <ActivityIndicator color={C.accent} />
      <Text style={s.muted}>{label}</Text>
    </View>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?(): void }) {
  return (
    <View style={s.error}>
      <Text style={s.errorText}>{message}</Text>
      {onRetry && (
        <Pressable onPress={onRetry}>
          <Text style={s.link}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

/** Horizontal bar used for pollutant loads. */
export function Bar({ fraction, color = C.accent }: { fraction: number; color?: string }) {
  return (
    <View style={s.barTrack}>
      <View style={[s.barFill, { width: `${Math.max(2, fraction * 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

export const s = StyleSheet.create({
  section: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.ink, textTransform: 'uppercase', letterSpacing: 0.4 },
  chip: { borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: C.card },
  chipText: { fontSize: 12, color: C.ink, fontWeight: '500' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stat: { flexGrow: 1, flexBasis: '40%', backgroundColor: C.bg, borderRadius: 8, padding: 10 },
  statValue: { fontSize: 20, fontWeight: '700', color: C.ink, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 11, color: C.muted, marginTop: 2 },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  loading: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 16 },
  muted: { color: C.muted, fontSize: 13 },
  small: { color: C.muted, fontSize: 11 },
  body: { color: C.ink, fontSize: 14, lineHeight: 20 },
  error: { margin: 16, padding: 12, borderRadius: 8, backgroundColor: '#fff4e6', gap: 6 },
  errorText: { color: '#8a3b00', fontSize: 13 },
  link: { color: C.accent, fontWeight: '600', fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
  rowTitle: { fontSize: 14, color: C.ink, fontWeight: '600' },
  barTrack: { height: 6, backgroundColor: '#edf1f4', borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  barFill: { height: 6, borderRadius: 3 },
});
