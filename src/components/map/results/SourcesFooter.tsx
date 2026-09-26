import { StyleSheet, Text, View } from 'react-native';
import { T } from '@/components/ui';
import { shortDateTime } from '@/map/format';
import { SPACE } from '@/theme';
import type { UpstreamTrace } from '@/types';

export function SourcesFooter({ trace }: { trace: UpstreamTrace }) {
  return (
    <View style={styles.footer}>
      <Text style={T.label}>Sources</Text>
      {trace.sources.map((s) => (
        <Text key={s} style={T.tiny}>
          {s}
        </Text>
      ))}
      <Text style={T.tiny}>Generated {shortDateTime(trace.generatedAt) ?? trace.generatedAt}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { gap: SPACE.xs, paddingTop: SPACE.sm },
});
