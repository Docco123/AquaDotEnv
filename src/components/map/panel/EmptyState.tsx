import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Section, T } from '@/components/ui';
import { EXAMPLES } from '@/map/examples';
import { C, SPACE } from '@/theme';

/** No pin yet: what to do, plus one-tap examples. */
export function EmptyState({ onPick }: { onPick(lat: number, lng: number): void }) {
  return (
    <View style={styles.stack}>
      <Card style={styles.intro}>
        <Text style={T.display}>Drop a pin on any US stream</Text>
        <Text style={T.body}>
          Click a river, creek or lake on the map, or search an address. We follow the water upstream and list every
          EPA-permitted discharger along the way, with its violation record and how long a spill would take to reach you.
        </Text>
      </Card>
      <Section title="Try an example">
        <Card style={styles.list}>
          {EXAMPLES.map((ex, i) => (
            <Pressable
              key={ex.id}
              onPress={() => onPick(ex.lat, ex.lng)}
              accessibilityRole="button"
              style={[styles.row, i > 0 && styles.divider]}
            >
              <View style={styles.rowText}>
                <Text style={[T.body, styles.rowTitle]}>{ex.label}</Text>
                <Text style={T.small}>{ex.detail}</Text>
              </View>
              <Text style={T.link}>→</Text>
            </Pressable>
          ))}
        </Card>
      </Section>
      <Text style={T.tiny}>
        Data: USGS NLDI / NHDPlus river network, EPA ECHO permits and compliance, USGS stream gauges. Public, keyless,
        queried live.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: SPACE.lg },
  intro: { gap: SPACE.sm },
  list: { paddingVertical: SPACE.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, paddingVertical: SPACE.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontWeight: '600' },
});
