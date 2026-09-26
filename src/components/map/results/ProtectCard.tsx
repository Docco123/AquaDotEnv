import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionLink, Card, T } from '@/components/ui';
import { buildProtectiveActions } from '@/lib/protect';
import { FONT, SPACE } from '@/theme';
import type { UpstreamTrace } from '@/types';
import { ProtectActionRow } from './ProtectActionRow';

const COLLAPSED_COUNT = 4;

/** What a person at the pin should do, derived from the upstream permit records (src/lib/protect.ts). */
export function ProtectCard({ trace }: { trace: UpstreamTrace }) {
  const actions = useMemo(() => buildProtectiveActions(trace), [trace]);
  // Expansion belongs to one trace; a new trace starts collapsed.
  const [expandedFor, setExpandedFor] = useState<UpstreamTrace | null>(null);
  const expanded = expandedFor === trace;
  if (!actions.length) return null;

  const shown = expanded ? actions : actions.slice(0, COLLAPSED_COUNT);
  const canToggle = actions.length > COLLAPSED_COUNT;

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Protect yourself</Text>
        <Text style={T.tiny}>Based on the permits and records upstream of this pin. Not medical advice; follow official advisories.</Text>
      </View>
      <View>
        {shown.map((a, i) => (
          <ProtectActionRow key={a.id} action={a} compact={!expanded} first={i === 0} />
        ))}
      </View>
      {canToggle && (
        <ActionLink
          label={expanded ? 'Show fewer' : `Show all ${actions.length}`}
          onPress={() => setExpandedFor(expanded ? null : trace)}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: SPACE.sm },
  head: { gap: 2 },
  title: { ...T.display, fontFamily: FONT.display, fontSize: 18, lineHeight: 24 },
});
