import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ActionLink, Card, T } from '@/components/ui';
import { formatLatLng } from '@/map/format';
import { TRACE_STEPS, stepIndex } from '@/map/stages';
import { C, SPACE } from '@/theme';
import type { TraceStage } from '@/types';

interface Props {
  lat: number;
  lng: number;
  distanceKm: number;
  stage: TraceStage;
  detail: string | null;
  onCancel(): void;
}

/** Stepper shown while a trace runs. */
export function TraceProgress({ lat, lng, distanceKm, stage, detail, onCancel }: Props) {
  const current = stepIndex(stage);
  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={T.title}>Tracing upstream</Text>
          <Text style={[T.small, T.num]}>From {formatLatLng(lat, lng)}</Text>
        </View>
        <ActionLink label="Cancel" onPress={onCancel} />
      </View>
      {TRACE_STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <View key={step.stage} style={styles.step} accessibilityState={{ busy: active }}>
            <View style={styles.icon}>
              {active ? (
                <ActivityIndicator size="small" color={C.primary} />
              ) : (
                <View style={[styles.dot, done && styles.dotDone]}>{done && <Text style={styles.check}>✓</Text>}</View>
              )}
            </View>
            <View style={styles.stepText}>
              <Text style={[T.body, !done && !active && { color: C.faint }, active && styles.activeLabel]}>
                {step.label(distanceKm)}
              </Text>
              {active && !!detail && <Text style={T.small}>{detail}</Text>}
            </View>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: SPACE.md },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.md },
  headText: { flex: 1, gap: 2 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.md },
  icon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: C.secondary, borderColor: C.secondary },
  check: { color: C.surface, fontSize: 10, fontWeight: '800', lineHeight: 12 },
  stepText: { flex: 1, gap: 2 },
  activeLabel: { fontWeight: '600' },
});
