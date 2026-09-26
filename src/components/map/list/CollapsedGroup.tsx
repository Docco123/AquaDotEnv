import { Pressable, StyleSheet, Text, View } from 'react-native';
import { T } from '@/components/ui';
import { C, SPACE } from '@/theme';
import type { UpstreamFacility } from '@/types';
import { FacilityRow } from './FacilityRow';

interface Props {
  items: UpstreamFacility[];
  /** e.g. "general/stormwater permit with no monitoring data" (singular; pluralized here). */
  noun: string;
  explanation: string;
  open: boolean;
  onToggle(): void;
  onSelect(id: string): void;
}

const plural = (n: number, noun: string) => (n === 1 ? noun : noun.replace(/permit/, 'permits'));

/** One quiet line standing in for a group of low-signal permits; expands to dimmed rows. */
export function CollapsedGroup({ items, noun, explanation, open, onToggle, onSelect }: Props) {
  if (items.length === 0) return null;
  return (
    <View>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.head}
      >
        <Text style={T.small}>
          {items.length} {plural(items.length, noun)} · <Text style={T.link}>{open ? 'hide' : 'show'}</Text>
        </Text>
        <Text style={T.tiny}>{explanation}</Text>
      </Pressable>
      {open && items.map((f) => <FacilityRow key={f.id} facility={f} onPress={onSelect} dimmed />)}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { gap: 2, paddingVertical: SPACE.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
});
