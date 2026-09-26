import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ELEVATION } from '@/components/ui/color';
import type { TraceState } from '@/hooks/useTrace';
import { stageLabel } from '@/map/stages';
import { C, FONT, RADIUS, SPACE } from '@/theme';

/** Floating hint over the map: how to start, or what the trace is doing right now. */
export function MapStatusPill({ state }: { state: TraceState }) {
  if (state.status === 'ready' || state.status === 'error') return null;
  const tracing = state.status === 'tracing';
  const label = tracing ? `${stageLabel(state.stage, state.request.distanceKm)}…` : 'Click any river or stream to trace upstream';
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.pill}>
        {tracing && <ActivityIndicator size="small" color={C.inverse} />}
        <Text style={styles.text}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: SPACE.md, left: 0, right: 0, alignItems: 'center', zIndex: 1000 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingHorizontal: SPACE.lg,
    paddingVertical: SPACE.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: C.navy,
    ...ELEVATION.float,
  },
  text: { color: C.inverse, fontFamily: FONT.sans, fontSize: 13, fontWeight: '600' },
});
