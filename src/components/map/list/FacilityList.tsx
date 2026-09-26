import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { ActionLink, Card, Chip, FadeIn, Section, T } from '@/components/ui';
import type { FacilityFiltersModel } from '@/hooks/useFacilityFilters';
import { LIST } from '@/map/config';
import { C, FONT, RADIUS, SPACE } from '@/theme';
import { CollapsedGroup } from './CollapsedGroup';
import { FacilityRow } from './FacilityRow';

const NO_MONITORING_NOTE =
  "These permits exist in EPA ECHO but file no discharge monitoring reports, so 'no violations' means 'no data', not 'clean'.";
const INACTIVE_NOTE = 'No longer in force per ECHO; kept for history.';

interface Props {
  model: FacilityFiltersModel;
  onSelect(id: string): void;
}

/** "Who's upstream": filters, risk-sorted rows, and quiet permits collapsed into one line. */
export function FacilityList({ model, onSelect }: Props) {
  const [limit, setLimit] = useState<number>(LIST.pageSize);
  const { filters, toggle, setText, shown, quiet, inactive, total, showQuiet, toggleQuiet, showInactive, toggleInactive } =
    model;

  return (
    <Section title="Who's upstream" right={<Text style={[T.small, T.num]}>{`${shown.length} of ${total}`}</Text>}>
      <View style={styles.chips}>
        <Chip label="Violations only" active={filters.violationsOnly} onPress={() => toggle('violationsOnly')} />
        <Chip label="Majors" active={filters.majorsOnly} onPress={() => toggle('majorsOnly')} />
        <Chip label="Hide unmonitored general" active={filters.hideQuiet} onPress={() => toggle('hideQuiet')} />
      </View>
      <TextInput
        value={filters.text}
        onChangeText={setText}
        placeholder="Filter by name, permit, city, water…"
        placeholderTextColor={C.faint}
        accessibilityLabel="Filter dischargers"
        style={styles.filter}
      />
      <Card style={styles.card}>
        {shown.length === 0 && quiet.length === 0 && inactive.length === 0 && (
          <Text style={[T.small, styles.empty]}>No dischargers match these filters.</Text>
        )}
        {shown.slice(0, limit).map((f, i) =>
          i < LIST.staggerMax ? (
            <FadeIn key={f.id} delay={i * LIST.staggerStepMs}>
              <FacilityRow facility={f} onPress={onSelect} />
            </FadeIn>
          ) : (
            <FacilityRow key={f.id} facility={f} onPress={onSelect} />
          ),
        )}
        {shown.length > limit && (
          <View style={styles.more}>
            <ActionLink label={`Show ${shown.length - limit} more`} onPress={() => setLimit(limit + LIST.pageSize)} />
          </View>
        )}
        <CollapsedGroup
          items={quiet}
          noun="general/stormwater permit with no monitoring data"
          explanation={NO_MONITORING_NOTE}
          open={showQuiet}
          onToggle={toggleQuiet}
          onSelect={onSelect}
        />
        <CollapsedGroup
          items={inactive}
          noun="expired or terminated permit"
          explanation={INACTIVE_NOTE}
          open={showInactive}
          onToggle={toggleInactive}
          onSelect={onSelect}
        />
      </Card>
    </Section>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
  filter: {
    height: 34,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACE.md,
    backgroundColor: C.surface,
    color: C.text,
    fontFamily: FONT.sans,
    fontSize: 13,
    outlineWidth: 0,
  },
  card: { paddingVertical: SPACE.xs, paddingHorizontal: SPACE.md },
  empty: { paddingVertical: SPACE.md },
  more: { paddingVertical: SPACE.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
});
