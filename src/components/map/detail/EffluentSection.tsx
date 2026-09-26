import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionLink, Card, Chip, ErrorNote, Loading, Section, T } from '@/components/ui';
import { useEffluent } from '@/hooks/useFacilityData';
import { SPACE } from '@/theme';
import type { DmrParameter } from '@/types';
import { ParamRow } from './ParamRow';

const PAGE = 25;
const paramKey = (p: DmrParameter) => `${p.outfall}-${p.code}-${p.location}`;

/** "Discharge monitoring, last 12 months": DMR parameters, exceedances first. */
export function EffluentSection({ permitId }: { permitId: string }) {
  const { data, error, loading, retry } = useEffluent(permitId);
  const [exceedOnly, setExceedOnly] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);

  const all = data?.parameters ?? [];
  const exceedCount = all.reduce((n, p) => n + p.exceedances, 0);
  const params = exceedOnly ? all.filter((p) => p.exceedances > 0) : all;
  const chip =
    exceedCount > 0 ? (
      <Chip label={`Exceedances · ${exceedCount}`} active={exceedOnly} onPress={() => setExceedOnly(!exceedOnly)} />
    ) : undefined;

  return (
    <Section title="Discharge monitoring, last 12 months" right={chip}>
      <Card style={styles.card}>
        {loading && <Loading label="Loading discharge reports from EPA ECHO…" />}
        {error && <ErrorNote message={`Couldn't load discharge reports: ${error}`} onRetry={retry} />}
        {data && all.length === 0 && (
          <Text style={T.small}>
            No discharge monitoring reports in the last 12 months. General and stormwater permits usually report outside
            EPA&apos;s system.
          </Text>
        )}
        {data && all.length > 0 && (
          <View>
            <Text style={[T.tiny, styles.intro]}>
              {data.start} – {data.end} · {all.length} monitored parameters. Tap one to see each reported value.
            </Text>
            {params.slice(0, limit).map((p) => {
              const key = paramKey(p);
              return (
                <ParamRow key={key} p={p} open={openKey === key} onToggle={() => setOpenKey(openKey === key ? null : key)} />
              );
            })}
            {params.length > limit && (
              <View style={styles.more}>
                <ActionLink label={`Show ${params.length - limit} more`} onPress={() => setLimit(limit + PAGE)} />
              </View>
            )}
          </View>
        )}
      </Card>
    </Section>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: SPACE.md },
  intro: { marginBottom: SPACE.sm },
  more: { paddingTop: SPACE.md },
});
