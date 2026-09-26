import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActionLink, Card, ErrorNote } from '@/components/ui';
import type { MapTool } from '@/hooks/useMapTool';
import { C, SPACE } from '@/theme';
import { EmptyState } from './panel/EmptyState';
import { TraceProgress } from './panel/TraceProgress';
import { TraceResults } from './results/TraceResults';

/** Right-hand (or bottom) panel: empty → progress → results | error. */
export function MapPanel({ tool }: { tool: MapTool }) {
  const { state, selected, filters, dropPin, clearPin, retry, selectFacility } = tool;
  const scroller = useRef<ScrollView>(null);
  const selectedId = selected?.id ?? null;

  useEffect(() => {
    scroller.current?.scrollTo({ y: 0, animated: false });
  }, [selectedId, state.status]);

  return (
    <ScrollView ref={scroller} style={styles.scroll} contentContainerStyle={styles.content}>
      {state.status === 'idle' && <EmptyState onPick={(lat, lng) => dropPin(lat, lng)} />}
      {state.status === 'tracing' && (
        <TraceProgress
          lat={state.request.lat}
          lng={state.request.lng}
          distanceKm={state.request.distanceKm}
          stage={state.stage}
          detail={state.detail}
          onCancel={clearPin}
        />
      )}
      {state.status === 'error' && (
        <Card style={styles.errorCard}>
          <ErrorNote message={state.message} onRetry={retry} />
          <View style={styles.errorActions}>
            <ActionLink label="Clear pin" onPress={clearPin} />
          </View>
        </Card>
      )}
      {state.status === 'ready' && (
        <TraceResults
          key={state.trace.generatedAt}
          trace={state.trace}
          selected={selected}
          filters={filters}
          onSelect={(id) => selectFacility(id, true)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.background },
  content: { padding: SPACE.lg, paddingBottom: SPACE.xxl },
  errorCard: { gap: SPACE.md },
  errorActions: { flexDirection: 'row', gap: SPACE.lg },
});
